/**
 * Precios y cálculos de facturación
 *
 * Los precios en COP incluyen IVA (19%).
 * Los precios en USD son la referencia internacional (sin IVA).
 *
 * Para agregar USD en el futuro: pasar currency = 'USD' a las funciones.
 */

export type BillingCurrency = 'COP' | 'USD'

// ─── Tablas de precios ────────────────────────────────────────────────────────

export const PRICING_COP = {
  currency: 'COP' as const,
  perEstablishment: 70_000,      // COP/mes por sucursal (IVA incluido)
  perAdditionalAdvisor: 20_000,  // COP/mes por asesor adicional
  moduleFlat: 80_000,            // COP/mes por módulo activo (precio base plano)
  freeEstablishments: 1,
  freeAdvisors: 2,
} as const

export const PRICING_USD = {
  currency: 'USD' as const,
  perEstablishment: 15,
  perAdditionalAdvisor: 5,
  moduleFlat: 20,
  freeEstablishments: 1,
  freeAdvisors: 2,
} as const

export function getPricing(currency: BillingCurrency = 'COP') {
  return currency === 'COP' ? PRICING_COP : PRICING_USD
}

// ─── Cálculo mensual ──────────────────────────────────────────────────────────

export function calcMonthlyTotalBilling(
  establishments: number,
  advisors: number,
  numPaidModules: number,
  currency: BillingCurrency = 'COP',
): number {
  const p = getPricing(currency)
  // La primera sucursal es gratuita; las demás se cobran a p.perEstablishment
  const paidEstablishments = Math.max(0, establishments - p.freeEstablishments)
  const base = paidEstablishments * p.perEstablishment
  // Cada sucursal incluye 2 usuarios (incluida la gratuita)
  const includedAdvisors = establishments * 2
  const additionalAdvisors = Math.max(0, advisors - includedAdvisors)
  const advisorCost = additionalAdvisors * p.perAdditionalAdvisor
  const modulesCost = numPaidModules * p.moduleFlat
  return base + advisorCost + modulesCost
}

/** Convierte COP a centavos para la API de Wompi (COP × 100) */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Convierte centavos a unidad de moneda */
export function fromCents(centavos: number): number {
  return centavos / 100
}

// ─── Formato visual ────────────────────────────────────────────────────────────

export function formatCurrency(amount: number, currency: BillingCurrency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Referencia de transacción ─────────────────────────────────────────────────

/** Genera una referencia única para cada transacción de Wompi */
export function generateBillingReference(brandId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `TF-${brandId.slice(0, 8).toUpperCase()}-${date}-${rand}`
}

// ─── Fechas de facturación ─────────────────────────────────────────────────────

/** Calcula la próxima fecha de cobro dado un día ancla (1-28) */
export function nextBillingDate(anchorDay: number, from: Date = new Date()): Date {
  const day = Math.min(Math.max(anchorDay, 1), 28)
  const next = new Date(from)
  next.setDate(day)
  // Si ya pasó ese día este mes, ir al mes siguiente
  if (next <= from) next.setMonth(next.getMonth() + 1)
  next.setHours(10, 0, 0, 0) // 10 AM Colombia (UTC-5 → 15:00 UTC)
  return next
}

/** Calcula el fin del período actual (next_billing_at - 1 día) */
export function periodEnd(nextBillingAt: Date): Date {
  const end = new Date(nextBillingAt)
  end.setDate(end.getDate() - 1)
  return end
}
