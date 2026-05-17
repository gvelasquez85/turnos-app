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
  'han', 'que', 'no', 'tu', 'te', 'mi', 'fue', 'son', 'hay', 'he', 'ha',
  'the', 'you', 'can', 'do', 'it', 'is', 'are', 'be',
])

// Normaliza texto: minúsculas, sin tildes, sin puntuación
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
}

// Tokeniza y filtra stopwords + palabras muy cortas
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

// Puntúa qué tan relevante es un párrafo para la pregunta
function scoreRelevance(queryTokens: string[], paraTokens: string[]): number {
  if (paraTokens.length === 0) return 0
  const paraSet = new Set(paraTokens)
  let hits = 0
  for (const token of queryTokens) {
    if (paraSet.has(token)) hits++
  }
  // Normaliza por longitud de query; penaliza párrafos muy cortos o muy largos
  const lengthFactor = paraTokens.length < 4 ? 0.2
    : paraTokens.length > 120 ? 0.75
    : 1.0
  return (hits / Math.max(queryTokens.length, 1)) * lengthFactor
}

interface ScoredParagraph {
  text: string
  score: number
  articleTitle: string
  articleSlug: string
  index: number  // position in article (to recover neighbors)
}

// Motor extractivo principal
function extractAnswer(
  articles: any[],
  question: string
): { answer: string; sources: string[] } {
  const queryTokens = tokenize(question)

  if (queryTokens.length === 0 || articles.length === 0) {
    return {
      answer: 'No encontré información sobre eso en el centro de ayuda. Te recomiendo contactar a nuestro soporte.',
      sources: [],
    }
  }

  // Construir lista de párrafos con puntuación
  const scored: ScoredParagraph[] = []

  for (const article of articles) {
    const text = htmlToText(article.body)
    const paragraphs = text
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 30)

    paragraphs.forEach((para, idx) => {
      const tokens = tokenize(para)
      const score = scoreRelevance(queryTokens, tokens)
      if (score > 0) {
        scored.push({
          text: para,
          score,
          articleTitle: article.title,
          articleSlug: article.slug,
          index: idx,
        })
      }
    })
  }

  // Sin resultados relevantes
  if (scored.length === 0) {
    return {
      answer: 'No encontré información sobre eso en el centro de ayuda. Te recomiendo contactar a nuestro soporte.',
      sources: [],
    }
  }

  // Ordenar por score descendente
  scored.sort((a, b) => b.score - a.score)

  // Tomar el mejor párrafo como ancla
  const best = scored[0]

  // Buscar hasta 2 párrafos más del mismo artículo con buen score
  const companions = scored
    .filter(p =>
      p !== best &&
      p.articleTitle === best.articleTitle &&
      p.score >= best.score * 0.5 &&
      Math.abs(p.index - best.index) <= 4  // párrafos cercanos en el artículo
    )
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)  // restaurar orden original

  // Ensamblar la respuesta
  const allParts = [best, ...companions].sort((a, b) => a.index - b.index)
  const body = allParts.map(p => p.text).join('\n\n')

  // Fuentes únicas
  const sources = [...new Set(scored.slice(0, 3).map(p => p.articleTitle))]

  return { answer: body, sources }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json()

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'No question provided' }), { status: 400 })
    }

    // Usar cliente anon — artículos son públicos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Buscar artículos relevantes con FTS
    const { data: articles, error } = await supabase.rpc('search_help_articles', {
      p_query: question.slice(0, 200),
      p_limit: 5,
    })

    if (error) console.error('[Help Ask] FTS error:', error)

    // Motor extractivo local — sin API externa
    const { answer, sources } = extractAnswer(articles ?? [], question)

    // Añadir fuentes al final como metadata
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
