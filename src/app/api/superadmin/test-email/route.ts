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

/**
 * POST /api/superadmin/test-email
 * Sends a test email via Brevo and returns full diagnostics.
 * Body: { to: "email@example.com" }
 */
export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { to } = await req.json().catch(() => ({}))
  if (!to) return NextResponse.json({ error: 'Campo "to" requerido' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load config
  const { data: rows } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])

  const db: Record<string, string> = Object.fromEntries(
    (rows ?? []).map((r: any) => [r.key, r.value])
  )

  const brevoKey  = db['BREVO_API_KEY']    || process.env.BREVO_API_KEY
  const fromEmail = db['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL
  const fromName  = db['COMMS_FROM_NAME']  || process.env.COMMS_FROM_NAME || 'TurnApp'

  const diagnostics: Record<string, any> = {
    brevo_key_configured: !!brevoKey,
    brevo_key_source: db['BREVO_API_KEY'] ? 'db' : (process.env.BREVO_API_KEY ? 'env' : 'missing'),
    from_email: fromEmail || '(no configurado)',
    from_name: fromName,
    to,
  }

  if (!brevoKey) {
    return NextResponse.json({
      ok: false,
      error: 'BREVO_API_KEY no configurada. Ve a Superadmin → Configuración → Integraciones → Brevo.',
      diagnostics,
    })
  }

  if (!fromEmail) {
    return NextResponse.json({
      ok: false,
      error: 'COMMS_FROM_EMAIL no configurado. Ve a Superadmin → Configuración → Integraciones → Brevo.',
      diagnostics,
    })
  }

  // Try sending
  let brevoStatus = 0
  let brevoBody: any = null
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
        subject: '✅ Test TurnApp — Brevo configurado correctamente',
        htmlContent: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5">¡Brevo funciona! 🎉</h2>
            <p>Este es un correo de prueba enviado desde <strong>TurnApp</strong>.</p>
            <p style="color:#6b7280;font-size:14px">
              Si recibiste este mensaje, la integración con Brevo está correctamente configurada
              y los correos de campañas llegarán sin problemas.
            </p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
            <p style="color:#9ca3af;font-size:12px">TurnApp · Sistema de turnos</p>
          </div>
        `,
      }),
    })
    brevoStatus = res.status
    try { brevoBody = await res.json() } catch { brevoBody = await res.text() }

    diagnostics.brevo_http_status = brevoStatus
    diagnostics.brevo_response = brevoBody

    if (res.ok) {
      return NextResponse.json({ ok: true, message: `Correo enviado a ${to}`, diagnostics })
    } else {
      return NextResponse.json({
        ok: false,
        error: `Brevo rechazó el envío (HTTP ${brevoStatus})`,
        diagnostics,
      })
    }
  } catch (e: any) {
    diagnostics.fetch_error = e?.message
    return NextResponse.json({ ok: false, error: 'Error de red al conectar con Brevo', diagnostics })
  }
}
