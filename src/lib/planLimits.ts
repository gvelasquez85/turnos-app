export type Plan = 'free' | 'basic' | 'professional' | 'enterprise'

export interface PlanLimits {
  maxEstablishments: number
  maxAdvisors: number
  modules: string[]
  label: string
  priceMonthly: number | null
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    label: 'Gratis',
    priceMonthly: 0,
    maxEstablishments: 1,
    maxAdvisors: 3,
    modules: ['queue'],
  },
  basic: {
    label: 'Básico',
    priceMonthly: 29,
    maxEstablishments: 3,
    maxAdvisors: 10,
    modules: ['queue', 'display', 'surveys'],
  },
  professional: {
    label: 'Profesional',
    priceMonthly: 79,
    maxEstablishments: 10,
    maxAdvisors: 30,
    modules: ['queue', 'display', 'surveys', 'appointments', 'menu'],
  },
  enterprise: {
    label: 'Empresarial',
    priceMonthly: null,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: ['queue', 'display', 'surveys', 'appointments', 'menu', 'precheckin', 'precheckout', 'minibar'],
  },
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as Plan)] ?? PLAN_LIMITS.free
}
