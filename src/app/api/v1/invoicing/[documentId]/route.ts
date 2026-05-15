import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'
import { signXML } from '@/lib/invoicing/xades-signer'
import { sendBillSync } from '@/lib/invoicing/dian-client'
import { generateInvoiceHTML } from '@/lib/invoicing/pdf-generator'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/invoicing/:documentId
 * Get document details including XML, CUFE, status, items.
 *
 * Query params:
 *   include   "xml"|"items"|"html" (comma-separated, optional)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const { documentId } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: doc } = await supabase
    .from('electronic_documents')
    .select('*')
    .eq('id', documentId)
    .eq('brand_id', auth.brandId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404, headers: API_CORS_HEADERS })
  }

  const includes = (req.nextUrl.searchParams.get('include') || '').split(',').map(s => s.trim())

  const result: any = {
    id: doc.id,
    document_type: doc.document_type,
    number: `${doc.prefix}${doc.consecutive}`,
    prefix: doc.prefix,
    consecutive: doc.consecutive,
    customer_name: doc.customer_name,
    customer_id_type: doc.customer_id_type,
    customer_id_number: doc.customer_id_number,
    subtotal: doc.subtotal,
    tax_total: doc.tax_total,
    total: doc.total,
    currency: doc.currency,
    issue_date: doc.issue_date,
    status: doc.status,
    cufe: doc.cufe,
    qr_url: doc.qr_url,
    dian_status_code: doc.dian_status_code,
    dian_track_id: doc.dian_track_id,
    source_sale_id: doc.source_sale_id,
    created_at: doc.created_at,
  }

  if (includes.includes('xml')) {
    result.xml_unsigned = doc.xml_unsigned
    result.xml_signed = doc.xml_signed
  }

  if (includes.includes('items')) {
    const { data: items } = await supabase
      .from('electronic_document_items')
      .select('line_number, product_code, description, quantity, unit_code, unit_price, line_total')
      .eq('electronic_document_id', documentId)
      .order('line_number')
    result.items = items ?? []
  }

  if (includes.includes('html')) {
    const { data: fiscalConfig } = await supabase
      .from('fiscal_configs').select('*').eq('brand_id', auth.brandId).single()
    const { data: resolution } = await supabase
      .from('invoice_resolutions').select('*').eq('id', doc.resolution_id).single()
    const { data: items } = await supabase
      .from('electronic_document_items').select('*').eq('electronic_document_id', documentId).order('line_number')
    const { data: taxes } = await supabase
      .from('electronic_document_taxes').select('*').eq('electronic_document_id', documentId)

    const DOC_LABELS: Record<string, string> = { invoice: 'Factura Electrónica de Venta', credit_note: 'Nota Crédito Electrónica', debit_note: 'Nota Débito Electrónica' }
    const resText = resolution ? `Resolución No. ${resolution.resolution_number}. Prefijo ${resolution.prefix} del ${resolution.range_from} al ${resolution.range_to}.` : ''

    result.html = generateInvoiceHTML({
      documentType: DOC_LABELS[doc.document_type] || doc.document_type,
      number: `${doc.prefix}${doc.consecutive}`,
      issueDate: doc.issue_date,
      dueDate: doc.due_date || doc.issue_date,
      cufe: doc.cufe || '',
      qrUrl: doc.qr_url || '',
      supplierName: fiscalConfig?.company_name || '',
      supplierNit: fiscalConfig?.nit || '',
      supplierDv: fiscalConfig?.dv || '',
      supplierAddress: fiscalConfig?.address || '',
      supplierCity: '',
      supplierPhone: fiscalConfig?.contact_phone,
      supplierEmail: fiscalConfig?.contact_email,
      customerName: doc.customer_name,
      customerIdType: doc.customer_id_type || '13',
      customerIdNumber: doc.customer_id_number,
      items: (items || []).map(i => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        taxPercent: taxes?.[0]?.tax_percent ?? 19,
        taxAmount: Math.round(i.line_total * ((taxes?.[0]?.tax_percent ?? 19) / 100)),
        total: i.line_total,
      })),
      subtotal: doc.subtotal,
      taxTotal: doc.tax_total,
      total: doc.total,
      paymentMethod: doc.payment_method_code === '2' ? 'Crédito' : 'Contado',
      resolutionText: resText,
    })
  }

  return NextResponse.json(result, { headers: API_CORS_HEADERS })
}

