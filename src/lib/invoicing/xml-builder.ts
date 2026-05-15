/**
 * UBL 2.1 XML Builder for Colombian Electronic Invoicing
 * Based on DIAN Anexo Técnico v1.9
 *
 * Generates the XML document structure compliant with:
 * - UBL 2.1 (OASIS)
 * - DIAN customization ID
 * - Colombian tax schemas
 *
 * NOTE: This builder generates unsigned XML. XAdES-EPES signing
 * is handled separately before transmission to DIAN.
 */

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unitCode: string        // DIAN unit code (e.g., "94" for unidad)
  unitPrice: number
  lineTotal: number
  taxPercent: number      // e.g., 19 for 19% IVA
  taxAmount: number
  taxCode: string         // "01" = IVA
  taxName: string         // "IVA"
  productCode?: string
}

interface InvoiceParty {
  nit: string
  dv: string              // Dígito verificación
  companyName: string
  registrationName: string
  taxSchemeCode: string   // "O-13" = Régimen común, etc.
  address: {
    street: string
    city: string
    cityCode: string      // DANE municipality code
    department: string
    departmentCode: string
    postalCode: string
    countryCode: string   // "CO"
  }
  taxResponsibilities: string[]  // ["O-48", "O-15", etc.]
  contactEmail?: string
  contactPhone?: string
}

interface CustomerParty {
  idType: string          // "13" = CC, "31" = NIT, etc.
  idNumber: string
  dv?: string
  name: string
  registrationName: string
  isCompany: boolean
  taxSchemeCode: string
  address: {
    street: string
    city: string
    cityCode: string
    department: string
    departmentCode: string
    postalCode: string
    countryCode: string
  }
  taxResponsibilities: string[]
  email?: string
  phone?: string
}

export interface InvoiceData {
  /** Document type: "01" = invoice, "91" = credit note, "92" = debit note */
  documentType: string
  /** Invoice/note number with prefix */
  number: string
  /** Prefix only */
  prefix: string
  /** Consecutive number only */
  consecutive: number
  /** Issue date "YYYY-MM-DD" */
  issueDate: string
  /** Issue time "HH:MM:SS-05:00" */
  issueTime: string
  /** Due date "YYYY-MM-DD" */
  dueDate: string
  /** Currency code "COP" */
  currency: string
  /** DIAN resolution number */
  resolutionNumber: string
  /** Resolution date range */
  resolutionDate: string
  /** Resolution prefix */
  resolutionPrefix: string
  /** Resolution range from */
  resolutionFrom: number
  /** Resolution range to */
  resolutionTo: number
  /** CUFE/CUDE hash */
  cufe: string
  /** QR code URL */
  qrUrl: string
  /** Payment method code: "1" = cash, "2" = credit */
  paymentMethodCode: string
  /** Payment means code: "10" = cash, "42" = bank transfer, etc. */
  paymentMeansCode: string
  /** Environment: "1" = production, "2" = testing */
  environment: string
  /** Software ID from DIAN */
  softwareId: string
  /** Software security code (SHA-384) */
  softwareSecurityCode: string
  /** Supplier/issuer info */
  supplier: InvoiceParty
  /** Customer info */
  customer: CustomerParty
  /** Line items */
  items: InvoiceItem[]
  /** Subtotal (sum of line totals before tax) */
  subtotal: number
  /** Total tax amount */
  totalTax: number
  /** Total payable */
  total: number
  /** Notes */
  notes?: string[]
  /** For credit/debit notes: reference to original invoice */
  originalInvoiceRef?: {
    number: string
    cufe: string
    issueDate: string
  }
  /** Credit note correction reason code */
  correctionReasonCode?: string
  /** Credit note correction reason description */
  correctionReasonDescription?: string
}

// XML escaping
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function fmtAmt(n: number): string {
  return n.toFixed(2)
}

/**
 * Builds UBL 2.1 XML for a Colombian electronic invoice.
 * Returns raw XML string (unsigned).
 */
