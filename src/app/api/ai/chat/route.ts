import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// ─── Plan limits ─────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:    { daily: 5,   modules: ['home'],                    history: false },
  managed: { daily: 50,  modules: null /* all */,              history: true  },
  byok:    { daily: 500, modules: null /* all */,              history: true  },
} as const

// ─── System prompt factory ────────────────────────────────────────────────────
function buildSystemPrompt(moduleKey: string, contextData: string, brandName: string): string {
  return `Eres Copilot, el asistente de inteligencia artificial de TurnFlow para el negocio "${brandName}".

REGLAS ESTRICTAS — nunca las ignores:
1. Solo puedes responder preguntas sobre los datos que se te entregan en <context>.
2. No respondas preguntas fuera del contexto del negocio (películas, política, programación, etc.).
3. Si el usuario pregunta algo que no está en los datos, responde: "Solo puedo ayudarte con los datos actuales de tu cuenta."
4. Sé directo, breve y accionable. Usa máximo 4 oraciones por respuesta.
5. Cuando detectes oportunidades, sugiere acciones concretas (ej: "Podrías hacer una promoción de...").
6. Habla siempre en español, con tono profesional pero cercano.
7. Nunca inventes datos ni hagas suposiciones fuera del contexto dado.

Módulo actual: ${moduleKey}

<context>
${contextData}
</context>`
}

// ─── Throttle check ───────────────────────────────────────────────────────────
async function checkAndIncrementUsage(
  supabase: any,
  brandId: string,
  dailyLimit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date().toISOString().slice(0, 10)

  // Atomic upsert: insert with count=1, or increment if exists
  const { data } = await supabase.rpc('increment_ai_usage', {
    p_brand_id: brandId,
    p_date: today,
  })

  const count = data ?? 1
  const allowed = count <= dailyLimit
  return { allowed, remaining: Math.max(0, dailyLimit - count) }
}

// ─── Call Claude (Anthropic SDK-free approach — direct fetch) ─────────────────
async function callClaude(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string
): Promise<ReadableStream> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  return streamAnthropicToText(response.body!)
}

// ─── Call OpenAI ──────────────────────────────────────────────────────────────
async function callOpenAI(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  model: string,
  apiKey: string
): Promise<ReadableStream> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${err}`)
  }

  return streamOpenAIToText(response.body!)
}

// ─── Stream transformers ──────────────────────────────────────────────────────
function streamAnthropicToText(body: ReadableStream<Uint8Array>): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = body.getReader()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { controller.close(); return }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            if (json.type === 'content_block_delta' && json.delta?.text) {
              controller.enqueue(encoder.encode(json.delta.text))
            }
          } catch { /* skip malformed */ }
        }
      }
    },
    cancel() { reader.cancel() },
  })
}

function streamOpenAIToText(body: ReadableStream<Uint8Array>): ReadableStream {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = body.getReader()

  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { controller.close(); return }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            const text = json.choices?.[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(text))
          } catch { /* skip malformed */ }
        }
      }
    },
    cancel() { reader.cancel() },
  })
}

// ─── Decrypt BYOK key (simple base64 for now — swap for real encryption in prod) ──
function decryptKey(encrypted: string): string {
  try { return Buffer.from(encrypted, 'base64').toString('utf8') }
  catch { return encrypted }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('brand_id, role').eq('id', user.id).single()
    if (!profile?.brand_id) return new Response('No brand', { status: 403 })

    const brandId = profile.brand_id

    const { data: brand } = await supabase
      .from('brands').select('name').eq('id', brandId).single()

    // Load AI config (defaults to free plan if no row exists)
    const { data: aiConfig } = await supabase
      .from('ai_configs').select('*').eq('brand_id', brandId).maybeSingle()

    const plan = (aiConfig?.plan ?? 'free') as keyof typeof PLAN_LIMITS
    const planConfig = PLAN_LIMITS[plan]
    const dailyLimit = aiConfig?.daily_limit ?? planConfig.daily

    // Parse request body
    const body = await req.json()
    const { messages, moduleKey, contextData } = body as {
      messages: { role: string; content: string }[]
      moduleKey: string
      contextData: string
    }

    // Check module access for free plan
    if (plan === 'free' && planConfig.modules !== null && !(planConfig.modules as unknown as string[]).includes(moduleKey)) {
      return new Response(
        JSON.stringify({ error: 'upgrade_required', module: moduleKey }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Enforce single-shot for free (no history)
    const effectiveMessages = plan === 'free'
      ? [messages[messages.length - 1]] // only last message
      : messages.slice(-10)             // sliding window of 10 turns

    // Throttle check
    const { allowed, remaining } = await checkAndIncrementUsage(supabase, brandId, dailyLimit)
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'daily_limit_reached', limit: dailyLimit }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build system prompt with context — truncate contextData to ~3500 chars
    const safeContext = (contextData ?? '').slice(0, 3500)
    const systemPrompt = buildSystemPrompt(moduleKey, safeContext, brand?.name ?? 'tu negocio')

    // Determine provider + key + model
    let stream: ReadableStream

    if (plan === 'byok' && aiConfig?.api_key_encrypted && aiConfig?.provider !== 'turnflow') {
      const apiKey = decryptKey(aiConfig.api_key_encrypted)
      const model = aiConfig.model_preference ?? 'gpt-4o-mini'

      if (aiConfig.provider === 'openai') {
        stream = await callOpenAI(systemPrompt, effectiveMessages, model, apiKey)
      } else {
        // anthropic BYOK
        stream = await callClaude(systemPrompt, effectiveMessages, model, apiKey)
      }
    } else {
      // TurnFlow managed: use platform Anthropic key + Haiku
      const apiKey = process.env.ANTHROPIC_API_KEY!
      const model = 'claude-3-5-haiku-20241022'
      stream = await callClaude(systemPrompt, effectiveMessages, model, apiKey)
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Copilot-Remaining': String(remaining),
        'X-Copilot-Plan': plan,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err: any) {
    console.error('[AI Copilot]', err)
    return new Response(
      JSON.stringify({ error: 'ai_error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
