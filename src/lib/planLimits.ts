// ══════════════════════════════════════════════════════════════════════════════
// Plan definitions — single source of truth for tier limits and pricing
// All amounts in COP (Colombian Pesos), IVA incluido.
// ══════════════════════════════════════════════════════════════════════════════

export type PlanKey = 'free' | 'essential' | 'business' | 'enterprise'

export interface PlanDef {
  key: PlanKey
  name: string
  price: number           // COP/mes
  priceAnnual: number     // COP/año (2 meses gratis)
  /** null = unlimited */
  maxClients: number | null
  maxProducts: number | null
  maxSalesPerMonth: number | null
  maxEstablishments: number
  maxUsers: number        // total including brand_admin
  description: string
  highlighted?: boolean
  features: string[]
}

export const PLANS: Record<PlanKey, PlanDef> = {
  free: {
    key: 'free',
    name: 'Gratis',
    price: 0,
    priceAnnual: 0,
    maxClients: 30,
    maxProducts: 20,
    maxSalesPerMonth: 20,
    maxEstablishments: 1,
    maxUsers: 1,
    description: 'Para probar y organizar lo básico',
    features: [
      'Hasta 30 clientes',
      'Hasta 20 productos/servicios',
      'Hasta 20 registros de venta al mes',
      '1 sucursal · 1 usuario',
      'Módulo Clientes completo',
      'Cola de espera con QR',
    ],
  },
  essential: {
    key: 'essential',
    name: 'Esencial',
    price: 29_900,
    priceAnnual: 299_000,
    maxClients: 300,
    maxProducts: 100,
    maxSalesPerMonth: null,
    maxEstablishments: 2,
    maxUsers: 6,
    description: 'Para empezar a controlar tu negocio',
    features: [
      'Hasta 300 clientes',
      'Hasta 100 productos/servicios',
      'Ventas ilimitadas',
      'Hasta 2 sucursales · 6 usuarios',
      'Cotizaciones y agenda básica',
      'Inventario básico',
      'Exportación Excel (ventas, clientes)',
      'Recordatorios y tareas',
    ],
  },
  business: {
    key: 'business',
    name: 'Negocio',
    price: 59_900,
    priceAnnual: 599_000,
    maxClients: null,
    maxProducts: null,
    maxSalesPerMonth: null,
    maxEstablishments: 5,
    maxUsers: 16,
    description: 'Para negocios que venden todos los días',
    highlighted: true,
    features: [
      'Clientes ilimitados',
      'Productos/servicios ilimitados',
      'Hasta 5 sucursales · 16 usuarios',
      'Cotizaciones + seguimiento completo',
      'Inventario con alertas',
      'Dashboard ventas, clientes e inventario',
      'Clientes inactivos y recordatorios recompra',
      'Exportación para contador (Excel)',
      'Soporte prioritario por WhatsApp',
    ],
  },
  enterprise: {
    key: 'enterprise',
    name: 'Empresarial',
    price: 0,
    priceAnnual: 0,
    maxClients: null,
    maxProducts: null,
    maxSalesPerMonth: null,
    maxEstablishments: 9999,
    maxUsers: 9999,
    description: 'Lo construimos a tu necesidad',
    features: [
      'Todo lo del plan Negocio',
      'Sucursales y usuarios ilimitados',
      'Configuración personalizada',
      'Soporte dedicado',
      'Integraciones a medida',
    ],
  },
}

export const PLAN_ORDER: PlanKey[] = ['free', 'essential', 'business', 'enterprise']

// ── Add-on prices (COP/mes) ──────────────────────────────────────────────────

export const ADDON_PRICES_COP = {
  extra_user:       9_900,   // por usuario adicional más allá del límite del plan
  whatsapp:        19_900,   // automatizaciones WhatsApp
  advanced_reports: 19_900,  // reportes avanzados
} as const

export type AddonKey = keyof typeof ADDON_PRICES_COP

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map legacy plan strings → canonical PlanKey.
 * Existing 'basic' → 'essential'; 'professional/enterprise/standard' → 'business'.
 */