export function buildInvoiceXML(data: InvoiceData): string {
  const isInvoice = data.documentType === '01'
  const isCreditNote = data.documentType === '91'
  const rootTag = isInvoice ? 'Invoice' : isCreditNote ? 'CreditNote' : 'DebitNote'
  const ns = isInvoice
    ? 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2'
    : isCreditNote
      ? 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2'
      : 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2'

  const lines = [
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>`,
    `<${rootTag}`,
    `  xmlns="${ns}"`,
    `  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"`,
    `  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"`,
    `  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"`,
    `  xmlns:sts="dian:gov:co:facturaelectronica:Structures-2-1"`,
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">`,
    ``,
    // Extensions (placeholder for signature)
    `  <ext:UBLExtensions>`,
    `    <ext:UBLExtension>`,
    `      <ext:ExtensionContent>`,
    `        <sts:DianExtensions>`,
    `          <sts:InvoiceControl>`,
    `            <sts:InvoiceAuthorization>${esc(data.resolutionNumber)}</sts:InvoiceAuthorization>`,
    `            <sts:AuthorizationPeriod>`,
    `              <cbc:StartDate>${data.resolutionDate}</cbc:StartDate>`,
    `              <cbc:EndDate>${data.resolutionDate}</cbc:EndDate>`,
    `            </sts:AuthorizationPeriod>`,
    `            <sts:AuthorizedInvoices>`,
    `              <sts:Prefix>${esc(data.resolutionPrefix)}</sts:Prefix>`,
    `              <sts:From>${data.resolutionFrom}</sts:From>`,
    `              <sts:To>${data.resolutionTo}</sts:To>`,
    `            </sts:AuthorizedInvoices>`,
    `          </sts:InvoiceControl>`,
    `          <sts:InvoiceSource>`,
    `            <cbc:IdentificationCode listAgencyID="6" listAgencyName="United Nations Economic Commission for Europe" listSchemeURI="urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1">CO</cbc:IdentificationCode>`,
    `          </sts:InvoiceSource>`,
    `          <sts:SoftwareProvider>`,
    `            <sts:ProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)" schemeID="${data.supplier.dv}" schemeName="31">${esc(data.supplier.nit)}</sts:ProviderID>`,
    `            <sts:SoftwareID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)">${esc(data.softwareId)}</sts:SoftwareID>`,
    `          </sts:SoftwareProvider>`,
    `          <sts:SoftwareSecurityCode schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)">${data.softwareSecurityCode}</sts:SoftwareSecurityCode>`,
    `          <sts:AuthorizationProvider>`,
    `            <sts:AuthorizationProviderID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)" schemeID="4" schemeName="31">800197268</sts:AuthorizationProviderID>`,
    `          </sts:AuthorizationProvider>`,
    `          <sts:QRCode>${esc(data.qrUrl)}</sts:QRCode>`,
    `        </sts:DianExtensions>`,
    `      </ext:ExtensionContent>`,
    `    </ext:UBLExtension>`,
    `    <ext:UBLExtension>`,
    `      <ext:ExtensionContent/>`,
    `    </ext:UBLExtension>`,
    `  </ext:UBLExtensions>`,
    ``,
    // UBL Version
    `  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>`,
    `  <cbc:CustomizationID>${isInvoice ? '10' : isCreditNote ? '20' : '30'}</cbc:CustomizationID>`,
    `  <cbc:ProfileID>DIAN 2.1: Factura Electrónica de Venta</cbc:ProfileID>`,
    `  <cbc:ProfileExecutionID>${data.environment}</cbc:ProfileExecutionID>`,
    `  <cbc:ID>${esc(data.number)}</cbc:ID>`,
    `  <cbc:UUID schemeID="${data.environment}" schemeName="CUFE-SHA384">${data.cufe}</cbc:UUID>`,
    `  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>`,
    `  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>`,
    isInvoice ? `  <cbc:InvoiceTypeCode>${data.documentType}</cbc:InvoiceTypeCode>` : '',
    !isInvoice ? `  <cbc:${isCreditNote ? 'CreditNoteTypeCode' : 'DebitNoteTypeCode'}>${data.documentType}</${isCreditNote ? 'cbc:CreditNoteTypeCode' : 'cbc:DebitNoteTypeCode'}>` : '',
  ]

  // Notes
  if (data.notes?.length) {
    data.notes.forEach(note => {
      lines.push(`  <cbc:Note>${esc(note)}</cbc:Note>`)
    })
  }

  lines.push(
    `  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listAgencyID="6" listAgencyName="United Nations Economic Commission for Europe">${data.currency}</cbc:DocumentCurrencyCode>`,
    `  <cbc:LineCountNumeric>${data.items.length}</cbc:LineCountNumeric>`,
  )

  // Billing reference (for credit/debit notes)
  if (!isInvoice && data.originalInvoiceRef) {
    lines.push(
      `  <cac:BillingReference>`,
      `    <cac:InvoiceDocumentReference>`,
      `      <cbc:ID>${esc(data.originalInvoiceRef.number)}</cbc:ID>`,
      `      <cbc:UUID schemeName="CUFE-SHA384">${data.originalInvoiceRef.cufe}</cbc:UUID>`,
      `      <cbc:IssueDate>${data.originalInvoiceRef.issueDate}</cbc:IssueDate>`,
      `    </cac:InvoiceDocumentReference>`,
      `  </cac:BillingReference>`,
    )
    if (data.correctionReasonCode) {
      lines.push(
        `  <cac:DiscrepancyResponse>`,
        `    <cbc:ReferenceID>${esc(data.originalInvoiceRef.number)}</cbc:ReferenceID>`,
        `    <cbc:ResponseCode>${data.correctionReasonCode}</cbc:ResponseCode>`,
        `    <cbc:Description>${esc(data.correctionReasonDescription || '')}</cbc:Description>`,
        `  </cac:DiscrepancyResponse>`,
      )
    }
  }

  // Supplier party
  lines.push(
    ...buildPartyXML('cac:AccountingSupplierParty', data.supplier, true),
    ...buildCustomerPartyXML(data.customer),
  )

  // Payment means
  lines.push(
    `  <cac:PaymentMeans>`,
    `    <cbc:ID>1</cbc:ID>`,
    `    <cbc:PaymentMeansCode>${data.paymentMeansCode}</cbc:PaymentMeansCode>`,
    `    <cbc:PaymentDueDate>${data.dueDate}</cbc:PaymentDueDate>`,
    `    <cbc:PaymentID>${esc(data.number)}</cbc:PaymentID>`,
    `  </cac:PaymentMeans>`,
  )

  // Tax totals — group by tax code
  const taxGroups = new Map<string, { code: string; name: string; percent: number; base: number; amount: number }>()
  for (const item of data.items) {
    const key = item.taxCode
    const existing = taxGroups.get(key)
    if (existing) {
      existing.base += item.lineTotal
      existing.amount += item.taxAmount
    } else {
      taxGroups.set(key, {
        code: item.taxCode,
        name: item.taxName,
        percent: item.taxPercent,
        base: item.lineTotal,
        amount: item.taxAmount,
      })
    }
  }

  for (const [, tax] of taxGroups) {
    lines.push(
      `  <cac:TaxTotal>`,
      `    <cbc:TaxAmount currencyID="${data.currency}">${fmtAmt(tax.amount)}</cbc:TaxAmount>`,
      `    <cac:TaxSubtotal>`,
      `      <cbc:TaxableAmount currencyID="${data.currency}">${fmtAmt(tax.base)}</cbc:TaxableAmount>`,
      `      <cbc:TaxAmount currencyID="${data.currency}">${fmtAmt(tax.amount)}</cbc:TaxAmount>`,
      `      <cac:TaxCategory>`,
      `        <cbc:Percent>${fmtAmt(tax.percent)}</cbc:Percent>`,
      `        <cac:TaxScheme>`,
      `          <cbc:ID>${tax.code}</cbc:ID>`,
      `          <cbc:Name>${esc(tax.name)}</cbc:Name>`,
      `        </cac:TaxScheme>`,
      `      </cac:TaxCategory>`,
      `    </cac:TaxSubtotal>`,
      `  </cac:TaxTotal>`,
    )
  }

  // Legal monetary totals
  lines.push(
    `  <cac:LegalMonetaryTotal>`,
    `    <cbc:LineExtensionAmount currencyID="${data.currency}">${fmtAmt(data.subtotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount currencyID="${data.currency}">${fmtAmt(data.subtotal)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${fmtAmt(data.total)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount currencyID="${data.currency}">${fmtAmt(data.total)}</cbc:PayableAmount>`,
    `  </cac:LegalMonetaryTotal>`,
  )

  // Invoice lines
  const lineTag = isInvoice ? 'cac:InvoiceLine' : isCreditNote ? 'cac:CreditNoteLine' : 'cac:DebitNoteLine'
  const qtyTag = isInvoice ? 'cbc:InvoicedQuantity' : isCreditNote ? 'cbc:CreditedQuantity' : 'cbc:DebitedQuantity'

  for (const item of data.items) {
    lines.push(
      `  <${lineTag}>`,
      `    <cbc:ID>${item.id}</cbc:ID>`,
      `    <${qtyTag} unitCode="${item.unitCode}">${item.quantity}</${qtyTag}>`,
      `    <cbc:LineExtensionAmount currencyID="${data.currency}">${fmtAmt(item.lineTotal)}</cbc:LineExtensionAmount>`,
      `    <cac:TaxTotal>`,
      `      <cbc:TaxAmount currencyID="${data.currency}">${fmtAmt(item.taxAmount)}</cbc:TaxAmount>`,
      `      <cac:TaxSubtotal>`,
      `        <cbc:TaxableAmount currencyID="${data.currency}">${fmtAmt(item.lineTotal)}</cbc:TaxableAmount>`,
      `        <cbc:TaxAmount currencyID="${data.currency}">${fmtAmt(item.taxAmount)}</cbc:TaxAmount>`,
      `        <cac:TaxCategory>`,
      `          <cbc:Percent>${fmtAmt(item.taxPercent)}</cbc:Percent>`,
      `          <cac:TaxScheme>`,
      `            <cbc:ID>${item.taxCode}</cbc:ID>`,
      `            <cbc:Name>${esc(item.taxName)}</cbc:Name>`,
      `          </cac:TaxScheme>`,
      `        </cac:TaxCategory>`,
      `      </cac:TaxSubtotal>`,
      `    </cac:TaxTotal>`,
      `    <cac:Item>`,
      `      <cbc:Description>${esc(item.description)}</cbc:Description>`,
      item.productCode ? `      <cac:StandardItemIdentification><cbc:ID schemeID="999">${esc(item.productCode)}</cbc:ID></cac:StandardItemIdentification>` : '',
      `    </cac:Item>`,
      `    <cac:Price>`,
      `      <cbc:PriceAmount currencyID="${data.currency}">${fmtAmt(item.unitPrice)}</cbc:PriceAmount>`,
      `      <cbc:BaseQuantity unitCode="${item.unitCode}">1</cbc:BaseQuantity>`,
      `    </cac:Price>`,
      `  </${lineTag}>`,
    )
  }

  lines.push(`</${rootTag}>`)

  return lines.filter(l => l !== '').join('\n')
}

