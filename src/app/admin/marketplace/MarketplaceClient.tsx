'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CalendarClock, ClipboardList, UtensilsCrossed,
  LogIn, LogOut, Coffee, CheckCircle, Clock, AlertTriangle,
  Zap, Star, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

const MODULES = [
  {
    key: 'appointments',
    label: 'Citas programadas',
    desc: 'Permite a tus clientes reservar citas online. Reduce tiempos de espera y mejora la planificación.',
    price: 29,
    icon: CalendarClock,
    color: 'bg-blue-500',
    features: ['Reserva online 24/7', 'Confirmación automática', 'Gestión de agenda', 'Check-in en app'],
  },
  {
    key: 'surveys',
    label: 'Encuestas NPS / CSAT / CES',
    desc: 'Mide la satisfacción de tus clientes automáticamente al terminar cada atención.',
    price: 19,
    icon: ClipboardList,
    color: 'bg-purple-500',
    features: ['NPS, CSAT y CES', 'Pregunta abierta', 'Dashboard de resultados', 'Tendencias en el tiempo'],
  },
  {
    key: 'menu',
    label: 'Menú y Preorden',
    desc: 'Tus clientes pueden ver el menú y hacer pedidos mientras esperan su turno.',
    price: 39,
    icon: UtensilsCrossed,
    color: 'bg-orange-500',
    features: ['Catálogo de productos', 'Carrito digital', 'Pedidos en espera', 'Gestión de estados'],
  },
  {
    key: 'precheckin',
    label: 'Pre check-in',
    desc: 'El cliente completa su información antes de llegar. Agiliza la atención desde el primer minuto.',
    price: 29,
    icon: LogIn,
    color: 'bg-teal-500',
    features: ['Formulario personalizable', 'Validación de datos', 'Integración con cola', 'Historial del cliente'],
  },
  {
    key: 'precheckout',
    label: 'Pre check-out',
    desc: 'Digitaliza el proceso de salida. El cliente revisa y aprueba cargos antes de salir.',
    price: 29,
    icon: LogOut,
    color: 'bg-indigo-500',
    features: ['Resumen de consumos', 'Firma digital', 'Envío por email', 'Registro de cierre'],
  },
  {
    key: 'minibar',
    label: 'Consumo en habitación',
    desc: 'Registro de consumos en habitación o sala VIP en tiempo real. Ideal para hoteles y lounges.',
    price: 49,
    icon: Coffee,
    color: 'bg-amber-600',
    features: ['Catálogo por habitación', 'Registro en tiempo real', 'Cierre automático', 'Reporte de consumos'],
  },
]

