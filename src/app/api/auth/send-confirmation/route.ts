import { NextRequest, NextResponse } from 'next/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/send-confirmation
 * Sends a branded confirmation email via Brevo after signup.
 * Body: { email: string, fullName: string }
 *
 * Uses Supabase Admin API to generate the confirmation link,
 * then sends it via Brevo instead of Supabase's own mailer.
 */
export async function POST(req: NextRequest) {
  const { email, fullName } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Get Brevo config from system_settings (fallback to env vars)
  const { data: rows } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])

  const settings = Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value]))
  const brevoKey  = settings['BREVO_API_KEY']  || process.env.BREVO_API_KEY || ''
  const fromEmail = settings['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || 'noreply@turnflow.com.co'
  const fromName  = settings['COMMS_FROM_NAME']  || process.env.COMMS_FROM_NAME  || 'TurnFlow'

  if (!brevoKey) {
    // No Brevo key — fall back silently (Supabase already sent its own email)
    return NextResponse.json({ ok: true, method: 'supabase_fallback' })
  }

  // 2. Generate a confirmation link via Supabase Admin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.turnflow.com.co'
  const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    // Could not generate link (user may not exist yet or already confirmed)
    return NextResponse.json({ ok: true, method: 'skipped', reason: linkError?.message })
  }

  const confirmUrl = linkData.properties.action_link
  const name = fullName || email.split('@')[0]

  // 3. Send branded email via Brevo
  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7ff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px;text-align:center;">
            <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.15);border-radius:14px;margin-bottom:12px;">
              <div style="padding:10px;">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                  <rect x="10" y="11" width="20" height="3.5" rx="1.75" fill="white"/>
                  <rect x="18.25" y="11" width="3.5" height="15" rx="1.75" fill="white"/>
                  <circle cx="13" cy="32" r="2.2" fill="white" fill-opacity="0.65"/>
                  <circle cx="20" cy="32" r="2.2" fill="white" fill-opacity="0.65"/>
                  <circle cx="27" cy="32" r="2.2" fill="white" fill-opacity="0.65"/>
                </svg>
              </div>
            </div>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">TurnFlow</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">¡Bienvenido, ${name}!</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
              Gracias por registrarte en TurnFlow. Solo falta un paso: confirma tu correo electrónico para activar tu cuenta.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${confirmUrl}"
                style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                Activar mi cuenta →
              </a>
            </div>
            <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;text-align:center;">
              Este enlace expira en 24 horas.
            </p>
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              Si no creaste esta cuenta, puedes ignorar este correo.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">
              © ${new Date().getFullYear()} TurnFlow · Gestión inteligente de clientes
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email, name }],
      subject: `Activa tu cuenta en TurnFlow`,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[send-confirmation] Brevo error:', errBody)
    return NextResponse.json({ ok: false, error: 'Error enviando correo' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, method: 'brevo' })
}