function buildPartyXML(tag: string, party: InvoiceParty, isSupplier: boolean): string[] {
  return [
    `  <${tag}>`,
    `    <cbc:AdditionalAccountID>${isSupplier ? '1' : '2'}</cbc:AdditionalAccountID>`,
    `    <cac:Party>`,
    `      <cac:PartyName>`,
    `        <cbc:Name>${esc(party.companyName)}</cbc:Name>`,
    `      </cac:PartyName>`,
    `      <cac:PhysicalLocation>`,
    `        <cac:Address>`,
    `          <cbc:ID>${party.address.cityCode}</cbc:ID>`,
    `          <cbc:CityName>${esc(party.address.city)}</cbc:CityName>`,
    `          <cbc:PostalZone>${party.address.postalCode}</cbc:PostalZone>`,
    `          <cbc:CountrySubentity>${esc(party.address.department)}</cbc:CountrySubentity>`,
    `          <cbc:CountrySubentityCode>${party.address.departmentCode}</cbc:CountrySubentityCode>`,
    `          <cac:AddressLine>`,
    `            <cbc:Line>${esc(party.address.street)}</cbc:Line>`,
    `          </cac:AddressLine>`,
    `          <cac:Country>`,
    `            <cbc:IdentificationCode>${party.address.countryCode}</cbc:IdentificationCode>`,
    `            <cbc:Name languageID="es">Colombia</cbc:Name>`,
    `          </cac:Country>`,
    `        </cac:Address>`,
    `      </cac:PhysicalLocation>`,
    `      <cac:PartyTaxScheme>`,
    `        <cbc:RegistrationName>${esc(party.registrationName)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)" schemeID="${party.dv}" schemeName="31">${esc(party.nit)}</cbc:CompanyID>`,
    `        <cbc:TaxLevelCode listName="48">${party.taxResponsibilities.join(';')}</cbc:TaxLevelCode>`,
    `        <cac:RegistrationAddress>`,
    `          <cbc:ID>${party.address.cityCode}</cbc:ID>`,
    `          <cbc:CityName>${esc(party.address.city)}</cbc:CityName>`,
    `          <cbc:CountrySubentity>${esc(party.address.department)}</cbc:CountrySubentity>`,
    `          <cbc:CountrySubentityCode>${party.address.departmentCode}</cbc:CountrySubentityCode>`,
    `          <cac:AddressLine>`,
    `            <cbc:Line>${esc(party.address.street)}</cbc:Line>`,
    `          </cac:AddressLine>`,
    `          <cac:Country>`,
    `            <cbc:IdentificationCode>${party.address.countryCode}</cbc:IdentificationCode>`,
    `          </cac:Country>`,
    `        </cac:RegistrationAddress>`,
    `        <cac:TaxScheme>`,
    `          <cbc:ID>${party.taxSchemeCode === 'O-13' ? '01' : '01'}</cbc:ID>`,
    `          <cbc:Name>IVA</cbc:Name>`,
    `        </cac:TaxScheme>`,
    `      </cac:PartyTaxScheme>`,
    `      <cac:PartyLegalEntity>`,
    `        <cbc:RegistrationName>${esc(party.registrationName)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)" schemeID="${party.dv}" schemeName="31">${esc(party.nit)}</cbc:CompanyID>`,
    `      </cac:PartyLegalEntity>`,
    party.contactEmail ? `      <cac:Contact><cbc:ElectronicMail>${esc(party.contactEmail)}</cbc:ElectronicMail></cac:Contact>` : '',
    `    </cac:Party>`,
    `  </${tag}>`,
  ]
}