/**
 * POST /api/v1/invoicing/:documentId
 * Perform actions on a document.
 *
 * Body:
 *   { "action": "sign" }    — Sign with XAdES-EPES
 *   { "action": "send" }    — Transmit to DIAN
 *   { "action": "void" }    — Void the document
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const { documentId } = await params
  const body = await req.json().catch(() => ({}))
  const { action } = body

  if (!action || !['sign', 'send', 'void'].includes(action)) {
    return NextResponse.json({ error: 'action must be "sign", "send", or "void"' }, { status: 400, headers: API_CORS_HEADERS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: doc } = await supabase
    .from('electronic_documents')
    .select('*')
    .eq('id', documentId)
    .eq('brand_id', auth.brandId)
    .single()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404, headers: API_CORS_HEADERS })
  }

  // ── SIGN ──
  if (action === 'sign') {
    if (doc.status !== 'generated' && doc.status !== 'draft') {
      return NextResponse.json({ error: `Cannot sign document in status "${doc.status}"` }, { status: 400, headers: API_CORS_HEADERS })
    }
    if (!doc.xml_unsigned) {
      return NextResponse.json({ error: 'Document has no unsigned XML' }, { status: 400, headers: API_CORS_HEADERS })
    }

    const { data: fc } = await supabase
      .from('fiscal_configs')
      .select('certificate_base64, certificate_password')
      .eq('brand_id', auth.brandId)
      .single()

    if (!fc?.certificate_base64) {
      return NextResponse.json({ error: 'No certificate configured. Generate a test certificate or upload a .p12 file.' }, { status: 400, headers: API_CORS_HEADERS })
    }

    try {
      const result = signXML({ xml: doc.xml_unsigned, p12Base64: fc.certificate_base64, password: fc.certificate_password })
      await supabase.from('electronic_documents').update({
        xml_signed: result.signedXml,
        status: 'signed',
        signed_at: new Date().toISOString(),
      }).eq('id', doc.id)

      return NextResponse.json({ ok: true, status: 'signed', document_digest: result.documentDigest }, { headers: API_CORS_HEADERS })
    } catch (e: any) {
      return NextResponse.json({ error: `Signing failed: ${e.message}` }, { status: 500, headers: API_CORS_HEADERS })
    }
  }

  // ── SEND ──
  if (action === 'send') {
    if (!doc.xml_signed) {
      return NextResponse.json({ error: 'Document must be signed before sending to DIAN' }, { status: 400, headers: API_CORS_HEADERS })
    }

    const { data: fc } = await supabase
      .from('fiscal_configs')
      .select('environment')
      .eq('brand_id', auth.brandId)
      .single()

    const env = fc?.environment === 'production' ? 'production' : 'testing'
    const b64 = Buffer.from(doc.xml_signed, 'utf8').toString('base64')
    const fileName = `${doc.prefix}${doc.consecutive}.xml`

    const dianRes = await sendBillSync(b64, fileName, env as any)

    // Log transmission
    await supabase.from('dian_transmissions').insert({
      electronic_document_id: doc.id,
      brand_id: auth.brandId,
      action: 'SendBillSync',
      request_xml: `<SendBillSync><fileName>${fileName}</fileName></SendBillSync>`,
      response_xml: dianRes.xmlResponse || '',
      status_code: dianRes.statusCode,
      status_description: dianRes.statusDescription,
      status_message: dianRes.statusMessage,
      track_id: dianRes.trackId || null,
      is_valid: dianRes.success,
      errors: dianRes.errors.length > 0 ? dianRes.errors : null,
    })

    const newStatus = dianRes.success ? 'accepted' : 'rejected'
    await supabase.from('electronic_documents').update({
      status: newStatus,
      dian_status_code: dianRes.statusCode,
      dian_track_id: dianRes.trackId || null,
      dian_response_at: new Date().toISOString(),
    }).eq('id', doc.id)

    return NextResponse.json({
      ok: dianRes.success,
      status: newStatus,
      status_code: dianRes.statusCode,
      status_message: dianRes.statusMessage,
      track_id: dianRes.trackId,
      errors: dianRes.errors,
    }, { headers: API_CORS_HEADERS })
  }

  // ── VOID ──
  if (action === 'void') {
    if (doc.status === 'voided') {
      return NextResponse.json({ error: 'Document is already voided' }, { status: 400, headers: API_CORS_HEADERS })
    }

    await supabase.from('electronic_documents').update({
      status: 'voided',
      voided_at: new Date().toISOString(),
    }).eq('id', doc.id)

    return NextResponse.json({ ok: true, status: 'voided' }, { headers: API_CORS_HEADERS })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: API_CORS_HEADERS })
}