export function normalizePlan(plan: string | null | undefined): PlanKey {
  if (!plan) return 'free'
  if (plan === 'essential' || plan === 'business' || plan === 'enterprise') return plan
  if (plan === 'free') return 'free'
  if (plan === 'basic') return 'essential'
  if (['professional', 'enterprise_plus', 'standard'].includes(plan)) return 'business'
  return 'free'
}

export function getPlanDef(plan: string | null | undefined): PlanDef {
  return PLANS[normalizePlan(plan)]
}

/** Compare plan tiers: -1 if a < b, 0 if equal, 1 if a > b */
export function comparePlans(a: PlanKey, b: PlanKey): number {
  return PLAN_ORDER.indexOf(a) - PLAN_ORDER.indexOf(b)
}

/** Plans that are upgrades relative to the given plan */
export function upgradePlans(current: PlanKey): PlanDef[] {
  return PLAN_ORDER
    .filter(k => comparePlans(k, current) > 0)
    .map(k => PLANS[k])
}

/** Calculate monthly total (plan base + extra users + active add-on modules) */
export function calcMonthlyTotal(
  planKey: PlanKey,
  extraUsers: number,
  activeAddons: AddonKey[],
): number {
  const plan = PLANS[planKey]
  const userCost = Math.max(0, extraUsers) * ADDON_PRICES_COP.extra_user
  const addonCost = activeAddons.reduce((sum, k) => sum + ADDON_PRICES_COP[k], 0)
  return plan.price + userCost + addonCost
}

/** Format COP amount */
export function fmtCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Legacy exports (backwards compat) ────────────────────────────────────────

export type Plan =
  | PlanKey
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
  priceMonthly: number | null
  hasReports: boolean
  hasSurveys: boolean
  hasAppointments: boolean
  hasMenu: boolean
}

export const CORE_MODULES = [
  'clientes',
  'crm',
  'sales',
  'display',
  'advisor_fields',
  'forms',
]

/** Modules that require the queue module to be active */
export const QUEUE_DEPENDENT_MODULES = ['consents']

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    label: 'Gratis',
    priceMonthly: 0,
    maxEstablishments: PLANS.free.maxEstablishments,
    maxAdvisors: PLANS.free.maxUsers,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  essential: {
    label: 'Esencial',
    priceMonthly: PLANS.essential.price,
    maxEstablishments: PLANS.essential.maxEstablishments,
    maxAdvisors: PLANS.essential.maxUsers,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  business: {
    label: 'Negocio',
    priceMonthly: PLANS.business.price,
    maxEstablishments: PLANS.business.maxEstablishments,
    maxAdvisors: PLANS.business.maxUsers,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: true,
  },
  // Legacy aliases
  standard: {
    label: 'Negocio (legado)',
    priceMonthly: PLANS.business.price,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  basic: {
    label: 'Esencial (legado)',
    priceMonthly: PLANS.essential.price,
    maxEstablishments: 3,
    maxAdvisors: 10,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  professional: {
    label: 'Negocio (legado)',
    priceMonthly: PLANS.business.price,
    maxEstablishments: 10,
    maxAdvisors: 30,
    modules: CORE_MODULES,
    hasReports: true,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  enterprise: {
    label: 'Empresarial',
    priceMonthly: null,
    maxEstablishments: PLANS.enterprise.maxEstablishments,
    maxAdvisors: PLANS.enterprise.maxUsers,
    modules: [...CORE_MODULES, 'surveys', 'appointments', 'menu'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: true,
  },
  enterprise_plus: {
    label: 'Negocio (legado)',
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

export const ADDON_PRICES = { extraAdvisor: ADDON_PRICES_COP.extra_user, extraEstablishment: 0 }

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

export const PRICING = {
  perEstablishment:     60_000,
  perAdditionalAdvisor: ADDON_PRICES_COP.extra_user,
  modulePerEstablishment: 10_000,
  modulePerAdvisor: 5_000,
} as const

export function calcQueuePrice(establishments: number): number {
  return 80_000 + Math.max(0, establishments - 1) * 20_000
}
