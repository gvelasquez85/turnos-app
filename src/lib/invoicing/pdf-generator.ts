/**
 * PDF Representation Generator for Colombian Electronic Invoices
 *
 * Generates the "representación gráfica" (graphic representation) required
 * by DIAN for electronic documents. This is the human-readable PDF version
 * of the invoice that accompanies the XML.
 *
 * Uses a simple HTML-to-PDF approach that works server-side.
 * For production, consider using puppeteer or a dedicated PDF library.
 *
 * This module generates the HTML template — the caller handles conversion.
 */

interface PDFInvoiceData {
  // Document info
  documentType: string      // "Factura de Venta", "Nota Crédito", etc.
  number: string            // "SETP990000001"
  issueDate: string
  dueDate: string
  cufe: string
  qrUrl: string

  // Supplier
  supplierName: string
  supplierNit: string
  supplierDv: string
  supplierAddress: string
  supplierCity: string
  supplierPhone?: string
  supplierEmail?: string

  // Customer
  customerName: string
  customerIdType: string
  customerIdNumber: string
  customerAddress?: string
  customerCity?: string
  customerEmail?: string

  // Items
  items: {
    description: string
    quantity: number
    unitPrice: number
    taxPercent: number
    taxAmount: number
    total: number
  }[]

  // Totals
  subtotal: number
  taxTotal: number
  total: number

  // Payment
  paymentMethod: string     // "Contado", "Crédito"

  // Resolution
  resolutionText: string    // "Resolución No. XXX de YYYY..."

  // Notes
  notes?: string[]
}

const ID_TYPE_LABELS: Record<string, string> = {
  '13': 'CC',
  '31': 'NIT',
  '22': 'CE',
  '41': 'Pasaporte',
  '42': 'TI',
  '50': 'NIT otro país',
  '91': 'NUIP',
}

/**
 * Generates HTML for the invoice PDF representation.
 * Caller should convert to PDF using their preferred method.
 */
export function generateInvoiceHTML(data: PDFInvoiceData): string {
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)

  const idTypeLabel = ID_TYPE_LABELS[data.customerIdType] || data.customerIdType

  const itemsRows = data.items.map((item, idx) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px">${idx + 1}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${escHtml(item.description)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px">${item.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:12px">${fmt(item.unitPrice)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-size:12px">${item.taxPercent}%</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-size:12px">${fmt(item.total)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 30px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid #059669; }
    .doc-type { background: #059669; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 700; display: inline-block; }
    .doc-number { font-size: 22px; font-weight: 700; color: #059669; margin-top: 5px; }
    .section { margin-bottom: 15px; }
    .section-title { font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .info-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 13px; font-weight: 500; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #f3f4f6; padding: 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e5e7eb; }
    .totals { text-align: right; margin-top: 10px; }
    .totals table { width: 280px; margin-left: auto; }
    .totals td { padding: 4px 8px; font-size: 13px; }
    .total-row { font-size: 16px !important; font-weight: 700; color: #059669; border-top: 2px solid #059669; }
    .cufe-section { margin-top: 20px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    .cufe-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .cufe-value { font-size: 9px; font-family: monospace; word-break: break-all; margin-top: 4px; color: #666; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
    .resolution { font-size: 9px; color: #999; text-align: center; margin-top: 8px; font-style: italic; }
    .qr-section { text-align: center; margin-top: 15px; }
    .notes { margin-top: 10px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 11px; color: #92400e; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div style="font-size:18px;font-weight:700">${escHtml(data.supplierName)}</div>
      <div style="font-size:12px;color:#666;margin-top:2px">NIT: ${escHtml(data.supplierNit)}-${escHtml(data.supplierDv)}</div>
      <div style="font-size:11px;color:#999;margin-top:2px">${escHtml(data.supplierAddress)}</div>
      ${data.supplierCity ? `<div style="font-size:11px;color:#999">${escHtml(data.supplierCity)}</div>` : ''}
      ${data.supplierPhone ? `<div style="font-size:11px;color:#999">Tel: ${escHtml(data.supplierPhone)}</div>` : ''}
      ${data.supplierEmail ? `<div style="font-size:11px;color:#999">${escHtml(data.supplierEmail)}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div class="doc-type">${escHtml(data.documentType)}</div>
      <div class="doc-number">${escHtml(data.number)}</div>
      <div style="font-size:11px;color:#666;margin-top:4px">Fecha: ${data.issueDate}</div>
      <div style="font-size:11px;color:#666">Vencimiento: ${data.dueDate}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="section">
    <div class="info-grid">
      <div class="info-box">
        <div class="section-title">Cliente</div>
        <div class="info-value">${escHtml(data.customerName)}</div>
        <div class="info-label" style="margin-top:6px">${idTypeLabel}</div>
        <div class="info-value">${escHtml(data.customerIdNumber)}</div>
        ${data.customerAddress ? `<div class="info-label" style="margin-top:4px">Dirección</div><div class="info-value">${escHtml(data.customerAddress)}</div>` : ''}
        ${data.customerEmail ? `<div class="info-label" style="margin-top:4px">Email</div><div class="info-value">${escHtml(data.customerEmail)}</div>` : ''}
      </div>
      <div class="info-box">
        <div class="section-title">Información de pago</div>
        <div class="info-label">Método de pago</div>
        <div class="info-value">${escHtml(data.paymentMethod)}</div>
        <div class="info-label" style="margin-top:6px">Moneda</div>
        <div class="info-value">COP — Peso colombiano</div>
      </div>
    </div>
  </div>

  <!-- Items table -->
  <div class="section">
    <table>
      <thead>
        <tr>
          <th style="text-align:center;width:40px">#</th>
          <th style="text-align:left">Descripción</th>
          <th style="text-align:center;width:60px">Cant.</th>
          <th style="text-align:right;width:100px">Precio</th>
          <th style="text-align:center;width:60px">IVA</th>
          <th style="text-align:right;width:110px">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals">
    <table>
      <tr>
        <td style="color:#666">Subtotal</td>
        <td style="font-weight:500">${fmt(data.subtotal)}</td>
      </tr>
      <tr>
        <td style="color:#666">IVA</td>
        <td style="font-weight:500">${fmt(data.taxTotal)}</td>
      </tr>
      <tr class="total-row">
        <td>Total</td>
        <td>${fmt(data.total)}</td>
      </tr>
    </table>
  </div>

  ${data.notes?.length ? `
  <div class="notes">
    ${data.notes.map(n => `<div>${escHtml(n)}</div>`).join('')}
  </div>
  ` : ''}

  <!-- CUFE -->
  <div class="cufe-section">
    <div class="cufe-label">CUFE</div>
    <div class="cufe-value">${data.cufe}</div>
  </div>

  <!-- QR -->
  <div class="qr-section">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.qrUrl)}" alt="QR DIAN" width="120" height="120" />
    <div style="font-size:9px;color:#999;margin-top:4px">Escanea para validar en DIAN</div>
  </div>

  <!-- Resolution -->
  <div class="resolution">${escHtml(data.resolutionText)}</div>

  <!-- Footer -->
  <div class="footer">
    Documento generado electrónicamente — Factura válida como documento soporte según Art. 616-1 del E.T.
    <br/>Generado por TurnFlow · turnflow.app
  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
