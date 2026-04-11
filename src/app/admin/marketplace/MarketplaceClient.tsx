'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarClock, ClipboardList, UtensilsCrossed,
  LogIn, LogOut, Coffee, CheckCircle, Clock, AlertTriangle,
  Zap, Star, ArrowRight, UserCheck, Lock, Building2, Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calcMonthlyBase, PRICING } from '@/lib/planLimits'

// Map icon name strings from DB to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  CalendarClock, ClipboardList, UtensilsCrossed,
  LogIn, LogOut, Coffee, UserCheck, Zap,
}
function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Zap
}

export interface MarketplaceModule {
  id: string
  module_key: string
  label: string
  description: string | null
  icon: string | null
  color: string | null
  features: string[] | null
  price_monthly: number
  price_per_user: boolean
  price_per_user_amount: number
  trial_days: number
  // legacy columns (may still exist in DB)
  price_per_establishment?: number
  price_per_advisor?: number
  is_visible_to_brands: boolean
  is_coming_soon: boolean
  sort_order: number
}

interface Subscription {
  id: string
  brand_id: string
  module_key: string
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  trial_started_at: string
  trial_expires_at: string | null
  activated_at: string | null
  expires_at: string | null
  price_monthly: number | null
}

interface Props {
  brandId: string
  brandModules: Record<string, boolean>
  subscriptions: Subscription[]
  modules: MarketplaceModule[]
  isSuperadmin: boolean
  maxEstablishments: number
  maxAdvisors: number
}

function daysLeft(dateStr: string | null): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

type ModuleStatus = 'available' | 'trial' | 'active' | 'expired' | 'cancelled'

function getStatus(sub: Subscription | undefined): ModuleStatus {
  if (!sub) return 'available'
  if (sub.status === 'trial') return daysLeft(sub.trial_expires_at) === 0 ? 'expired' : 'trial'
  if (sub.status === 'active') return sub.expires_at && daysLeft(sub.expires_at) === 0 ? 'expired' : 'active'
  return sub.status as ModuleStatus
}

function StatusBadge({ status, sub }: { status: ModuleStatus; sub?: Subscription }) {
  if (status === 'active') return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
      <CheckCircle size={11} /> Activo
    </span>
  )
  if (status === 'trial') {
    const left = daysLeft(sub?.trial_expires_at ?? null)
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
        <Clock size={11} /> Trial — {left}d
      </span>
    )
  }
  if (status === 'expired') return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
      <AlertTriangle size={11} /> Vencido
    </span>
  )
  return null
}

