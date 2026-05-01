import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  facturado: 'Facturado',
  en_alistamiento: 'En alistamiento',
  despachado: 'Despachado',
  entregado: 'Entregado',
  completado: 'Completado',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { saleId, newStatus } = await req.json().catch(() => ({}))
  if (!saleId || !newStatus) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load sale + customer + brand (with logo and colors for email)
  const { data: sale } = await service
    .from('sales')
    .select('id, total, notes, brand_id, customers(name, email), brands(name, logo_url, primary_color)')
    .eq('id', saleId)
    .single()

  // Update status
  await service.from('sales').update({ status: newStatus }).eq('id', saleId)

  // Try to send email (non-blocking)
  try {
    const customer = (sale as any)?.customers
    const brand = (sale as any)?.brands
    if (!customer?.email) return NextResponse.json({ ok: true, emailSent: false })

    // Load Brevo settings
    const { data: settings } = await service
      .from('system_settings').select('key, value')
      .in('key', ['BREVO_API_KEY', 'COMMS_FROM_EMAIL', 'COMMS_FROM_NAME'])
    const cfg = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]))
    const brevoKey = (cfg['BREVO_API_KEY'] || process.env.BREVO_API_KEY || '').trim()
    const fromEmail = (cfg['COMMS_FROM_EMAIL'] || process.env.COMMS_FROM_EMAIL || '').trim()
    const fromName = (cfg['COMMS_FROM_NAME'] || process.env.COMMS_FROM_NAME || brand?.name || 'TurnFlow').trim()

    if (!brevoKey || !fromEmail) return NextResponse.json({ ok: true, emailSent: false })

    const statusLabel = STATUS_LABELS[newStatus] ?? newStatus
    const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
    const brandColor = (brand as any)?.primary_color || '#4F46E5' // Use brand primary color or fallback to indigo
    const logoUrl = (brand as any)?.logo_url || ''

    const htmlContent = `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
<div style="max-width:540px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:${brandColor};padding:24px 32px;display:flex;align-items:center;gap:12px;">
    ${logoUrl ? `<img src="${logoUrl}" style="height:32px;object-fit:contain;" alt="Logo" />` : ''}
    <div>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px;">Actualización de tu pedido</p>
      <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:800;">${statusLabel}</h1>
    </div>
  </div>
  <div style="padding:28px 32px;">
    <p style="color:#374151;font-size:15px;">Hola <strong>${customer.name}</strong>,</p>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;">Tu pedido en <strong>${brand?.name ?? 'nuestra tienda'}</strong> ha cambiado de estado a: <strong style="color:${brandColor};">${statusLabel}</strong>.</p>
    <div style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Total: <strong style="color:#111827;">${fmt(sale?.total ?? 0)}</strong></p>
      ${(sale as any)?.notes ? `<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">${(sale as any).notes}</p>` : ''}
    </div>
    <p style="color:#9ca3af;font-size:12px;">Si tienes preguntas, responde a este correo.</p>
  </div>
  <div style="background:#f9fafb;padding:14px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">${fromName} · Generado con TurnFlow</p>
  </div>
</div>
</body></html>`

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: fromEmail },
        to: [{ email: customer.email, name: customer.name }],
        subject: `Tu pedido está: ${statusLabel} — ${brand?.name ?? fromName}`,
        htmlContent,
      }),
    })
  } catch {}

  return NextResponse.json({ ok: true })
}
