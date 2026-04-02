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

/**
 * POST /api/superadmin/comms/send
 * Sends a bulk email campaign to a list of consented contacts.
 * Requires RESEND_API_KEY or SENDGRID_API_KEY in system_settings or env.
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

  // Get email service config from system_settings or env
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: settingsRows } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['RESEND_API_KEY', 'SENDGRID_API_KEY', 'COMMS_FROM_EMAIL'])

  const dbSettings: Record<string, string> = Object.fromEntries(
    (settingsRows ?? []).map((r: any) => [r.key, r.value])
  )

  const resendKey = dbSettings['RESEND_API_KEY'] || process.env.RESEND_API_KEY
  const sendgridKey = dbSettings['SENDGRID_API_KEY'] || process.env.SENDGRID_API_KEY
  const fromEmail = dbSettings['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || 'noreply@turnapp.com'

  if (!resendKey && !sendgridKey) {
    // Simulate send for demo (no real email service configured)
    const validContacts = (contacts as ContactItem[]).filter(c => c.customer_email)
    return NextResponse.json({
      sent: validContacts.length,
      failed: 0,
      demo: true,
      note: 'No se configuró RESEND_API_KEY ni SENDGRID_API_KEY. Configúralos en Integraciones para enviar correos reales.',
    })
  }

  const validContacts = (contacts as ContactItem[]).filter(c => c.customer_email)
  let sent = 0
  let failed = 0

  for (const contact of validContacts) {
    const personalizedBody = body.replace(/\{\{nombre\}\}/g, contact.customer_name)

    try {
      if (resendKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: contact.customer_email,
            subject,
            html: personalizedBody,
          }),
        })
        if (res.ok) sent++; else failed++
      } else if (sendgridKey) {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: contact.customer_email, name: contact.customer_name }] }],
            from: { email: fromEmail },
            subject,
            content: [{ type: 'text/html', value: personalizedBody }],
          }),
        })
        if (res.status < 300) sent++; else failed++
      }
    } catch {
      failed++
    }
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
  } catch {} // ignore if table doesn't exist yet

  return NextResponse.json({ sent, failed })
}
