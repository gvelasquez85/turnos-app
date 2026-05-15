import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateInvoiceHTML } from '@/lib/invoicing/pdf-generator'

/**
 * GET: Generate PDF representation (as HTML) for an electronic document.
 *
 * Query: ?documentId=xxx
 *
 * Returns HTML that can be:
 * - Rendered in an iframe for preview
 * - Printed via window.print() for PDF output
 * - Converted server-side with puppeteer if needed
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('No autenticado', { status: 401 })

  const documentId = req.nextUrl.searchParams.get('documentId')
  if (!documentId) return new NextResponse('Falta documentId', { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return new NextResponse('Sin perfil', { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load document with items
  const { data: doc } = await service
    .from('electronic_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (!doc) return new NextResponse('Documento no encontrado', { status: 404 })

  if (profile.role !== 'superadmin' && doc.brand_id !== profile.brand_id) {
    return new NextResponse('Acceso denegado', { status: 403 })
  }

  // Load items
  const { data: items } = await service
    .from('electronic_document_items')
    .select('*')
    .eq('electronic_document_id', documentId)
    .order('line_number')

  // Load taxes
  const { data: taxes } = await service
    .from('electronic_document_taxes')
    .select('*')
    .eq('electronic_document_id', documentId)

  // Load fiscal config for supplier info
  const { data: fiscalConfig } = await service
    .from('fiscal_configs')
    .select('*')
    .eq('brand_id', doc.brand_id)
    .single()

  // Load resolution
  const { data: resolution } = await service
    .from('invoice_resolutions')
    .select('resolution_number, resolution_date, valid_from, valid_to, prefix, range_from, range_to')
    .eq('id', doc.resolution_id)
    .single()

  const DOC_TYPE_LABELS: Record<string, string> = {
    invoice: 'Factura Electrónica de Venta',
    credit_note: 'Nota Crédito Electrónica',
    debit_note: 'Nota Débito Electrónica',
  }

  const PAYMENT_LABELS: Record<string, string> = {
    '1': 'Contado',
    '2': 'Crédito',
  }

  const resolutionText = resolution
    ? `Resolución No. ${resolution.resolution_number} de ${resolution.resolution_date || 'N/A'}. Prefijo ${resolution.prefix} del ${resolution.range_from} al ${resolution.range_to}. Vigencia ${resolution.valid_from} al ${resolution.valid_to}.`
    : ''

  const html = generateInvoiceHTML({
    documentType: DOC_TYPE_LABELS[doc.document_type] || doc.document_type,
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
    items: (items || []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      taxPercent: taxes?.[0]?.tax_percent ?? 19,
      taxAmount: Math.round(item.line_total * ((taxes?.[0]?.tax_percent ?? 19) / 100)),
      total: item.line_total,
    })),
    subtotal: doc.subtotal,
    taxTotal: doc.tax_total,
    total: doc.total,
    paymentMethod: PAYMENT_LABELS[doc.payment_method_code] || 'Contado',
    resolutionText,
    notes: [`Factura electrónica ${doc.prefix}${doc.consecutive}`],
  })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
