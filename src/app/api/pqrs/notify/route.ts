import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/pqrs/notify
 * Internal endpoint to send PQRS notification emails.
 * Uses Resend or similar email service.
 */
export async function POST(req: NextRequest) {
  const { type, to, subject, body, radicado, caseId, brandId } = await req.json().catch(() => ({}))

  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  // Use Resend if available, otherwise log
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log(`[PQRS Email] To: ${to}, Subject: ${subject}`)
    return NextResponse.json({ ok: true, method: 'logged' })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'PQRS <noreply@turnflow.app>',
        to: [to],
        subject,
        text: body,
      }),
    })

    const result = await res.json()
    return NextResponse.json({ ok: res.ok, emailId: result.id })
  } catch (err: any) {
    console.error('[PQRS Email Error]', err.message)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
