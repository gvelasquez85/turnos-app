'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, CreditCard, Check, CheckCircle, ArrowRight,
  Zap, Star, Crown, Rocket,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  address: string | null
  contact_email: string | null
  website: string | null
}

interface Membership {
  id: string
  plan: string
  status: string
  started_at: string
  expires_at: string | null
  max_establishments: number
  max_advisors: number
}

interface Props {
  brand: Brand
  membership: Membership | null
  moduleSubscriptions: any[]
}

const PLANS = [
  {
    key: 'free',
    label: 'Gratis',
    price: 0,
    icon: Zap,
    color: 'text-gray-500',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    maxEstablishments: 1,
    maxAdvisors: 3,
    modules: ['Cola de espera básica'],
    cta: null,
  },
  {
    key: 'basic',
    label: 'Básico',
    price: 29,
    icon: Star,
    color: 'text-blue-600',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    maxEstablishments: 3,
    maxAdvisors: 10,
    modules: ['Cola de espera', 'Pantalla sala (display)', 'Encuestas NPS/CSAT'],
    cta: 'Contratar Básico',
  },
  {
    key: 'professional',
    label: 'Profesional',
    price: 79,
    icon: Rocket,
    color: 'text-indigo-600',
    border: 'border-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700',
    maxEstablishments: 10,
    maxAdvisors: 30,
    modules: ['Todo lo del Básico', 'Citas programadas', 'Menú y preorden', 'Pre check-in / check-out'],
    cta: 'Contratar Profesional',
    highlight: true,
  },
  {
    key: 'enterprise',
    label: 'Empresarial',
    price: null,
    icon: Crown,
    color: 'text-purple-600',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    maxEstablishments: null,
    maxAdvisors: null,
    modules: ['Todo lo del Profesional', 'Establecimientos ilimitados', 'Asesores ilimitados', 'SLA y soporte dedicado'],
    cta: 'Hablar con ventas',
  },
]

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  trial: 'Prueba',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function BrandSettings({ brand: initialBrand, membership, moduleSubscriptions }: Props) {
  const [tab, setTab] = useState<'profile' | 'membership'>('profile')
  const [brand, setBrand] = useState(initialBrand)
  const [form, setForm] = useState({
    name: initialBrand.name,
    logo_url: initialBrand.logo_url || '',
    primary_color: initialBrand.primary_color || '#6366f1',
    address: initialBrand.address || '',
    contact_email: initialBrand.contact_email || '',
    website: initialBrand.website || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('brands')
      .update({
        name: form.name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        address: form.address || null,
        contact_email: form.contact_email || null,
        website: form.website || null,
      })
      .eq('id', brand.id)
      .select()
      .single()
    if (data) setBrand(data as Brand)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentPlan = membership?.plan ?? 'free'
  const currentPlanDef = PLANS.find(p => p.key === currentPlan) ?? PLANS[0]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi marca</h1>
        <p className="text-gray-500 text-sm mt-1">Configura los datos de tu marca y revisa tu membresía</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([['profile', 'Perfil de marca', Building2], ['membership', 'Membresía', CreditCard]] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="max-w-lg bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col gap-4">
            <Input label="Nombre de la marca" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="URL del logo" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Color principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
                />
                <input
                  type="text"
                  value={form.primary_color}
                  onChange={e => {
                    const val = e.target.value
                    setForm(f => ({ ...f, primary_color: val }))
                  }}
                  onBlur={e => {
                    let val = e.target.value.trim()
                    if (val && !val.startsWith('#')) val = '#' + val
                    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
                      setForm(f => ({ ...f, primary_color: val.toLowerCase() }))
                    } else {
                      setForm(f => ({ ...f, primary_color: form.primary_color }))
                    }
                  }}
                  maxLength={7}
                  placeholder="#6366f1"
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="w-9 h-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: form.primary_color }} />
              </div>
            </div>
            <Input label="Dirección principal" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 123, Ciudad" />
            <Input label="Correo de contacto" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="contacto@marca.com" />
            <Input label="Sitio web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://www.marca.com" />
            <div className="pt-2">
              <Button onClick={handleSave} loading={saving}>
                {saved ? <><Check size={15} className="mr-1" /> Guardado</> : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'membership' && (
        <div className="max-w-4xl">
          {/* Current plan banner */}
          <div className={`bg-white rounded-xl border-2 ${currentPlanDef.border} p-5 mb-8 flex items-center justify-between flex-wrap gap-4`}>
            <div className="flex items-center gap-3">
              <currentPlanDef.icon size={22} className={currentPlanDef.color} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Plan actual</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-gray-900">{currentPlanDef.label}</span>
                  {membership && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[membership.status] ?? ''}`}>
                      {STATUS_LABELS[membership.status] ?? membership.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-gray-900">{membership?.max_establishments ?? 1}</p>
                <p className="text-gray-500 text-xs">Establecimientos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{membership?.max_advisors ?? 3}</p>
                <p className="text-gray-500 text-xs">Asesores</p>
              </div>
              {membership?.expires_at && (
                <div className="text-center">
                  <p className="font-bold text-gray-900">{new Date(membership.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-gray-500 text-xs">Vencimiento</p>
                </div>
              )}
            </div>
          </div>

          {/* Plan comparison grid */}
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Planes disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const isCurrent = plan.key === currentPlan
              const Icon = plan.icon
              return (
                <div
                  key={plan.key}
                  className={`bg-white rounded-2xl border-2 flex flex-col transition-all ${
                    plan.highlight ? 'border-indigo-400 shadow-lg shadow-indigo-100' : isCurrent ? plan.border : 'border-gray-100'
                  }`}
                >
                  {plan.highlight && (
                    <div className="bg-indigo-600 text-white text-xs font-bold text-center py-1.5 rounded-t-xl tracking-wider">
                      MÁS POPULAR
                    </div>
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={18} className={plan.color} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.label}</span>
                    </div>
                    <div className="mb-4">
                      {plan.price === null ? (
                        <span className="text-2xl font-black text-gray-900">Personalizado</span>
                      ) : plan.price === 0 ? (
                        <span className="text-2xl font-black text-gray-900">Gratis</span>
                      ) : (
                        <>
                          <span className="text-2xl font-black text-gray-900">${plan.price}</span>
                          <span className="text-gray-400 text-sm">/mes</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-4 space-y-1">
                      <p><span className="font-semibold text-gray-700">{plan.maxEstablishments ?? '∞'}</span> establecimientos</p>
                      <p><span className="font-semibold text-gray-700">{plan.maxAdvisors ?? '∞'}</span> asesores</p>
                    </div>
                    <ul className="space-y-1.5 flex-1 mb-5">
                      {plan.modules.map(m => (
                        <li key={m} className="flex items-start gap-2 text-xs text-gray-600">
                          <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                          {m}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <div className="w-full py-2 text-center text-sm font-medium text-gray-400 bg-gray-50 rounded-xl border border-gray-200">
                        Plan actual
                      </div>
                    ) : plan.cta ? (
                      <Button
                        className="w-full"
                        variant={plan.highlight ? 'primary' : 'secondary'}
                        onClick={() => setUpgradeModal(plan.key)}
                      >
                        {plan.cta} <ArrowRight size={14} className="ml-1" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active module subscriptions */}
          {moduleSubscriptions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Módulos adicionales activos</h3>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {moduleSubscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-700 capitalize">{sub.module_key.replace(/_/g, ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {sub.status === 'trial' ? `Trial — vence ${new Date(sub.trial_expires_at).toLocaleDateString('es')}` :
                       sub.status === 'active' ? 'Activo' : sub.status === 'expired' ? 'Vencido' : 'Cancelado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upgrade modal */}
      {upgradeModal && (() => {
        const plan = PLANS.find(p => p.key === upgradeModal)!
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <plan.icon size={24} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Contratar plan {plan.label}</h2>
              <p className="text-sm text-gray-500 mb-5">
                Estamos integrando el proceso de pago. Por ahora, contáctanos y activamos tu plan en minutos:
              </p>
              <a
                href={`mailto:soporte@turnapp.co?subject=Quiero contratar plan ${plan.label}&body=Hola, soy administrador de la marca "${brand.name}" y quiero contratar el plan ${plan.label}.`}
                className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3"
              >
                Contactar soporte →
              </a>
              <a
                href="https://wa.me/573001234567?text=Hola, quiero contratar TurnApp plan "
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 px-4 bg-green-500 text-white rounded-xl font-medium text-sm hover:bg-green-600 transition-colors mb-3"
              >
                Escribir por WhatsApp
              </a>
              <button onClick={() => setUpgradeModal(null)} className="text-sm text-gray-400 hover:text-gray-600">
                Cerrar
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
