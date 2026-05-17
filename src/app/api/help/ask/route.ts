import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 10

// ─── Spanish stopwords ────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'un', 'por',
  'con', 'una', 'su', 'para', 'es', 'al', 'lo', 'como', 'mas', 'pero', 'sus',
  'le', 'ya', 'o', 'este', 'si', 'porque', 'esta', 'entre', 'cuando', 'muy',
  'sin', 'sobre', 'ser', 'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde',
  'han', 'que', 'no', 'tu', 'te', 'mi', 'fue', 'son', 'he', 'ha',
])

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
}

// Convierte HTML a texto preservando estructura de párrafos/listas
function htmlToText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/?(p|div|h[1-6]|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function scoreRelevance(queryTokens: string[], text: string): number {
  const paraTokens = tokenize(text)
  if (paraTokens.length === 0) return 0
  const paraSet = new Set(paraTokens)
  let hits = 0
  for (const token of queryTokens) {
    if (paraSet.has(token)) hits++
  }
  const lengthFactor = paraTokens.length < 4 ? 0.2
    : paraTokens.length > 120 ? 0.75
    : 1.0
  return (hits / Math.max(queryTokens.length, 1)) * lengthFactor
}

function extractAnswer(articles: any[], question: string): { answer: string; sources: string[] } {
  const queryTokens = tokenize(question)

  if (articles.length === 0) {
    return {
      answer: 'No encontré información sobre eso en el centro de ayuda. Te recomiendo contactar a nuestro soporte.',
      sources: [],
    }
  }

  // Si no hay tokens útiles en la pregunta, devolver el primer artículo completo
  if (queryTokens.length === 0) {
    const art = articles[0]
    return {
      answer: htmlToText(art.body).slice(0, 600),
      sources: [art.title],
    }
  }

  interface ScoredPara { text: string; score: number; articleTitle: string; idx: number }
  const scored: ScoredPara[] = []

  for (const article of articles) {
    // Bonus de título: si la pregunta coincide con el título, todo el artículo sube de score
    const titleBonus = scoreRelevance(queryTokens, article.title) * 0.3

    const text = htmlToText(article.body)
    const paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 20)

    paragraphs.forEach((para, idx) => {
      const score = scoreRelevance(queryTokens, para) + titleBonus
      scored.push({ text: para, score, articleTitle: article.title, idx })
    })
  }

  // Ordenar por score
  scored.sort((a, b) => b.score - a.score)

  // Si el mejor score es muy bajo, usar el summary del artículo más rankeado por FTS
  if (scored.length === 0 || scored[0].score < 0.05) {
    const art = articles[0]
    const fallback = art.summary
      ? art.summary
      : htmlToText(art.body).split('\n').filter((p: string) => p.length > 20).slice(0, 3).join('\n\n')
    return {
      answer: fallback,
      sources: articles.slice(0, 2).map((a: any) => a.title),
    }
  }

  // Tomar el mejor párrafo + párrafos cercanos del mismo artículo con score decente
  const best = scored[0]
  const companions = scored
    .filter(p =>
      p !== best &&
      p.articleTitle === best.articleTitle &&
      p.score >= best.score * 0.4 &&
      Math.abs(p.idx - best.idx) <= 5
    )
    .slice(0, 2)
    .sort((a, b) => a.idx - b.idx)

  const allParts = [best, ...companions].sort((a, b) => a.idx - b.idx)
  const answer = allParts.map(p => p.text).join('\n\n')

  const sources = [...new Set(scored.slice(0, 3).map(p => p.articleTitle))]

  return { answer, sources }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'No question provided' }), { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Intentar con FTS primero
    let articles: any[] | null = null
    const { data: ftsData, error: ftsError } = await supabase.rpc('search_help_articles', {
      p_query: question.slice(0, 200),
      p_limit: 5,
    })

    if (ftsError) {
      console.warn('[Help Ask] FTS RPC failed, falling back to ilike search:', ftsError.message)
    }

    if (ftsData && ftsData.length > 0) {
      articles = ftsData
    } else {
      // Fallback: búsqueda simple por ILIKE en título y summary
      const words = question.trim().split(/\s+/).slice(0, 4).join(' ')
      const { data: ilikeData } = await supabase
        .from('help_articles')
        .select('id, slug, title, summary, body, category')
        .eq('published', true)
        .or(`title.ilike.%${words}%,summary.ilike.%${words}%`)
        .limit(5)
      articles = ilikeData ?? []
    }

    console.log(`[Help Ask] "${question}" → ${articles.length} articles found`)

    const { answer, sources } = extractAnswer(articles, question)

    const fullResponse = sources.length > 0
      ? `${answer}\n\n<!--SOURCES:${JSON.stringify(sources)}-->`
      : answer

    return new Response(fullResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('[Help Ask]', err)
    return new Response(
      JSON.stringify({ error: 'assistant_error', message: err.message }),
      { status: 500 }
    )
  }
}
