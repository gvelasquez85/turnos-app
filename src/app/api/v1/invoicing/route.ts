import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'
import { generateCUFE, generateQRUrl } from '@/lib/invoicing/cufe'
import { buildInvoiceXML, type InvoiceData } from '@/lib/invoicing/xml-builder'
import { generateSoftwareSecurityCode } from '@/lib/invoicing/dian-client'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/invoicing
 * List electronic documents for the brand.
 *
 * Query params:
 *   status        draft|generated|signed|sent|accepted|rejected|voided (comma-separated)
 *   type          invoice|credit_note|debit_note
 *   from          date YYYY-MM-DD
 *   to            date YYYY-MM-DD
 *   limit         max results (default 50, max 200)
 *   offset        pagination offset
 *
 * Response 200:
 * { "data": [...], "count": N, "limit": 50, "offset": 0 }
 */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status')
  const typeParam = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let query = supabase
    .from('electronic_documents')
    .select('id, document_type, prefix, consecutive, customer_name, customer_id_number, subtotal, tax_total, total, currency, issue_date, status, cufe, qr_url, source_sale_id, created_at', { count: 'exact' })
    .eq('brand_id', auth.brandId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (statusParam) {
    const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
    query = query.in('status', statuses)
  }
  if (typeParam) query = query.eq('document_type', typeParam)
  if (from) query = query.gte('issue_date', from)
  if (to) query = query.lte('issue_date', to)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: API_CORS_HEADERS })
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0, limit, offset }, { headers: API_CORS_HEADERS })
}

