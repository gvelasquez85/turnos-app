import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') return null
  return user
}

export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to } = await req.json().catch(() => ({}))
  if (!to) return NextResponse.json({ error: 'Campo "to" requerido' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: rows } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])

  const db: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value])
  )

  const rawKey   = db['BREVO_API_KEY']    || process.env.BREVO_API_KEY || ''
  const brevoKey = rawKey.trim()           // remove accidental whitespace
  const fromEmail = (db['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || '').trim()
  const fromName  = (db['COMMS_FROM_NAME']  || process.env.COMMS_FROM_NAME  || 'TurnFlow').trim()

  // Mask key for display: show first 6 + last 4 chars
  const maskedKey = brevoKey.length > 10
    ? brevoKey.slice(0, 6) + '••••••••' + brevoKey.slice(-4)
    : brevoKey ? '(clave demasiado corta)' : '(vacía)'

  const diagnostics: Record<string, any> = {
    key_used: maskedKey,
    key_source: db['BREVO_API_KEY'] ? 'base de datos' : (process.env.BREVO_API_KEY ? 'variable de entorno' : 'no encontrada'),
    key_length: brevoKey.length,
    from_email: fromEmail || '(no configurado)',
    from_name: fromName,
    to,
  }

  if (!brevoKey) {
    return NextResponse.json({ ok: false, step: 'config', error: 'BREVO_API_KEY no configurada', diagnostics })
  }
  if (!fromEmail) {
    return NextResponse.json({ ok: false, step: 'config', error: 'COMMS_FROM_EMAIL no configurado', diagnostics })
  }

  // Call Brevo
  let httpStatus = 0
  let brevoResponse: any = null
  let fetchError: string | null = null

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to, name: to }],
        subject: '✅ Test TurnFlow — Brevo',
        htmlContent: '<p>Correo de prueba desde <strong>TurnFlow</strong>. Si lo recibes, Brevo está bien configurado.</p>',
      }),
    })

    httpStatus = res.status
    const rawText = await res.text()
    try { brevoResponse = JSON.parse(rawText) } catch { brevoResponse = rawText }

    diagnostics.http_status = httpStatus
    diagnostics.brevo_response = brevoResponse

    // Brevo returns 201 + { messageId } on real success
    const messageId = brevoResponse?.messageId as string | undefined
    const realSuccess = (httpStatus === 201 || httpStatus === 200) && !!messageId

    if (realSuccess) {
      return NextResponse.json({
        ok: true,
        message: `Email enviado — messageId: ${messageId}`,
        diagnostics,
      })
    }

    // HTTP 2xx but no messageId — something is off
    if (res.ok) {
      return NextResponse.json({
        ok: false,
        step: 'brevo_response',
        error: `Brevo respondió HTTP ${httpStatus} pero sin messageId. Verifica que el sender (${fromEmail}) esté verificado en Brevo.`,
        diagnostics,
      })
    }

    // HTTP error
    const brevoMessage = brevoResponse?.message || brevoResponse?.error || JSON.stringify(brevoResponse)
    let hint = ''
    if (httpStatus === 401) hint = 'API key inválida o expirada. Crea una nueva en Brevo → SMTP & API → API Keys.'
    else if (httpStatus === 400) hint = `El sender "${fromEmail}" probablemente no está verificado como dominio/sender en Brevo.`
    else if (httpStatus === 402) hint = 'Límite de envíos alcanzado en tu plan de Brevo.'
    else if (httpStatus === 403) hint = 'Tu cuenta de Brevo no tiene permisos para envío transaccional.'

    return NextResponse.json({
      ok: false,
      step: 'brevo_api',
      error: `Brevo respondió HTTP ${httpStatus}: ${brevoMessage}${hint ? ` — ${hint}` : ''}`,
      diagnostics,
    })

  } catch (e: any) {
    fetchError = e?.message
    diagnostics.fetch_error = fetchError
    return NextResponse.json({
      ok: false,
      step: 'network',
      error: `No se pudo conectar con la API de Brevo: ${fetchError}`,
      diagnostics,
    })
  }
}
