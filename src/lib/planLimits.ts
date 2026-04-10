// ══════════════════════════════════════════════════════════════════════════════
// New per-seat + per-module pricing model
// ══════════════════════════════════════════════════════════════════════════════

/** Runtime pricing constants */
export const PRICING = {
  perEstablishment: 15,         // $15/month per establishment (includes 1 advisor)
  perAdditionalAdvisor: 5,      // $5/month per additional advisor beyond 1 per est.
  modulePerEstablishment: 5,    // $5/month per establishment per add-on module
  modulePerAdvisor: 2,          // $2/month per additional advisor per add-on module
} as const

/** Core features always included — no extra charge */
export const CORE_MODULES = [
  'queue',
  'display',
  'consents',
  'promotions',
  'advisor_fields',
  'forms',
]

/**
 * Calculate base monthly cost.
 * @param establishments - number of active establishments
 * @param advisors       - total advisor seats (1 is free per establishment)
 */
export function calcMonthlyBase(establishments: number, advisors: number): number {
  const base = establishments * PRICING.perEstablishment
  const includedAdvisors = establishments          // 1 included per establishment
  const additionalAdvisors = Math.max(0, advisors - includedAdvisors)
  return base + additionalAdvisors * PRICING.perAdditionalAdvisor
}

/**
 * Calculate add-on module cost per month.
 * @param establishments - number of active establishments
 * @param advisors       - total advisor seats
 * @param numModules     - number of active paid add-on modules
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

/** Full monthly total. */
export function calcMonthlyTotal(
  establishments: number,
  advisors: number,
  numModules: number,
): number {
  return calcMonthlyBase(establishments, advisors) + calcModuleAddon(establishments, advisors, numModules)
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

/**
 * In the new model all paid plans have access to all core features.
 * Module gating is handled exclusively via brands.active_modules.
 */
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
  // ── Legacy tiers (migrate gradually) ──
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
