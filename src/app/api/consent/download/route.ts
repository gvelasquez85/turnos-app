import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get('ticketId')
  const consentId = request.nextUrl.searchParams.get('consentId')

  if (!ticketId && !consentId) return new NextResponse('Missing ticketId or consentId', { status: 400 })

  const supabase = await createClient()

  let consent: any = null

  if (consentId) {
    // Look up consent directly by ID
    const { data } = await supabase
      .from('data_consents')
      .select('*, establishments(name, brands(name))')
      .eq('id', consentId)
      .single()
    consent = data
  } else {
    // Legacy: look up consent by ticket_id
    const { data } = await supabase
      .from('data_consents')
      .select('*, establishments(name, brands(name))')
      .eq('ticket_id', ticketId)
      .single()
    consent = data
  }

  if (!consent) return new NextResponse('Consent not found', { status: 404 })

  const est = (consent.establishments as any)
  const brandName = est?.brands?.name || 'TurnApp'
  const estName = est?.name || ''
  const date = new Date(consent.consented_at).toLocaleString('es', {
    dateStyle: 'full', timeStyle: 'medium'
  })

  // For the operation ID row, use the most descriptive available identifier
  const operationId = ticketId || consent.ticket_id || consent.id

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comprobante de Autorización — ${consent.customer_name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #111; background: white; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 24px; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 900; color: #4F46E5; letter-spacing: -1px; margin-bottom: 4px; }
  .subtitle { font-size: 13px; color: #666; }
  h1 { font-size: 22px; color: #1a1a2e; margin-bottom: 24px; text-align: center; }
  .section { background: #f8f7ff; border: 1px solid #e0dfff; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #4F46E5; margin-bottom: 12px; }
  .row { display: flex; gap: 8px; margin-bottom: 8px; }
  .label { font-size: 13px; color: #666; min-width: 160px; }
  .value { font-size: 13px; font-weight: 600; color: #111; }
  .consent-text { font-size: 12px; line-height: 1.7; color: #444; text-align: justify; padding: 16px; background: #fff; border-radius: 4px; border: 1px solid #ddd; }
  .checkmark { display: inline-block; width: 16px; height: 16px; background: #22c55e; border-radius: 3px; margin-right: 8px; text-align: center; line-height: 16px; color: white; font-size: 11px; font-weight: bold; }
  .acceptance { font-size: 13px; font-weight: 600; color: #15803d; margin-top: 12px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  .id { font-family: monospace; font-size: 11px; color: #888; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">TurnApp</div>
  <div class="subtitle">Sistema de Gestión de Turnos</div>
</div>

<h1>Comprobante de Autorización de Tratamiento de Datos</h1>

<div class="section">
  <div class="section-title">Información del negocio</div>
  <div class="row"><span class="label">Empresa / Marca:</span><span class="value">${brandName}</span></div>
  <div class="row"><span class="label">Establecimiento:</span><span class="value">${estName}</span></div>
</div>

<div class="section">
  <div class="section-title">Datos del titular</div>
  <div class="row"><span class="label">Nombre completo:</span><span class="value">${consent.customer_name}</span></div>
  ${consent.customer_phone ? `<div class="row"><span class="label">Teléfono:</span><span class="value">${consent.customer_phone}</span></div>` : ''}
  ${consent.customer_email ? `<div class="row"><span class="label">Correo electrónico:</span><span class="value">${consent.customer_email}</span></div>` : ''}
</div>

<div class="section">
  <div class="section-title">Texto de autorización aceptado</div>
  <div class="consent-text">${consent.consent_text}</div>
  <div class="acceptance">
    <span class="checkmark">&#10003;</span>
    Autorización otorgada: <strong>SÍ</strong>
  </div>
  ${consent.marketing_opt_in
    ? `<div class="acceptance"><span class="checkmark">&#10003;</span>Autorización comunicaciones comerciales: <strong>SÍ</strong></div>`
    : `<div style="font-size:13px;color:#888;margin-top:8px;">&#10007; Comunicaciones comerciales: No autorizado</div>`
  }
</div>

<div class="section">
  <div class="section-title">Registro de la operación</div>
  <div class="row"><span class="label">Fecha y hora:</span><span class="value">${date}</span></div>
  ${operationId !== consent.id ? `<div class="row"><span class="label">ID del turno:</span><span class="id">${operationId}</span></div>` : ''}
  <div class="row"><span class="label">ID del registro:</span><span class="id">${consent.id}</span></div>
</div>

<div class="footer">
  <p>Este documento es evidencia de la autorización de tratamiento de datos obtenida digitalmente.</p>
  <p style="margin-top:4px;">Generado por TurnApp · ${new Date().toISOString()}</p>
</div>

<div class="no-print" style="text-align:center;margin-top:30px;">
  <button onclick="window.print()" style="background:#4F46E5;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
    Imprimir / Guardar como PDF
  </button>
</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }
  })
}