/**
 * POST /api/v1/invoicing
 * Generate an electronic document (invoice, credit/debit note).
 *
 * Body:
 * {
 *   "document_type": "invoice",                 // "invoice" | "credit_note" | "debit_note"
 *   "customer": {
 *     "name": "Juan Pérez",
 *     "id_type": "13",                          // DIAN document type code
 *     "id_number": "1234567890",
 *     "email": "juan@example.com",              // optional
 *     "address": "Calle 1 #2-3",                // optional
 *     "city_code": "11001",                     // optional DANE code
 *     "department_code": "11",                  // optional
 *     "tax_responsibilities": ["R-99-PN"]       // optional
 *   },
 *   "items": [
 *     {
 *       "description": "Producto A",
 *       "quantity": 2,
 *       "unit_price": 50000,
 *       "tax_percent": 19,                      // default 19
 *       "unit_code": "94"                       // optional, default "94" (unidad)
 *     }
 *   ],
 *   "payment_method": "1",                      // "1"=cash, "2"=credit. Default "1"
 *   "payment_means": "10",                      // "10"=cash, "42"=transfer. Default "10"
 *   "notes": ["Custom note"],                   // optional
 *   "sale_id": "uuid",                          // optional — link to existing sale
 *   "original_invoice_id": "uuid"               // required for credit/debit notes
 * }
 *
 * Response 201:
 * {
 *   "ok": true,
 *   "document_id": "uuid",
 *   "number": "SETP990000001",
 *   "cufe": "abc123...",
 *   "qr_url": "https://...",
 *   "status": "generated"
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: API_CORS_HEADERS })
  }

  const {
    document_type = 'invoice',
    customer,
    items,
    payment_method = '1',
    payment_means = '10',
    notes,
    sale_id,
    original_invoice_id,
  } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required and must not be empty' }, { status: 400, headers: API_CORS_HEADERS })
  }

  if (!customer?.name || !customer?.id_number) {
    return NextResponse.json({ error: 'customer.name and customer.id_number are required' }, { status: 400, headers: API_CORS_HEADERS })
  }

  if ((document_type === 'credit_note' || document_type === 'debit_note') && !original_invoice_id) {
    return NextResponse.json({ error: 'original_invoice_id is required for credit/debit notes' }, { status: 400, headers: API_CORS_HEADERS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Check module subscription
  const { data: sub } = await supabase
    .from('module_subscriptions')
    .select('status')
    .eq('brand_id', auth.brandId)
    .eq('module_key', 'facturacion')
    .in('status', ['active', 'trial'])
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: 'Facturación module not active. Subscribe via the marketplace.' }, { status: 403, headers: API_CORS_HEADERS })
  }

  // Load fiscal config
  const { data: fiscalConfig } = await supabase
    .from('fiscal_configs')
    .select('*')
    .eq('brand_id', auth.brandId)
    .single()

  if (!fiscalConfig?.nit) {
    return NextResponse.json({ error: 'Fiscal configuration incomplete. Set up NIT and company info first.' }, { status: 400, headers: API_CORS_HEADERS })
  }

  // Load active resolution
  const resDocType = document_type === 'invoice' ? 'invoice' : document_type
  const { data: resolution } = await supabase
    .from('invoice_resolutions')
    .select('*')
    .eq('brand_id', auth.brandId)
    .eq('document_type', resDocType)
    .eq('is_active', true)
    .single()

  if (!resolution) {
    return NextResponse.json({ error: `No active resolution for document type: ${document_type}` }, { status: 400, headers: API_CORS_HEADERS })
  }

  if (resolution.current_number > resolution.range_to) {
    return NextResponse.json({ error: 'Resolution range exhausted. Register a new resolution.' }, { status: 400, headers: API_CORS_HEADERS })
  }

  // Atomic consecutive assignment
  const { data: updatedRes, error: resErr } = await supabase
    .from('invoice_resolutions')
    .update({ current_number: resolution.current_number + 1 })
    .eq('id', resolution.id)
    .eq('current_number', resolution.current_number)
    .select('current_number')
    .single()

  if (resErr || !updatedRes) {
    return NextResponse.json({ error: 'Consecutive assignment conflict. Retry the request.' }, { status: 409, headers: API_CORS_HEADERS })
  }

  const consecutive = resolution.current_number
  const invoiceNumber = `${resolution.prefix}${consecutive}`

  // Build items
  const now = new Date()
  const issueDate = now.toISOString().split('T')[0]
  const issueTime = now.toTimeString().split(' ')[0] + '-05:00'

  const builtItems = items.map((item: any, idx: number) => {
    const qty = item.quantity ?? 1
    const price = item.unit_price
    const lineTotal = qty * price
    const taxPct = item.tax_percent ?? 19
    const taxAmt = item.tax_amount ?? Math.round(lineTotal * (taxPct / 100))
    return {
      id: idx + 1,
      description: item.description,
      quantity: qty,
      unitCode: item.unit_code ?? '94',
      unitPrice: price,
      lineTotal,
      taxPercent: taxPct,
      taxAmount: taxAmt,
      taxCode: item.tax_code ?? '01',
      taxName: item.tax_name ?? 'IVA',
      productCode: item.product_code,
    }
  })

  const subtotal = builtItems.reduce((s: number, i: any) => s + i.lineTotal, 0)
  const taxTotal = builtItems.reduce((s: number, i: any) => s + i.taxAmount, 0)
  const total = subtotal + taxTotal

  // Generate CUFE
  const environment = fiscalConfig.environment === 'production' ? '1' : '2'
  const softwareSecurityCode = generateSoftwareSecurityCode(
    fiscalConfig.software_id || '',
    fiscalConfig.software_pin || '',
    invoiceNumber,
  )

  const cufe = generateCUFE({
    invoiceNumber,
    issueDate,
    issueTime,
    subtotal,
    taxCode1: '01', taxAmount1: taxTotal,
    taxCode2: '04', taxAmount2: 0,
    taxCode3: '03', taxAmount3: 0,
    total,
    issuerNit: fiscalConfig.nit,
    customerIdNumber: customer.id_number,
    technicalKey: resolution.technical_key || fiscalConfig.software_pin || '',
    environment,
  })

  const qrUrl = generateQRUrl(cufe, environment)

  // Build XML
  const dianDocType = document_type === 'invoice' ? '01' : document_type === 'credit_note' ? '91' : '92'

  // Load original invoice ref for credit/debit notes
  let originalInvoiceRef: InvoiceData['originalInvoiceRef'] = undefined
  if (original_invoice_id) {
    const { data: origDoc } = await supabase
      .from('electronic_documents')
      .select('prefix, consecutive, cufe, issue_date')
      .eq('id', original_invoice_id)
      .eq('brand_id', auth.brandId)
      .single()

    if (origDoc) {
      originalInvoiceRef = {
        number: `${origDoc.prefix}${origDoc.consecutive}`,
        cufe: origDoc.cufe || '',
        issueDate: origDoc.issue_date,
      }
    }
  }

  const invoiceData: InvoiceData = {
    documentType: dianDocType,
    number: invoiceNumber,
    prefix: resolution.prefix,
    consecutive,
    issueDate,
    issueTime,
    dueDate: issueDate,
    currency: 'COP',
    resolutionNumber: resolution.resolution_number,
    resolutionDate: resolution.resolution_date || issueDate,
    resolutionPrefix: resolution.prefix,
    resolutionFrom: resolution.range_from,
    resolutionTo: resolution.range_to,
    cufe,
    qrUrl,
    paymentMethodCode: payment_method,
    paymentMeansCode: payment_means,
    environment,
    softwareId: fiscalConfig.software_id || '',
    softwareSecurityCode,
    supplier: {
      nit: fiscalConfig.nit,
      dv: fiscalConfig.dv || '',
      companyName: fiscalConfig.company_name,
      registrationName: fiscalConfig.company_name,
      taxSchemeCode: fiscalConfig.tax_scheme_code || 'O-13',
      address: {
        street: fiscalConfig.address || '',
        city: '',
        cityCode: fiscalConfig.municipality_code || '',
        department: '',
        departmentCode: fiscalConfig.department_code || '',
        postalCode: fiscalConfig.postal_code || '',
        countryCode: 'CO',
      },
      taxResponsibilities: fiscalConfig.tax_responsibilities || [],
      contactEmail: fiscalConfig.contact_email,
    },
    customer: {
      idType: customer.id_type || '13',
      idNumber: customer.id_number,
      dv: customer.dv,
      name: customer.name,
      registrationName: customer.name,
      isCompany: customer.id_type === '31',
      taxSchemeCode: customer.tax_scheme_code || 'O-49',
      address: {
        street: customer.address || 'N/A',
        city: '',
        cityCode: customer.city_code || '11001',
        department: '',
        departmentCode: customer.department_code || '11',
        postalCode: customer.postal_code || '',
        countryCode: 'CO',
      },
      taxResponsibilities: customer.tax_responsibilities || ['R-99-PN'],
      email: customer.email,
    },
    items: builtItems,
    subtotal,
    totalTax: taxTotal,
    total,
    notes: notes || [`Factura electrónica ${invoiceNumber}`],
    originalInvoiceRef,
  }

  const xml = buildInvoiceXML(invoiceData)

  // Save document
  const { data: doc, error: docErr } = await supabase.from('electronic_documents').insert({
    brand_id: auth.brandId,
    document_type,
    resolution_id: resolution.id,
    prefix: resolution.prefix,
    consecutive,
    customer_name: customer.name,
    customer_id_type: customer.id_type || '13',
    customer_id_number: customer.id_number,
    subtotal,
    tax_total: taxTotal,
    total,
    currency: 'COP',
    issue_date: issueDate,
    issue_time: issueTime,
    due_date: issueDate,
    payment_method_code: payment_method,
    payment_means_code: payment_means,
    cufe,
    qr_url: qrUrl,
    xml_unsigned: xml,
    status: 'generated',
    source_sale_id: sale_id || null,
    created_by: null, // API-generated, no user
  }).select('id').single()

  if (docErr || !doc) {
    return NextResponse.json({ error: docErr?.message || 'Error creating document' }, { status: 500, headers: API_CORS_HEADERS })
  }

  // Save items
  const docItems = builtItems.map((item: any) => ({
    electronic_document_id: doc.id,
    brand_id: auth.brandId,
    line_number: item.id,
    product_code: item.productCode || null,
    description: item.description,
    quantity: item.quantity,
    unit_code: item.unitCode,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
  }))

  await supabase.from('electronic_document_items').insert(docItems)

  // Save taxes
  if (taxTotal > 0) {
    await supabase.from('electronic_document_taxes').insert({
      electronic_document_id: doc.id,
      brand_id: auth.brandId,
      tax_code: '01',
      tax_name: 'IVA',
      tax_percent: 19,
      taxable_amount: subtotal,
      tax_amount: taxTotal,
    })
  }

  return NextResponse.json({
    ok: true,
    document_id: doc.id,
    number: invoiceNumber,
    cufe,
    qr_url: qrUrl,
    status: 'generated',
    subtotal,
    tax_total: taxTotal,
    total,
  }, { status: 201, headers: API_CORS_HEADERS })
}
