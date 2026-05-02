import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { context, tone = 'amigable', type = 'reactivation' } = body
  // context: { clientName, daysSince, lastService, businessName, businessType, phone }

  if (!context?.clientName) return NextResponse.json({ error: 'Falta clientName' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load API key from settings or env
  const { data: settings } = await service
    .from('system_settings').select('key, value')
    .in('key', ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY'])
  const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]))
  const anthropicKey = (cfg['ANTHROPIC_API_KEY'] || process.env.ANTHROPIC_API_KEY || '').trim()
  const openaiKey = (cfg['OPENAI_API_KEY'] || process.env.OPENAI_API_KEY || '').trim()

  // Build brand context
  const brandId = profile.brand_id
  let brandName = context.businessName || 'el negocio'
  let businessType = context.businessType || 'otros'
  if (brandId) {
    const { data: brand } = await service
      .from('brands').select('name, business_type').eq('id', brandId).single()
    if (brand) {
      brandName = brand.name
      businessType = (brand as any).business_type || 'otros'
    }
  }

  // Build message prompt
  const typePrompts: Record<string, string> = {
    reactivation: `El cliente lleva ${context.daysSince ?? 'varios'} días sin volver. Escribe un mensaje cálido para invitarlo a regresar.`,
    quote_followup: `El cliente recibió una cotización hace ${context.daysSince ?? 'varios'} días y no ha respondido. Escribe un mensaje de seguimiento amable.`,
    birthday: `Es el cumpleaños del cliente. Escribe un mensaje de felicitación y aprovecha para ofrecerle algo especial.`,
    promo: `Escribe un mensaje para invitar al cliente a aprovechar una promoción especial del negocio.`,
    thanks: `El cliente acaba de hacer una compra o visita. Escribe un mensaje de agradecimiento que invite a volver.`,
    appointment_reminder: `El cliente tiene una cita próxima. Escribe un mensaje de recordatorio amable.`,
  }

  const businessVocab: Record<string, string> = {
    belleza: 'peluquería/estética (servicios como manicure, corte, tinte, tratamientos)',
    restaurante: 'restaurante o cafetería',
    ferreteria: 'ferretería o taller de reparaciones',
    tienda: 'tienda o comercio',
    servicios: 'negocio de servicios profesionales',
    otros: 'pequeño negocio',
  }

  const prompt = `Eres el asistente de mensajes de WhatsApp de "${brandName}", un ${businessVocab[businessType] || 'negocio'} en Colombia.

Contexto del cliente:
- Nombre: ${context.clientName}
- Último servicio/compra: ${context.lastService || 'no especificado'}
- Días desde última visita: ${context.daysSince ?? 'no especificado'}

Tarea: ${typePrompts[type] || typePrompts.reactivation}

Instrucciones:
- Tono: ${tone} (no formal/empresarial, natural como lo escribe un dueño de negocio)
- Máximo 3 oraciones. No uses emojis excesivos (máximo 2).
- No uses "Estimado/a" ni "Cordialmente". Usa el nombre directamente.
- No incluyas el número de teléfono ni URLs.
- Escribe SOLO el mensaje, sin explicaciones, sin comillas, sin título.
- En Colombia se tutea. Usa "tú" no "usted".

Escribe solo el mensaje de WhatsApp:`

  let message = ''

  // Try Anthropic first, then OpenAI, then fallback
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        message = data.content?.[0]?.text?.trim() ?? ''
      }
    } catch {}
  }

  if (!message && openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (res.ok) {
        const data = await res.json()
        message = data.choices?.[0]?.message?.content?.trim() ?? ''
      }
    } catch {}
  }

  // Fallback: template-based message (no AI key needed)
  if (!message) {
    const templates: Record<string, string> = {
      reactivation: `Hola ${context.clientName} 👋 Hace tiempo no te vemos por ${brandName}. ¿Cuándo pasas? Te esperamos con lo de siempre 😊`,
      quote_followup: `Hola ${context.clientName}, te escribo para saber si pudiste revisar la cotización que te enviamos. Cualquier duda me cuentas.`,
      birthday: `Hola ${context.clientName}, hoy es tu día 🎂 Te deseamos un feliz cumpleaños. Pásate por ${brandName} y te tenemos una sorpresa 🎉`,
      promo: `Hola ${context.clientName} 👋 Tenemos una promo especial esta semana en ${brandName}. ¿Te animas a pasar?`,
      thanks: `Hola ${context.clientName}, gracias por visitarnos hoy 🙏 Fue un placer atenderte. Te esperamos pronto.`,
      appointment_reminder: `Hola ${context.clientName}, te recuerdo tu cita de mañana en ${brandName}. ¿Confirmas que vas a poder venir?`,
    }
    message = templates[type] || templates.reactivation
  }

  return NextResponse.json({ ok: true, message, usedAI: !!(anthropicKey || openaiKey) })
}
