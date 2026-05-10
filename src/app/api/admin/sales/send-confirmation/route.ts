import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { saleId } = await req.json().catch(() => ({}))
  if (!saleId) return NextResponse.json({ error: 'Falta saleId' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load sale + items + customer + brand
  const { data: sale } = await service
    .from('sales')
    .select('id, total, subtotal, discount, notes, created_at, brand_id, customers(name, email), brands(name, logo_url, primary_color)')
    .eq('id', saleId)
    .single()

  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  const { data: items } = await service
    .from('sale_items')
    .select('product_name, product_sku, qty, unit_price, line_total')
    .eq('sale_id', saleId)

  // Load Brevo settings
  const { data: settings } = await service
    .from('system_settings').select('key, value')
    .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])
  const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]))
  const brevoKey = (cfg['BREVO_API_KEY'] || process.env.BREVO_API_KEY || '').trim()
  const fromEmail = (cfg['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || '').trim()
  const brand = (sale as any)?.brands
  const fromName = (cfg['COMMS_FROM_NAME'] || process.env.COMMS_FROM_NAME || brand?.name || 'TurnFlow').trim()

  if (!brevoKey || !fromEmail) {
    return NextResponse.json({ error: 'Email no configurado' }, { status: 503 })
  }

  const customer = (sale as any)?.customers
  if (!customer?.email) {
    return NextResponse.json({ ok: true, msg: 'Sin email de cliente' })
  }

  const brandColor = brand?.primary_color || '#4F46E5'
  const logoUrl = brand?.logo_url || ''

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const itemsHtml = (items ?? []).map(it =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${it.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${it.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmt(it.line_total)}</td>
    </tr>`
  ).join('')

  const saleDate = new Date(sale.created_at).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <div style="background:${brandColor};padding:28px 32px;display:flex;align-items:center;gap:16px;">
    ${logoUrl ? `<img src="${logoUrl}" style="height:40px;object-fit:contain;" alt="Logo" />` : ''}
    <div>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;letter-spacing:2px;text-transform:uppercase;">Confirmación de venta</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:24px;font-weight:800;">
        # VTA-${saleId.slice(-6).toUpperCase()}
      </h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${saleDate}</p>
    </div>
  </div>

  <div style="padding:28px 32px;">
    <p style="margin:0 0 16px;color:#374151;font-size:15px;">
      ¡Hola <strong>${customer.name}</strong>! 🎉
    </p>
    <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.6;">
      <strong>¡Gracias por tu compra en ${brand?.name || fromName}!</strong> Hiciste una excelente elección.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      A continuación encontrarás el resumen de tu pedido. Guarda este correo como comprobante.
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
        ${(sale.discount ?? 0) > 0 ? `<tr><td colspan="2" style="padding:8px 12px;text-align:right;color:#6b7280;">Descuento:</td><td style="padding:8px 12px;text-align:right;color:#dc2626;">−${fmt(sale.discount)}</td></tr>` : ''}
        <tr style="background:${brandColor};">
          <td colspan="2" style="padding:12px;color:#fff;font-weight:700;border-radius:0 0 0 8px;">Total</td>
          <td style="padding:12px;color:#fff;font-weight:800;font-size:16px;text-align:right;border-radius:0 0 8px 0;">${fmt(sale.total)}</td>
        </tr>
      </tfoot>
    </table>

    ${(sale.notes) ? `
    <div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border-radius:8px;border-left:3px solid ${brandColor};">
      <p style="margin:0;font-size:12px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:1px;">Notas</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${sale.notes}</p>
    </div>` : ''}

    <!-- Help section -->
    <div style="margin-top:24px;padding:16px 20px;background:#eff6ff;border-radius:8px;text-align:center;">
      <p style="margin:0 0 4px;color:#1e40af;font-size:14px;font-weight:600;">¿Necesitas ayuda con tu pedido?</p>
      <p style="margin:0;color:#3b82f6;font-size:13px;line-height:1.5;">
        Si tienes alguna pregunta sobre tu compra, simplemente responde a este correo y te atenderemos con gusto.
      </p>
    </div>

    <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
      Gracias por confiar en <strong style="color:#6b7280;">${brand?.name || fromName}</strong>. ¡Esperamos verte pronto!
    </p>
  </div>

  <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;">${brand?.name || fromName}</p>
    <p style="margin:0;font-size:11px;color:#9ca3af;">Potenciado por TurnFlow</p>
  </div>
</div>
</body>
</html>`

  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: customer.email, name: customer.name }],
        subject: `Confirmación de tu compra — ${brand?.name ?? fromName}`,
        htmlContent,
      }),
    })
    return NextResponse.json({ ok: true, msg: 'Email enviado' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, msg: e.message || 'Error al enviar' }, { status: 500 })
  }
}
