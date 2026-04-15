import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface ContactItem {
  id: string
  customer_name: string
  customer_email: string | null
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') return null
  return user
}

async function sendViaBrevo(
  apiKey: string,
  from: string,
  fromName: string,
  to: string,
  toName: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: from },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  })
  return res.ok
}

async function sendViaResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  return res.ok
}

async function sendViaSendGrid(
  apiKey: string,
  from: string,
  to: string,
  toName: string,
  subject: string,
  html: string,
): Promise<boolean> {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: toName }] }],
      from: { email: from },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
  return res.status < 300
}

/**
 * POST /api/superadmin/comms/send
 * Sends a bulk email campaign to a list of consented contacts.
 * Priority: Brevo → Resend → SendGrid → demo mode
 *
 * Body: { brand_id, subject, body (HTML), contacts: ContactItem[] }
 */
export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { brand_id, subject, body, contacts } = await req.json().catch(() => ({}))
  if (!brand_id || !subject || !body || !Array.isArray(contacts)) {
    return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 })
  }

  // Load email service config from system_settings (DB override) or env vars
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: settingsRows } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['BREVO_API_KEY', 'RESEND_API_KEY', 'SENDGRID_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])

  const db: Record<string, string> = Object.fromEntries(
    (settingsRows ?? []).map((r: any) => [r.key, r.value])
  )

  const brevoKey    = db['BREVO_API_KEY']    || process.env.BREVO_API_KEY
  const resendKey   = db['RESEND_API_KEY']   || process.env.RESEND_API_KEY
  const sendgridKey = db['SENDGRID_API_KEY'] || process.env.SENDGRID_API_KEY
  const fromEmail   = db['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || 'noreply@turnflow.co'
  const fromName    = db['COMMS_FROM_NAME']  || process.env.COMMS_FROM_NAME  || 'TurnFlow'

  const validContacts = (contacts as ContactItem[]).filter(c => c.customer_email)

  if (!brevoKey && !resendKey && !sendgridKey) {
    return NextResponse.json({
      sent: validContacts.length,
      failed: 0,
      demo: true,
      note: 'No hay proveedor de email configurado. Agrega BREVO_API_KEY en Configuración → Integraciones.',
    })
  }

  let sent = 0
  let failed = 0

  for (const contact of validContacts) {
    const personalizedHtml = body.replace(/\{\{nombre\}\}/g, contact.customer_name)
    let ok = false

    try {
      if (brevoKey) {
        ok = await sendViaBrevo(brevoKey, fromEmail, fromName, contact.customer_email!, contact.customer_name, subject, personalizedHtml)
      } else if (resendKey) {
        ok = await sendViaResend(resendKey, fromEmail, contact.customer_email!, subject, personalizedHtml)
      } else if (sendgridKey) {
        ok = await sendViaSendGrid(sendgridKey, fromEmail, contact.customer_email!, contact.customer_name, subject, personalizedHtml)
      }
    } catch {
      ok = false
    }

    if (ok) sent++; else failed++
  }

  // Log the campaign
  try {
    await service.from('comms_campaigns').insert({
      brand_id,
      subject,
      sent_to: sent,
      failed,
      sent_by: user.id,
      sent_at: new Date().toISOString(),
    })
  } catch {} // ignore if table doesn't exist

  return NextResponse.json({ sent, failed })
}