function daysLeft(dateStr: string | null): number {
  if (!dateStr) return 0
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

type ModuleStatus = 'available' | 'trial' | 'active' | 'expired' | 'cancelled'

function getStatus(sub: Subscription | undefined): ModuleStatus {
  if (!sub) return 'available'
  if (sub.status === 'trial') {
    const left = daysLeft(sub.trial_expires_at)
    if (left === 0) return 'expired'
    return 'trial'
  }
  if (sub.status === 'active') {
    if (sub.expires_at && daysLeft(sub.expires_at) === 0) return 'expired'
    return 'active'
  }
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
        <Clock size={11} /> Trial — {left}d restantes
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

export function MarketplaceClient({ brandId, brandModules: initialModules, subscriptions: initialSubs }: Props) {
  const [subs, setSubs] = useState<Subscription[]>(initialSubs)
  const [brandModules, setBrandModules] = useState(initialModules)
  const [loading, setLoading] = useState<string | null>(null)
  const [contractModal, setContractModal] = useState<string | null>(null)

  function getSub(key: string) {
    return subs.find(s => s.module_key === key)
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
      .select()
      .single()

    if (!error && data) {
      setSubs(s => {
        const idx = s.findIndex(x => x.module_key === moduleKey)
        if (idx >= 0) { const n = [...s]; n[idx] = data as Subscription; return n }
        return [...s, data as Subscription]
      })
      // Activate in brand modules
      const updated = { ...brandModules, [moduleKey]: true }
      await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      setBrandModules(updated)
    }
    setLoading(null)
  }

  async function cancelModule(moduleKey: string) {
    if (!confirm('¿Cancelar este módulo? Se desactivará al final del período.')) return
    setLoading(moduleKey)
    const supabase = createClient()
    await supabase.from('module_subscriptions').update({ status: 'cancelled' }).eq('brand_id', brandId).eq('module_key', moduleKey)
    const updated = { ...brandModules, [moduleKey]: false }
    await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
    setSubs(s => s.map(x => x.module_key === moduleKey ? { ...x, status: 'cancelled' } : x))
    setBrandModules(updated)
    setLoading(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={22} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Marketplace de módulos</h1>
        </div>
        <p className="text-gray-500 text-sm">Expande tu TurnApp con módulos adicionales. Prueba gratis 7 días, sin tarjeta de crédito.</p>
      </div>

      {/* Módulos activos (si hay alguno) */}
      {subs.filter(s => ['trial','active'].includes(s.status)).length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Módulos activos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {subs.filter(s => ['trial','active'].includes(s.status)).map(sub => {
              const mod = MODULES.find(m => m.key === sub.module_key)
              if (!mod) return null
              const status = getStatus(sub)
              const Icon = mod.icon
              return (
                <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${mod.color} rounded-lg flex items-center justify-center shrink-0`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{mod.label}</p>
                    <StatusBadge status={status} sub={sub} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Catálogo */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Catálogo de módulos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(mod => {
          const sub = getSub(mod.key)
          const status = getStatus(sub)
          const Icon = mod.icon
          const isLoading = loading === mod.key

          return (
            <div key={mod.key} className={`bg-white rounded-2xl border-2 flex flex-col transition-all ${status === 'active' || status === 'trial' ? 'border-indigo-200' : 'border-gray-100 hover:border-gray-200'}`}>
              {/* Card header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 ${mod.color} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  {status !== 'available' && <StatusBadge status={status} sub={sub} />}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{mod.label}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{mod.desc}</p>
                <ul className="space-y-1.5">
                  {mod.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle size={12} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card footer */}
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between mb-3 pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-2xl font-black text-gray-900">${mod.price}</span>
                    <span className="text-gray-400 text-sm">/mes</span>
                  </div>
                  {status === 'available' && (
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg">
                      <Star size={10} className="inline mr-1" />7 días gratis
                    </span>
                  )}
                </div>

                {status === 'available' && (
                  <Button onClick={() => startTrial(mod.key)} loading={isLoading} className="w-full">
                    Probar gratis 7 días <ArrowRight size={14} className="ml-1" />
                  </Button>
                )}
                {status === 'trial' && (
                  <div className="flex gap-2">
                    <Button onClick={() => setContractModal(mod.key)} className="flex-1">
                      Contratar ahora
                    </Button>
                    <Button variant="secondary" onClick={() => cancelModule(mod.key)} loading={isLoading} className="flex-1">
                      Cancelar
                    </Button>
                  </div>
                )}
                {status === 'active' && (
                  <Button variant="secondary" onClick={() => cancelModule(mod.key)} loading={isLoading} className="w-full">
                    Cancelar módulo
                  </Button>
                )}
                {(status === 'expired' || status === 'cancelled') && (
                  <Button onClick={() => setContractModal(mod.key)} className="w-full">
                    Contratar módulo
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Contract modal (placeholder - Stripe coming soon) */}
      {contractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Pago en línea próximamente</h2>
            <p className="text-sm text-gray-500 mb-4">
              Estamos integrando el proceso de pago. Por ahora, contacta a nuestro equipo para activar el módulo:
            </p>
            <a
              href="mailto:soporte@turnapp.co?subject=Contratar módulo"
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
