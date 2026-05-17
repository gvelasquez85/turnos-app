import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 25

const SYSTEM_PROMPT = `Eres el Asistente de Ayuda de TurnFlow. Tu único trabajo es ayudar a los usuarios a entender cómo usar TurnFlow basándote EXCLUSIVAMENTE en los artículos del centro de ayuda que se te proveen.

REGLAS QUE NUNCA PUEDES ROMPER:
1. Solo responde con información que esté en los artículos de ayuda provistos en <articulos>.
2. Si la pregunta no tiene respuesta en los artículos, di exactamente: "No encontré información sobre eso en el centro de ayuda. Te recomiendo contactar a nuestro soporte."
3. Nunca inventes pasos, funciones o características que no estén documentadas.
4. Responde SIEMPRE en español, con tono amigable y claro.
5. Usa lenguaje simple — como si le explicaras a alguien que no usa mucho el computador.
6. Cuando hay pasos, preséntalos numerados y concisos.
7. Si el artículo menciona dónde hacer clic, inclúyelo en la respuesta.
8. Máximo 150 palabras en la respuesta — sé conciso pero completo.
9. Si el usuario necesita más detalle, sugiere que lea el artículo completo con su nombre.

Recuerda: tu meta es que el usuario pueda lograr lo que necesita SIN tener que contactar a soporte.`

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500) // limit per article
}

export async function POST(req: NextRequest) {
  try {
    const { question, conversationHistory = [] } = await req.json()

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: 'No question provided' }), { status: 400 })
    }

    // Use anon client — help articles are publicly readable
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Search relevant articles using FTS RPC
    const { data: articles } = await supabase.rpc('search_help_articles', {
      p_query: question.slice(0, 200),
      p_limit: 4,
    })

    // Build context from found articles
    let articlesContext = ''
    if (articles && articles.length > 0) {
      articlesContext = articles.map((a: any, i: number) =>
        `--- Artículo ${i + 1}: "${a.title}" ---\n${stripHtml(a.body)}`
      ).join('\n\n')
    } else {
      articlesContext = 'No se encontraron artículos relacionados con esta pregunta.'
    }

    const fullSystem = `${SYSTEM_PROMPT}\n\n<articulos>\n${articlesContext}\n</articulos>`

    // Build message history (max 6 turns for assistant context)
    const history = (conversationHistory as { role: string; content: string }[])
      .slice(-6)
      .filter(m => m.role === 'user' || m.role === 'assistant')

    const messages = [
      ...history,
      { role: 'user', content: question },
    ]

    // Call Claude Haiku streaming
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      console.error('[Help Ask] ANTHROPIC_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'config_error', message: 'API key not configured' }), { status: 500 })
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 400,
        system: fullSystem,
        messages,
        stream: true,
      }),
    })

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text()
      console.error('[Help Ask] Anthropic API error:', anthropicRes.status, errBody)
      throw new Error(`Anthropic error ${anthropicRes.status}: ${errBody}`)
    }

    // Stream text back + include source article titles as metadata at the end
    const sourceTitles = articles?.map((a: any) => a.title) ?? []
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    const reader = anthropicRes.body!.getReader()

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6))
              if (json.type === 'content_block_delta' && json.delta?.text) {
                controller.enqueue(encoder.encode(json.delta.text))
              }
            } catch { /* skip */ }
          }
        }
        // Send sources as a special JSON line at the very end
        if (sourceTitles.length > 0) {
          controller.enqueue(encoder.encode(
            `\n\n<!--SOURCES:${JSON.stringify(sourceTitles)}-->`
          ))
        }
        controller.close()
      },
      cancel() { reader.cancel() },
    })

    return new Response(stream, {
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
