'use client'

import { BarChart2, TrendingUp, Building2, Package, Percent } from 'lucide-react'
import { fmtCOP, PLANS, PLAN_ORDER, normalizePlan } from '@/lib/planLimits'

interface ModuleSub {
  id: string
  brand_id: string
  module_key: string
  status: string
  trial_expires_at: string | null
  expires_at: string | null
  created_at: string
  brands: { name: string } | { name: string }[] | null
}

interface MarketplaceModule {
  module_key: string
  label: string
  price_monthly: number
  price_per_user: boolean
  price_per_user_amount: number | null
  is_visible_to_brands?: boolean
  is_coming_soon?: boolean
}

interface Membership {
  plan: string
  max_advisors: number
  status: string
  billing_status: string
  brand_id: string
  brands: { name: string } | { name: string }[] | null
}

interface Props {
  moduleSubs: ModuleSub[]
  modules: MarketplaceModule[]
  memberships: Membership[]
  brandsCount: number
}

const MODULE_COLORS: Record<string, string> = {
  loyalty:     'bg-purple-100 text-purple-700',
  appointments: 'bg-blue-100 text-blue-700',
  inventory:   'bg-green-100 text-green-700',
  reports:     'bg-orange-100 text-orange-700',
  sms:         'bg-pink-100 text-pink-700',
  whatsapp:    'bg-emerald-100 text-emerald-700',
}

function moduleColor(key: string) {
  return MODULE_COLORS[key] ?? 'bg-indigo-100 text-indigo-700'
}

const PLAN_BADGE: Record<string, string> = {
  free:      'bg-gray-100 text-gray-600',
  essential: 'bg-blue-100 text-blue-700',
  business:  'bg-indigo-100 text-indigo-700',
}

export function ModuleAnalytics({ moduleSubs, modules, memberships, brandsCount }: Props) {
  // ── KPI helpers ──────────────────────────────────────────────────────────────
  const activeSubs  = moduleSubs.filter(s => s.status === 'active')
  const trialSubs   = moduleSubs.filter(s => s.status === 'trial')
  const expiredOrCancelled = moduleSubs.filter(s => s.status === 'expired' || s.status === 'cancelled')

  const moduleMap = Object.fromEntries(modules.map(m => [m.module_key, m]))

  const moduleMRR = activeSubs.reduce((acc, sub) => {
    const mod = moduleMap[sub.module_key]
    return acc + (mod?.price_monthly ?? 0)
  }, 0)

  const activeMemberships = memberships.filter(m => m.status === 'active')

  const planMRR = activeMemberships.reduce((acc, m) => {
    const plan = normalizePlan(m.plan)
    return acc + (PLANS[plan]?.price ?? 0)
  }, 0)

  const totalMRR = moduleMRR + planMRR

  const subsWithTrial = moduleSubs.filter(
    s => s.status === 'active' || s.status === 'expired' || s.status === 'cancelled'
  )
  const conversionRate = subsWithTrial.length > 0
    ? Math.round((activeSubs.length / subsWithTrial.length) * 100)
    : 0

  // ── Section 2: per-module stats ───────────────────────────────────────────
  const moduleRows = modules.map(mod => {
    const subs = moduleSubs.filter(s => s.module_key === mod.module_key)
    const active  = subs.filter(s => s.status === 'active').length
    const trial   = subs.filter(s => s.status === 'trial').length
    const expired = subs.filter(s => s.status === 'expired' || s.status === 'cancelled').length
    const denom   = active + expired
    const conv    = denom > 0 ? Math.round((active / denom) * 100) : null
    const revenue = active * (mod.price_monthly ?? 0)
    return { mod, active, trial, expired, conv, revenue }
  }).sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = Math.max(...moduleRows.map(r => r.revenue), 1)

  function convBadge(conv: number | null) {
    if (conv === null) return <span className="text-gray-400 text-xs">—</span>
    const cls = conv > 50 ? 'bg-green-100 text-green-700' : conv > 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{conv}%</span>
  }

  // ── Section 3: plan distribution ─────────────────────────────────────────
  const planGroups = PLAN_ORDER.map(planKey => {
    const group = memberships.filter(m => normalizePlan(m.plan) === planKey)
    const count = group.length
    const pct   = memberships.length > 0 ? Math.round((count / memberships.length) * 100) : 0
    const mrr   = group.filter(m => m.status === 'active').reduce((acc, m) => acc + (PLANS[planKey]?.price ?? 0), 0)
    const avgExtra = count > 0
      ? Math.round(group.reduce((acc, m) => acc + Math.max(0, (m.max_advisors ?? 0) - (PLANS[planKey]?.maxUsers ?? 0)), 0) / count)
      : 0
    return { planKey, count, pct, mrr, avgExtra }
  })

  // Brands with active module subs
  const brandModuleMap: Record<string, { name: string; modules: string[] }> = {}
  for (const sub of activeSubs) {
    if (!sub.brand_id) continue
    if (!brandModuleMap[sub.brand_id]) {
      const brandsObj = Array.isArray(sub.brands) ? sub.brands[0] : sub.brands
      brandModuleMap[sub.brand_id] = { name: brandsObj?.name ?? sub.brand_id, modules: [] }
    }
    brandModuleMap[sub.brand_id].modules.push(sub.module_key)
  }
  const brandModuleList = Object.values(brandModuleMap).sort((a, b) => b.modules.length - a.modules.length)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2">
        <BarChart2 size={20} className="text-indigo-600" />
        <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* ── Section 1: KPI row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'MRR estimado',         value: fmtCOP(totalMRR),            icon: TrendingUp,  color: 'text-indigo-600' },
          { label: 'Marcas activas',        value: activeMemberships.length,    icon: Building2,   color: 'text-blue-600'   },
          { label: 'Módulos vendidos',      value: activeSubs.length,           icon: Package,     color: 'text-green-600'  },
          { label: 'Conversión prueba→pago',value: `${conversionRate}%`,        icon: Percent,     color: 'text-amber-600'  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
            <div className={`${color}`}><Icon size={18} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Section 2: Module adoption table ─────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Módulos — tabla de adopción</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Módulo</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">En prueba</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Activos</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Venc./Canc.</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Conversión</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos/mes</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-28">Adopción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {moduleRows.map(({ mod, active, trial, expired, conv, revenue }) => {
                const widthPct = Math.round((revenue / maxRevenue) * 100)
                return (
                  <tr key={mod.module_key} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{mod.label}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{trial}</td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900">{active}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{expired}</td>
                    <td className="px-3 py-3 text-center">{convBadge(conv)}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-800">{fmtCOP(revenue)}</td>
                    <td className="px-5 py-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-24">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {moduleRows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400 text-sm">Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Plan distribution ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Distribución de planes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Marcas</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">% total</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">MRR</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Avg usuarios extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {planGroups.map(({ planKey, count, pct, mrr, avgExtra }) => (
                <tr key={planKey} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[planKey]}`}>
                      {PLANS[planKey]?.name ?? planKey}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900">{count}</td>
                  <td className="px-3 py-3 text-right text-gray-600">{pct}%</td>
                  <td className="px-3 py-3 text-right font-medium text-gray-800">{fmtCOP(mrr)}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{avgExtra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sub-section: Brands with active modules ───────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Marcas por módulo activo</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {brandModuleList.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin marcas con módulos activos</p>
          )}
          {brandModuleList.map(({ name, modules: mods }) => (
            <div key={name} className="px-5 py-3 flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {mods.map(key => {
                  const label = moduleMap[key]?.label ?? key
                  return (
                    <span key={key} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${moduleColor(key)}`}>
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
