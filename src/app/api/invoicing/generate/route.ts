import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateCUFE, generateQRUrl } from '@/lib/invoicing/cufe'
import { buildInvoiceXML, type InvoiceData } from '@/lib/invoicing/xml-builder'
import { generateSoftwareSecurityCode } from '@/lib/invoicing/dian-client'

/**
 * Generates an electronic document (invoice, credit note, debit note)
 * from a sale or manually.
 *
 * Does NOT modify sales/customers tables — only creates entries in invoicing tables.
 * Does NOT transmit to DIAN — that's a separate step.
 *
 * Body:
 * - saleId?: string (optional — generate from a sale)
 * - brandId?: string (superadmin override)
 * - documentType: "invoice" | "credit_note" | "debit_note"
 * - items?: manual items (if no saleId)
 * - customerData?: { idType, idNumber, name, ... } (if no saleId)
 * - paymentMethodCode?: string
 * - paymentMeansCode?: string
 * - notes?: string[]
 * - originalInvoiceId?: string (for credit/debit notes)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    saleId,
    brandId: overrideBrandId,
    documentType = 'invoice',
    paymentMethodCode = '1',
    paymentMeansCode = '10',
    notes,
  } = body

  const effectiveBrandId = overrideBrandId || profile.brand_id
  if (!effectiveBrandId) return NextResponse.json({ error: 'Falta brand_id' }, { status: 400 })

  // Access control
  if (profile.role !== 'superadmin' && effectiveBrandId !== profile.brand_id)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load fiscal config
  const { data: fiscalConfig } = await service
    .from('fiscal_configs')
    .select('*')
    .eq('brand_id', effectiveBrandId)
    .single()

  if (!fiscalConfig?.nit) {
    return NextResponse.json({ error: 'Configuración fiscal incompleta. Registra tus datos fiscales primero.' }, { status: 400 })
  }

  // Load active resolution
  const docTypeForResolution = documentType === 'invoice' ? 'invoice' : documentType
  const { data: resolution } = await service
    .from('invoice_resolutions')
    .select('*')
    .eq('brand_id', effectiveBrandId)
    .eq('document_type', docTypeForResolution)
    .eq('is_active', true)
    .single()

  if (!resolution) {
    return NextResponse.json({ error: 'No hay resolución activa para este tipo de documento' }, { status: 400 })
  }

  // Check resolution has available numbers
  if (resolution.current_number > resolution.range_to) {
    return NextResponse.json({ error: 'Resolución agotada. Registra una nueva resolución.' }, { status: 400 })
  }

  // Assign consecutive atomically
  const { data: updatedRes, error: resErr } = await service
    .from('invoice_resolutions')
    .update({ current_number: resolution.current_number + 1 })
    .eq('id', resolution.id)
    .eq('current_number', resolution.current_number) // Optimistic lock
    .select('current_number')
    .single()

  if (resErr || !updatedRes) {
    return NextResponse.json({ error: 'Error asignando consecutivo. Intenta de nuevo.' }, { status: 409 })
  }

  const consecutive = resolution.current_number
  const invoiceNumber = `${resolution.prefix}${consecutive}`

  // Build issue date/time
  const now = new Date()
  const issueDate = now.toISOString().split('T')[0]
  const issueTime = now.toTimeString().split(' ')[0] + '-05:00'

  // Load sale data if saleId provided (READ ONLY)
  let items: any[] = []
  let customerName = 'Consumidor final'
  let customerIdType = '13'
  let customerIdNumber = '222222222222'
  let subtotal = 0
  let taxTotal = 0
  let total = 0

  if (saleId) {
    const { data: sale } = await service
      .from('sales')
      .select('id, total, subtotal, discount, status, created_at, customers(id, name, email, phone, document)')
      .eq('id', saleId)
      .single()

    if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

    // Validate sale belongs to brand
    const { data: saleBrand } = await service
      .from('sales')
      .select('brand_id')
      .eq('id', saleId)
      .single()

    if (saleBrand?.brand_id !== effectiveBrandId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Check if invoice already exists for this sale
    const { data: existingDoc } = await service
      .from('electronic_documents')
      .select('id')
      .eq('brand_id', effectiveBrandId)
      .eq('source_sale_id', saleId)
      .eq('document_type', 'invoice')
      .not('status', 'eq', 'voided')
      .maybeSingle()

    if (existingDoc) {
      return NextResponse.json({ error: 'Ya existe una factura para esta venta', existingId: existingDoc.id }, { status: 409 })
    }

    const customer = sale.customers as any
    customerName = customer?.name ?? 'Consumidor final'
    customerIdNumber = customer?.document ?? '222222222222'

    // Load sale items
    const { data: saleItems } = await service
      .from('sale_items')
      .select('id, product_name, quantity, unit_price, total, product_id')
      .eq('sale_id', saleId)

    subtotal = sale.subtotal ?? sale.total
    taxTotal = sale.total - subtotal
    total = sale.total

    items = (saleItems ?? []).map((si, idx) => ({
      id: idx + 1,
      description: si.product_name,
      quantity: si.quantity,
      unitCode: '94', // Unidad (default)
      unitPrice: si.unit_price,
      lineTotal: si.quantity * si.unit_price,
      taxPercent: taxTotal > 0 ? 19 : 0,
      taxAmount: taxTotal > 0 ? Math.round(si.quantity * si.unit_price * 0.19) : 0,
      taxCode: '01',
      taxName: 'IVA',
      productCode: si.product_id || undefined,
    }))
  } else if (body.items) {
    // Manual items
    items = body.items.map((item: any, idx: number) => ({
      id: idx + 1,
      description: item.description,
      quantity: item.quantity ?? 1,
      unitCode: item.unitCode ?? '94',
      unitPrice: item.unitPrice,
      lineTotal: (item.quantity ?? 1) * item.unitPrice,
      taxPercent: item.taxPercent ?? 19,
      taxAmount: item.taxAmount ?? Math.round((item.quantity ?? 1) * item.unitPrice * 0.19),
      taxCode: item.taxCode ?? '01',
      taxName: item.taxName ?? 'IVA',
      productCode: item.productCode,
    }))

    subtotal = items.reduce((s: number, i: any) => s + i.lineTotal, 0)
    taxTotal = items.reduce((s: number, i: any) => s + i.taxAmount, 0)
    total = subtotal + taxTotal

    if (body.customerData) {
      customerName = body.customerData.name ?? customerName
      customerIdType = body.customerData.idType ?? customerIdType
      customerIdNumber = body.customerData.idNumber ?? customerIdNumber
    }
  } else {
    return NextResponse.json({ error: 'Proporciona saleId o items' }, { status: 400 })
  }

  // Load customer fiscal data if available
  const { data: customerFiscal } = await service
    .from('customer_fiscal_data')
    .select('*')
    .eq('brand_id', effectiveBrandId)
    .eq('id_number', customerIdNumber)
    .maybeSingle()

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
    customerIdNumber,
    technicalKey: resolution.technical_key || fiscalConfig.software_pin || '',
    environment,
  })

  const qrUrl = generateQRUrl(cufe, environment)

  // Build XML
  const dianDocType = documentType === 'invoice' ? '01' : documentType === 'credit_note' ? '91' : '92'

  const invoiceData: InvoiceData = {
    documentType: dianDocType,
    number: invoiceNumber,
    prefix: resolution.prefix,
    consecutive,
    issueDate,
    issueTime,
    dueDate: issueDate, // Same day for cash
    currency: 'COP',
    resolutionNumber: resolution.resolution_number,
    resolutionDate: resolution.resolution_date || issueDate,
    resolutionPrefix: resolution.prefix,
    resolutionFrom: resolution.range_from,
    resolutionTo: resolution.range_to,
    cufe,
    qrUrl,
    paymentMethodCode,
    paymentMeansCode,
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
        city: '', // Would need join with municipalities
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
      idType: customerFiscal?.id_type || customerIdType,
      idNumber: customerIdNumber,
      dv: customerFiscal?.dv,
      name: customerName,
      registrationName: customerName,
      isCompany: customerFiscal?.id_type === '31',
      taxSchemeCode: customerFiscal?.tax_scheme_code || 'O-49',
      address: {
        street: customerFiscal?.address || 'N/A',
        city: '',
        cityCode: customerFiscal?.municipality_code || '11001',
        department: '',
        departmentCode: customerFiscal?.department_code || '11',
        postalCode: customerFiscal?.postal_code || '',
        countryCode: 'CO',
      },
      taxResponsibilities: customerFiscal?.tax_responsibilities || ['R-99-PN'],
      email: customerFiscal?.email,
    },
    items,
    subtotal,
    totalTax: taxTotal,
    total,
    notes: notes || [`Factura electrónica ${invoiceNumber}`],
  }

  const xml = buildInvoiceXML(invoiceData)

  // Save electronic document
  const { data: doc, error: docErr } = await service.from('electronic_documents').insert({
    brand_id: effectiveBrandId,
    document_type: documentType,
    resolution_id: resolution.id,
    prefix: resolution.prefix,
    consecutive,
    customer_name: customerName,
    customer_id_type: customerFiscal?.id_type || customerIdType,
    customer_id_number: customerIdNumber,
    subtotal,
    tax_total: taxTotal,
    total,
    currency: 'COP',
    issue_date: issueDate,
    issue_time: issueTime,
    due_date: issueDate,
    payment_method_code: paymentMethodCode,
    payment_means_code: paymentMeansCode,
    cufe,
    qr_url: qrUrl,
    xml_unsigned: xml,
    status: 'generated',
    source_sale_id: saleId || null,
    created_by: user.id,
  }).select('id').single()

  if (docErr || !doc) {
    return NextResponse.json({ error: docErr?.message || 'Error creando documento' }, { status: 500 })
  }

  // Save document items
  const docItems = items.map((item: any) => ({
    electronic_document_id: doc.id,
    brand_id: effectiveBrandId,
    line_number: item.id,
    product_code: item.productCode || null,
    description: item.description,
    quantity: item.quantity,
    unit_code: item.unitCode,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
  }))

  await service.from('electronic_document_items').insert(docItems)

  // Save taxes
  if (taxTotal > 0) {
    await service.from('electronic_document_taxes').insert({
      electronic_document_id: doc.id,
      brand_id: effectiveBrandId,
      tax_code: '01',
      tax_name: 'IVA',
      tax_percent: 19,
      taxable_amount: subtotal,
      tax_amount: taxTotal,
    })
  }

  return NextResponse.json({
    ok: true,
    documentId: doc.id,
    number: invoiceNumber,
    cufe,
    qrUrl,
  })
}
