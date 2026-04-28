// ══════════════════════════════════════════════════════════════════════════════
// Pricing model — all amounts in COP (Colombian Peso)
// ══════════════════════════════════════════════════════════════════════════════

/** Runtime pricing constants — all in COP */
export const PRICING = {
  perEstablishment: 60_000,       // $60.000 COP/mes por sucursal (incluye 1 usuario)
  perAdditionalAdvisor: 20_000,   // $20.000 COP/mes por usuario adicional
  modulePerEstablishment: 10_000, // $10.000 COP/mes por sucursal por módulo add-on
  modulePerAdvisor: 5_000,        // $5.000 COP/mes por usuario adicional por módulo
} as const

/** Core features always included — no extra charge */
export const CORE_MODULES = [
  'clientes',
  'crm',       // alias for clientes
  'sales',
  'display',
  'consents',
  'advisor_fields',
  'forms',
]

/**
 * Calculate queue module price (COP).
 * Base: $80.000/mes. Each additional establishment beyond the first: +$20.000.
 */
export function calcQueuePrice(establishments: number): number {
  const BASE = 80_000
  const PER_EXTRA_EST = 20_000
  return BASE + Math.max(0, establishments - 1) * PER_EXTRA_EST
}

/**
 * Calculate base monthly cost (COP).
 * @param establishments - number of active establishments
 * @param advisors       - total advisor seats (1 is free per establishment)
 */
export function calcMonthlyBase(establishments: number, advisors: number): number {
  const base = establishments * PRICING.perEstablishment
  const includedAdvisors = establishments           // 1 per establishment included
  const additionalAdvisors = Math.max(0, advisors - includedAdvisors)
  return base + additionalAdvisors * PRICING.perAdditionalAdvisor
}

/**
 * Calculate add-on module cost per month (COP).
 */
export function calcModuleAddon(
  establishments: number,
  advisors: number,
  numModules: number,
): number {
  const additionalAdvisors = Math.max(0, advisors - establishments)
  const costPerModule =
    establishments * PRICING.modulePerEstablishment +
    additionalAdvisors * PRICING.modulePerAdvisor
  return numModules * costPerModule
}

/** Full monthly total (COP). */
export function calcMonthlyTotal(
  establishments: number,
  advisors: number,
  numModules: number,
): number {
  return calcMonthlyBase(establishments, advisors) + calcModuleAddon(establishments, advisors, numModules)
}

/** Format a COP amount for display */
export function fmtCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Legacy plan definitions (kept for backwards compatibility) ─────────────

export type Plan =
  | 'free'
  | 'basic'
  | 'professional'
  | 'enterprise'
  | 'enterprise_plus'
  | 'standard'

export interface PlanLimits {
  maxEstablishments: number
  maxAdvisors: number
  modules: string[]
  label: string
  priceMonthly: number | null   // null = dynamic / contact sales
  hasReports: boolean
  hasSurveys: boolean
  hasAppointments: boolean
  hasMenu: boolean
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    label: 'Gratis',
    priceMonthly: 0,
    maxEstablishments: 1,
    maxAdvisors: 2,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  standard: {
    label: 'Estándar',
    priceMonthly: null,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  basic: {
    label: 'Básico (legado)',
    priceMonthly: 29,
    maxEstablishments: 3,
    maxAdvisors: 10,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  professional: {
    label: 'Profesional (legado)',
    priceMonthly: 49,
    maxEstablishments: 10,
    maxAdvisors: 30,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  enterprise: {
    label: 'Empresarial (legado)',
    priceMonthly: 79,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  enterprise_plus: {
    label: 'Empresarial Plus (legado)',
    priceMonthly: null,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: [...CORE_MODULES, 'surveys', 'appointments', 'menu'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: true,
  },
}

/** Backward-compat addon prices for existing components */
export const ADDON_PRICES = {
  extraAdvisor: PRICING.perAdditionalAdvisor,
  extraEstablishment: PRICING.perEstablishment,
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}
