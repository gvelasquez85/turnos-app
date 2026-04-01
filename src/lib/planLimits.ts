export type Plan = 'free' | 'basic' | 'professional' | 'enterprise' | 'enterprise_plus'

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

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    label: 'Gratis',
    priceMonthly: 0,
    maxEstablishments: 1,
    maxAdvisors: 3,
    modules: ['queue', 'display'],
    hasReports: false,
    hasSurveys: false,
    hasAppointments: false,
    hasMenu: false,
  },
  basic: {
    label: 'Básico',
    priceMonthly: 29,
    maxEstablishments: 3,
    maxAdvisors: 10,
    modules: ['queue', 'display', 'surveys'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: false,
    hasMenu: false,
  },
  professional: {
    label: 'Profesional',
    priceMonthly: 49,
    maxEstablishments: 10,
    maxAdvisors: 30,
    modules: ['queue', 'display', 'surveys', 'appointments'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: false,
  },
  enterprise: {
    label: 'Empresarial',
    priceMonthly: 79,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: ['queue', 'display', 'surveys', 'appointments'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: false,
  },
  enterprise_plus: {
    label: 'Empresarial Plus',
    priceMonthly: null,
    maxEstablishments: 9999,
    maxAdvisors: 9999,
    modules: ['queue', 'display', 'surveys', 'appointments', 'menu', 'precheckin', 'precheckout', 'minibar'],
    hasReports: true,
    hasSurveys: true,
    hasAppointments: true,
    hasMenu: true,
  },
}

export const ADDON_PRICES = {
  extraAdvisor: 3.99,
  extraEstablishment: 5.99,
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as Plan)] ?? PLAN_LIMITS.free
}
