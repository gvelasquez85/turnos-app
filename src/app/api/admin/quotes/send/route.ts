import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { quoteId, recipientEmail, recipientName, subject, message } = body

  if (!quoteId || !recipientEmail)
    return NextResponse.json({ error: 'Faltan parámetros: quoteId, recipientEmail' }, { status: 400 })

  // Load quote + brand settings
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load Brevo settings
  const { data: settings } = await service
    .from('system_settings')
    .select('key, value')
    .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])

  const cfg: Record<string, string> = Object.fromEntries(
    (settings ?? []).map((r: any) => [r.key, r.value])
  )
  const brevoKey = (cfg['BREVO_API_KEY'] || process.env.BREVO_API_KEY || '').trim()
  const fromEmail = (cfg['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || '').trim()
  const fromName = (cfg['COMMS_FROM_NAME'] || process.env.COMMS_FROM_NAME || 'TurnFlow').trim()

  if (!brevoKey || !fromEmail) {
    return NextResponse.json({ error: 'El envío de correos no está configurado. Contacta a soporte.' }, { status: 503 })
  }

  // Load quote items for email body + brand
  const { data: quote } = await service
    .from('sales')
    .select('id, total, subtotal, discount, notes, created_at, brand_id, customers(name, email), brands(logo_url, name)')
    .eq('id', quoteId)
    .single()

  const brand = (quote as any)?.brands

  const { data: items } = await service
    .from('sale_items')
    .select('product_name, qty, unit_price, line_total')
    .eq('sale_id', quoteId)

  // Build tracking token (use the quote ID as token — simple)
  const trackingToken = quoteId
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.turnflow.co'
  const trackingPixelUrl = `${appUrl}/api/quotes/track/${trackingToken}`
  const quotePublicUrl = `${appUrl}/cotizacion/${trackingToken}`

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const itemsHtml = (items ?? []).map(it =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${it.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${it.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(it.line_total)}</td>
    </tr>`
  ).join('')

  const quoteDate = new Date(quote?.created_at ?? Date.now()).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const brandColor = '#4F46E5' // Indigo default; could use brands.primary_color if added to schema
  const logoUrl = (brand as any)?.logo_url || ''

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <div style="background:${brandColor};padding:28px 32px;display:flex;align-items:center;gap:16px;">
    ${logoUrl ? `<img src="${logoUrl}" style="height:40px;object-fit:contain;" alt="Logo" />` : ''}
    <div>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Cotización</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:24px;font-weight:800;">
        # COT-${quoteId.slice(-6).toUpperCase()}
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${quoteDate}</p>
    </div>
  </div>

  <div style="padding:28px 32px;">
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      Hola <strong>${recipientName || 'estimado cliente'}</strong>,
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      ${message || 'Te hacemos llegar la cotización que solicitaste. A continuación encontrarás el detalle de los productos y servicios incluidos.'}
    </p>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Descripción</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Cant.</th>
          <th style="padding:10px 12px;text-align:right;color:#6b7280;font-weight:600;border-bottom:2px solid #e5e7eb;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        ${(quote?.discount ?? 0) > 0 ? `<tr><td colspan="2" style="padding:8px 12px;text-align:right;color:#6b7280;">Descuento:</td><td style="padding:8px 12px;text-align:right;color:#dc2626;">−${fmt(quote?.discount ?? 0)}</td></tr>` : ''}
        <tr style="background:${brandColor};">
          <td colspan="2" style="padding:12px;color:#fff;font-weight:700;border-radius:0 0 0 8px;">Total</td>
          <td style="padding:12px;color:#fff;font-weight:800;font-size:16px;text-align:right;border-radius:0 0 8px 0;">${fmt(quote?.total ?? 0)}</td>
        </tr>
      </tfoot>
    </table>

    ${(quote?.notes) ? `
    <div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border-radius:8px;border-left:3px solid ${brandColor};">
      <p style="margin:0;font-size:12px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:1px;">Notas</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${quote.notes}</p>
    </div>` : ''}

    <!-- CTA -->
    <div style="margin-top:28px;text-align:center;">
      <a href="${quotePublicUrl}"
         style="display:inline-block;background:${brandColor};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">
        Ver cotización completa →
      </a>
    </div>

    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
      Si tienes preguntas, responde directamente a este correo.
    </p>
  </div>

  <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Generado con TurnFlow · ${fromName}</p>
  </div>
</div>
<!-- Open tracking pixel -->
<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none"/>
</body>
</html>`

  // Send via Brevo
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': brevoKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: recipientEmail, name: recipientName || recipientEmail }],
      subject: subject || `Cotización # COT-${quoteId.slice(-6).toUpperCase()} de ${fromName}`,
      htmlContent,
    }),
  })

  const brevoBody = await res.json().catch(() => ({}))

  if (!res.ok) {
    console.error('Brevo error:', res.status, brevoBody)
    return NextResponse.json({
      error: `Error al enviar: ${brevoBody?.message || res.status}`,
    }, { status: 502 })
  }

  // Update quote: status=sent, sent_at, sent_to_email
  await service.from('sales').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_to_email: recipientEmail,
  }).eq('id', quoteId)

  return NextResponse.json({ ok: true, messageId: brevoBody?.messageId })
}