export function MarketplaceClient({
  brandId,
  brandModules: initialModules,
  subscriptions: initialSubs,
  modules,
  maxEstablishments,
  maxAdvisors,
}: Props) {
  const [subs, setSubs] = useState<Subscription[]>(initialSubs)
  const [brandModules, setBrandModules] = useState(initialModules)
  const [loading, setLoading] = useState<string | null>(null)
  const [contractModal, setContractModal] = useState<string | null>(null)

  function getSub(key: string) { return subs.find(s => s.module_key === key) }
  function modulePrice(mod: MarketplaceModule) {
    const base = mod.price_monthly ?? 0
    const perUser = mod.price_per_user ? (mod.price_per_user_amount ?? 0) * maxAdvisors : 0
    return base + perUser
  }

  async function startTrial(moduleKey: string) {
    setLoading(moduleKey)
    const supabase = createClient()
    const trialExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('module_subscriptions')
      .upsert({
        brand_id: brandId,
        module_key: moduleKey,
        status: 'trial',
        trial_started_at: new Date().toISOString(),
        trial_expires_at: trialExpires,
      }, { onConflict: 'brand_id,module_key' })
      .select().single()

    if (!error && data) {
      setSubs(s => {
        const idx = s.findIndex(x => x.module_key === moduleKey)
        if (idx >= 0) { const n = [...s]; n[idx] = data as Subscription; return n }
        return [...s, data as Subscription]
      })
      const updated = { ...brandModules, [moduleKey]: true }
      await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      setBrandModules(updated)
    }
    setLoading(null)
  }

  async function cancelModule(moduleKey: string) {
    if (!confirm('¿Cancelar este módulo? Se desactivará de inmediato.')) return
    setLoading(moduleKey)
    const supabase = createClient()
    await supabase.from('module_subscriptions').update({ status: 'cancelled' })
      .eq('brand_id', brandId).eq('module_key', moduleKey)
    const updated = { ...brandModules, [moduleKey]: false }
    await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
    setSubs(s => s.map(x => x.module_key === moduleKey ? { ...x, status: 'cancelled' } : x))
    setBrandModules(updated)
    setLoading(null)
  }

  const activeSubs = subs.filter(s => ['trial', 'active'].includes(s.status))
  const baseMonthly = calcMonthlyBase(maxEstablishments, maxAdvisors)
  const addonMonthly = activeSubs.reduce((sum, sub) => {
    const mod = modules.find(m => m.module_key === sub.module_key)
    if (!mod) return sum
    return sum + modulePrice(mod)
  }, 0)

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <Lock size={28} className="text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Marketplace no disponible aún</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Pronto habrá módulos disponibles para ampliar tu TurnApp. Contacta a soporte para más información.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={22} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Marketplace de módulos</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Expande TurnApp con funcionalidades adicionales. Prueba gratis 7 días, sin tarjeta de crédito.
        </p>
      </div>

      {/* Pricing summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 mb-7 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-indigo-700">
            <Building2 size={15} />
            <span><strong>{maxEstablishments}</strong> sucursal{maxEstablishments !== 1 ? 'es' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Users size={15} />
            <span><strong>{maxAdvisors}</strong> usuario{maxAdvisors !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="text-sm text-right">
          <p className="text-gray-600">
            Base <strong className="text-gray-900">${baseMonthly}/mes</strong>
            {addonMonthly > 0 && (
              <> + módulos <strong className="text-indigo-700">+${addonMonthly}/mes</strong></>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            ${PRICING.perEstablishment}/sucursal · ${PRICING.perAdditionalAdvisor}/usuario adicional
          </p>
        </div>
      </div>

      {/* Active modules */}
      {activeSubs.length > 0 && (
        <div className="mb-7">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Módulos activos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeSubs.map(sub => {
              const mod = modules.find(m => m.module_key === sub.module_key)
              if (!mod) return null
              const Icon = getIcon(mod.icon ?? '')
              return (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${mod.color ?? 'bg-indigo-500'} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{mod.label}</p>
                    <StatusBadge status={getStatus(sub)} sub={sub} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Catalogue */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Catálogo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {modules.map(mod => {
          const sub = getSub(mod.module_key)
          const status = getStatus(sub)
          const Icon = getIcon(mod.icon ?? '')
          const isLoading = loading === mod.module_key
          const price = modulePrice(mod)
          const comingSoon = mod.is_coming_soon

          return (
            <div
              key={mod.module_key}
              className={`bg-white rounded-2xl border-2 flex flex-col transition-all ${
                status === 'active' || status === 'trial' ? 'border-indigo-200'
                : comingSoon ? 'border-dashed border-gray-200 opacity-70'
                : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${mod.color ?? 'bg-indigo-500'} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {comingSoon && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                        Próximamente
                      </span>
                    )}
                    {!comingSoon && status !== 'available' && <StatusBadge status={status} sub={sub} />}
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{mod.label}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{mod.description}</p>
                {(mod.features ?? []).length > 0 && (
                  <ul className="space-y-1.5">
                    {(mod.features ?? []).map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle size={12} className="text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-5 pb-5">
                <div className="flex items-end justify-between mb-3 pt-4 border-t border-gray-100">
                  <div>
                    {price > 0 ? (
                      <>
                        <div>
                          <span className="text-2xl font-black text-gray-900">${price}</span>
                          <span className="text-gray-400 text-sm">/mes</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          ${mod.price_monthly}/mes base
                          {mod.price_per_user && ` + $${mod.price_per_user_amount}/usuario`}
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Gratis</span>
                    )}
                  </div>
                  {!comingSoon && status === 'available' && (
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      <Star size={10} className="inline mr-1" />7 días gratis
                    </span>
                  )}
                </div>

                {comingSoon ? (
                  <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
                    <Lock size={14} /> Próximamente
                  </button>
                ) : status === 'available' ? (
                  <Button onClick={() => startTrial(mod.module_key)} disabled={isLoading} className="w-full">
                    Probar gratis 7 días <ArrowRight size={14} className="ml-1" />
                  </Button>
                ) : status === 'trial' ? (
                  <div className="flex gap-2">
                    <Button onClick={() => setContractModal(mod.module_key)} className="flex-1 text-sm">Contratar</Button>
                    <Button variant="secondary" onClick={() => cancelModule(mod.module_key)} disabled={isLoading} className="flex-1 text-sm">Cancelar</Button>
                  </div>
                ) : status === 'active' ? (
                  <Button variant="secondary" onClick={() => cancelModule(mod.module_key)} disabled={isLoading} className="w-full">
                    Cancelar módulo
                  </Button>
                ) : (
                  <Button onClick={() => setContractModal(mod.module_key)} className="w-full">
                    Contratar módulo
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Contract modal */}
      {contractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Pago en línea próximamente</h2>
            <p className="text-sm text-gray-500 mb-4">
              Estamos integrando el proceso de pago. Por ahora contacta a nuestro equipo para activar el módulo:
            </p>
            <a
              href={`mailto:soporte@turnapp.co?subject=Contratar módulo: ${contractModal}`}
              className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3"
            >
              Contactar soporte
            </a>
            <button onClick={() => setContractModal(null)} className="text-sm text-gray-400 hover:text-gray-600">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