function buildCustomerPartyXML(cust: CustomerParty): string[] {
  return [
    `  <cac:AccountingCustomerParty>`,
    `    <cbc:AdditionalAccountID>${cust.isCompany ? '1' : '2'}</cbc:AdditionalAccountID>`,
    `    <cac:Party>`,
    `      <cac:PartyName>`,
    `        <cbc:Name>${esc(cust.name)}</cbc:Name>`,
    `      </cac:PartyName>`,
    `      <cac:PhysicalLocation>`,
    `        <cac:Address>`,
    `          <cbc:ID>${cust.address.cityCode}</cbc:ID>`,
    `          <cbc:CityName>${esc(cust.address.city)}</cbc:CityName>`,
    `          <cbc:PostalZone>${cust.address.postalCode}</cbc:PostalZone>`,
    `          <cbc:CountrySubentity>${esc(cust.address.department)}</cbc:CountrySubentity>`,
    `          <cbc:CountrySubentityCode>${cust.address.departmentCode}</cbc:CountrySubentityCode>`,
    `          <cac:AddressLine>`,
    `            <cbc:Line>${esc(cust.address.street)}</cbc:Line>`,
    `          </cac:AddressLine>`,
    `          <cac:Country>`,
    `            <cbc:IdentificationCode>${cust.address.countryCode}</cbc:IdentificationCode>`,
    `            <cbc:Name languageID="es">Colombia</cbc:Name>`,
    `          </cac:Country>`,
    `        </cac:Address>`,
    `      </cac:PhysicalLocation>`,
    `      <cac:PartyTaxScheme>`,
    `        <cbc:RegistrationName>${esc(cust.registrationName)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)"${cust.dv ? ` schemeID="${cust.dv}"` : ''} schemeName="${cust.idType}">${esc(cust.idNumber)}</cbc:CompanyID>`,
    `        <cbc:TaxLevelCode listName="48">${cust.taxResponsibilities.join(';')}</cbc:TaxLevelCode>`,
    `        <cac:RegistrationAddress>`,
    `          <cbc:ID>${cust.address.cityCode}</cbc:ID>`,
    `          <cbc:CityName>${esc(cust.address.city)}</cbc:CityName>`,
    `          <cbc:CountrySubentity>${esc(cust.address.department)}</cbc:CountrySubentity>`,
    `          <cbc:CountrySubentityCode>${cust.address.departmentCode}</cbc:CountrySubentityCode>`,
    `          <cac:AddressLine>`,
    `            <cbc:Line>${esc(cust.address.street)}</cbc:Line>`,
    `          </cac:AddressLine>`,
    `          <cac:Country>`,
    `            <cbc:IdentificationCode>${cust.address.countryCode}</cbc:IdentificationCode>`,
    `          </cac:Country>`,
    `        </cac:RegistrationAddress>`,
    `        <cac:TaxScheme>`,
    `          <cbc:ID>01</cbc:ID>`,
    `          <cbc:Name>IVA</cbc:Name>`,
    `        </cac:TaxScheme>`,
    `      </cac:PartyTaxScheme>`,
    `      <cac:PartyLegalEntity>`,
    `        <cbc:RegistrationName>${esc(cust.registrationName)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeAgencyID="195" schemeAgencyName="CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)"${cust.dv ? ` schemeID="${cust.dv}"` : ''} schemeName="${cust.idType}">${esc(cust.idNumber)}</cbc:CompanyID>`,
    `      </cac:PartyLegalEntity>`,
    cust.email ? `      <cac:Contact><cbc:ElectronicMail>${esc(cust.email)}</cbc:ElectronicMail></cac:Contact>` : '',
    `    </cac:Party>`,
    `  </cac:AccountingCustomerParty>`,
  ]
}
