// Shared QuoteTemplate type and defaults used by the designer and the public view.

export interface QuoteTemplate {
  // Brand / company section
  showLogo: boolean
  logoPosition: 'left' | 'center' | 'right'
  showCompanyName: boolean
  showCompanyPhone: boolean
  showCompanyEmail: boolean
  showCompanyAddress: boolean
  showCompanyWebsite: boolean
  showCompanyNIT: boolean

  // Colors
  primaryColor: string
  accentColor: string
  textColor: string
  bgColor: string
  tableBg: string
  tableHeaderBg: string

  // Typography
  fontFamily: 'sans' | 'serif' | 'mono'
  headerSize: 'sm' | 'md' | 'lg'
  bodySize: 'xs' | 'sm' | 'md'

  // Layout
  headerLayout: 'logo-left' | 'logo-right' | 'logo-center' | 'no-logo'
  showBorder: boolean
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
  showWatermark: boolean

  // Quote fields
  showQuoteNumber: boolean
  showDate: boolean
  showDueDate: boolean
  showCustomerSection: boolean
  showNotes: boolean
  showBankInfo: boolean
  showPaymentTerms: boolean
  showSignatureLine: boolean
  showTaxes: boolean

  // Custom texts
  headerTitle: string
  footerText: string
  bankInfo: string
  paymentTerms: string
  closingMessage: string

  // Table columns
  showSKU: boolean
  showDescription: boolean
  showUnitPrice: boolean
  showDiscount: boolean
}

export const QUOTE_TEMPLATE_DEFAULTS: QuoteTemplate = {
  showLogo: true,
  logoPosition: 'left',
  showCompanyName: true,
  showCompanyPhone: true,
  showCompanyEmail: true,
  showCompanyAddress: true,
  showCompanyWebsite: false,
  showCompanyNIT: true,
  primaryColor: '#4F46E5',
  accentColor: '#10B981',
  textColor: '#111827',
  bgColor: '#FFFFFF',
  tableBg: '#F9FAFB',
  tableHeaderBg: '#4F46E5',
  fontFamily: 'sans',
  headerSize: 'lg',
  bodySize: 'sm',
  headerLayout: 'logo-left',
  showBorder: true,
  borderRadius: 'md',
  showWatermark: false,
  showQuoteNumber: true,
  showDate: true,
  showDueDate: true,
  showCustomerSection: true,
  showNotes: true,
  showBankInfo: false,
  showPaymentTerms: true,
  showSignatureLine: false,
  showTaxes: false,
  headerTitle: 'COTIZACIÓN',
  footerText: 'Gracias por su preferencia.',
  bankInfo: '',
  paymentTerms: 'Válido por 30 días a partir de la fecha de emisión.',
  closingMessage: '',
  showSKU: false,
  showDescription: true,
  showUnitPrice: true,
  showDiscount: false,
}

/** Merge a partial saved template with the defaults */
export function resolveTemplate(saved: Partial<QuoteTemplate> | null | undefined): QuoteTemplate {
  return { ...QUOTE_TEMPLATE_DEFAULTS, ...(saved ?? {}) }
}
