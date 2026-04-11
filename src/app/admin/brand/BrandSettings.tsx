'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, CreditCard, Check, CheckCircle, ArrowRight,
  X, AlertTriangle, Plus, Minus, Users, Store, Key, Webhook, Copy, Trash2,
  RefreshCw, ExternalLink, Eye, EyeOff, Globe,
} from 'lucide-react'
import { useEffect, useCallback } from 'react'
import { PRICING, calcMonthlyBase, calcModuleAddon } from '@/lib/planLimits'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations'
import { PayPalButton } from '@/components/PayPalButton'

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  address: string | null
  contact_email: string | null
  website: string | null
  language: string | null
  country: string | null
}

const COUNTRIES = [
  'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela',
  'Bolivia', 'Paraguay', 'Uruguay', 'Brasil', 'Panamá', 'Costa Rica',
  'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'República Dominicana',
  'Cuba', 'Puerto Rico', 'España', 'Estados Unidos', 'Canadá', 'Otro',
]

interface Membership {
  id: string
  plan: string
  status: string
  started_at: string
  expires_at: string | null
  max_establishments: number
  max_advisors: number
  paypal_subscription_id?: string | null
  subscribed_amount?: number | null
}

interface ModuleSub {
  id: string
  module_key: string
  status: string
  trial_expires_at?: string | null
  price_monthly?: number | null
}

interface AvailableModule {
  module_key: string
  label: string
  price_monthly: number
  price_per_user: boolean
  price_per_user_amount: number
}

interface Props {
  brand: Brand
  membership: Membership | null
  moduleSubscriptions: ModuleSub[]
  availableModules?: AvailableModule[]
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratis',
  standard: 'Estándar',
  basic: 'Básico',
  professional: 'Profesional',
  enterprise: 'Empresarial',
  enterprise_plus: 'Empresarial Plus',
}

const MODULE_LABELS: Record<string, string> = {
  menu: 'Menú / Preorden',
  precheckin: 'Pre check-in',
  precheckout: 'Check-out',
  minibar: 'Minibar',
  appointments: 'Citas programadas',
  surveys: 'Encuestas',
  display: 'Pantalla TV',
}

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

function nextBillingDate(membership: Membership | null): Date {
  const base = membership?.started_at ? new Date(membership.started_at) : new Date()
  const next = new Date(base)
  const today = new Date()
  while (next <= today) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

export function BrandSettings({ brand: initialBrand, membership, moduleSubscriptions: initialModuleSubs, availableModules = [] }: Props) {
  const [tab, setTab] = useState<'profile' | 'membership' | 'integrations'>('profile')
  const [brand, setBrand] = useState(initialBrand)
  const [form, setForm] = useState({
    name: initialBrand.name,
    logo_url: initialBrand.logo_url || '',
    primary_color: initialBrand.primary_color || '#6366f1',
    address: initialBrand.address || '',
    contact_email: initialBrand.contact_email || '',
    website: initialBrand.website || '',
    language: initialBrand.language || 'es',
    country: initialBrand.country || 'Colombia',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null)
  const [moduleSubs, setModuleSubs] = useState<ModuleSub[]>(initialModuleSubs)
  const [cancellingModule, setCancellingModule] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null)
  const [payingModule, setPayingModule] = useState<string | null>(null)
  const isColombiaAccount = (brand.country ?? 'Colombia') === 'Colombia'
  const [paypalSubLoading, setPaypalSubLoading] = useState(false)
  const [paypalSubError, setPaypalSubError] = useState('')
  const [membershipSub, setMembershipSub] = useState<{
    paypal_subscription_id?: string | null
    subscribed_amount?: number | null
  }>({
    paypal_subscription_id: membership?.paypal_subscription_id,
    subscribed_amount: membership?.subscribed_amount,
  })

  // Detect PayPal return after subscription approval
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const subId = params.get('subscription_id')
    const ok = params.get('paypal_ok')
    const amountParam = params.get('amount')
    if (!ok || !subId || !amountParam) return
    const amount = parseFloat(amountParam)
    fetch('/api/paypal/activate-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: subId, amount }),
    }).then(() => {
      setMembershipSub({ paypal_subscription_id: subId, subscribed_amount: amount })
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('paypal_ok')
      url.searchParams.delete('subscription_id')
      url.searchParams.delete('ba_token')
      url.searchParams.delete('amount')
      window.history.replaceState({}, '', url.toString())
    }).catch(console.error)
  }, [])

  // ── Integrations state ───────────────────────────────────────────────────
  type ApiKey = { id: string; name: string; key_prefix: string; active: boolean; created_at: string; last_used_at: string | null }
  const WEBHOOK_EVENTS = ['ticket.created', 'ticket.attended', 'ticket.done', 'ticket.cancelled'] as const
  const WEBHOOK_LABELS: Record<string, string> = {
    'ticket.created': 'Ticket creado',
    'ticket.attended': 'Ticket atendido (en atención)',
    'ticket.done': 'Ticket completado',
    'ticket.cancelled': 'Ticket cancelado',
  }
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Record<string, { id: string | null; url: string; active: boolean }>>({})
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [keyCreating, setKeyCreating] = useState(false)
  const [webhooksSaving, setWebhooksSaving] = useState(false)
  const [webhooksSaved, setWebhooksSaved] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)

  const loadIntegrations = useCallback(async () => {
    const [keysRes, hooksRes] = await Promise.all([
      fetch('/api/brand/api-keys').then(r => r.json()),
      fetch('/api/brand/webhooks').then(r => r.json()),
    ])
    setApiKeys(keysRes.data ?? [])
    setWebhooks(hooksRes.data ?? {})
    setIntegrationsLoaded(true)
  }, [])

  useEffect(() => {
    if (tab === 'integrations' && !integrationsLoaded) loadIntegrations()
  }, [tab, integrationsLoaded, loadIntegrations])

  async function createApiKey() {
    if (!newKeyName.trim()) return
    setKeyCreating(true)
    const res = await fetch('/api/brand/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    })
    const json = await res.json()
    setKeyCreating(false)
    if (res.ok) {
      setApiKeys(prev => [json.data, ...prev])
      setCreatedKey(json.data.full_key)
      setNewKeyName('')
    }
  }

  async function deleteApiKey(id: string) {
    await fetch(`/api/brand/api-keys/${id}`, { method: 'DELETE' })
    setApiKeys(prev => prev.filter(k => k.id !== id))
  }

  async function saveWebhooks() {
    setWebhooksSaving(true)
    const body = Object.fromEntries(
      WEBHOOK_EVENTS.map(e => [e, webhooks[e]?.url ?? ''])
    )
    await fetch('/api/brand/webhooks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setWebhooksSaving(false)
    setWebhooksSaved(true)
    setTimeout(() => setWebhooksSaved(false), 2000)
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).catch(() => null)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('brands')
      .update({
        name: form.name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        address: form.address || null,
        contact_email: form.contact_email || null,
        website: form.website || null,
        language: form.language,
        country: form.country || null,
      })
      .eq('id', brand.id)
      .select()
      .single()
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    if (data) setBrand(data as Brand)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleCancelModule(subId: string) {
    setCancellingModule(subId)
    const supabase = createClient()
    await supabase.from('module_subscriptions').update({ status: 'cancelled' }).eq('id', subId)
    setModuleSubs(prev => prev.map(s => s.id === subId ? { ...s, status: 'cancelled' } : s))
    setCancellingModule(null)
    setConfirmCancel(null)
  }

  const currentPlan = membership?.plan ?? 'free'
  const currentPlanLabel = PLAN_LABELS[currentPlan] ?? currentPlan
  const maxEst = membership?.max_establishments ?? 1
  const maxAdv = membership?.max_advisors ?? 2
  const basePrice = calcMonthlyBase(maxEst, maxAdv)
  // Only show / count modules that are active or in trial
  const activeModuleSubs = moduleSubs.filter(s => s.status === 'active' || s.status === 'trial')
  const numPaidModules = activeModuleSubs.filter(s => (s.price_monthly ?? 0) > 0).length
  const modulesAddon = calcModuleAddon(maxEst, maxAdv, numPaidModules)
  const nextBilling = nextBillingDate(membership)
  const activeModuleTotal = activeModuleSubs.reduce((sum, sub) => sum + getModulePrice(sub.module_key), 0)
  const currentTotal = basePrice + activeModuleTotal

  function getModulePrice(moduleKey: string): number {
    const mod = availableModules.find(m => m.module_key === moduleKey)
    if (!mod) return 0
    return (mod.price_monthly ?? 0) + (mod.price_per_user ? (mod.price_per_user_amount ?? 0) * maxAdv : 0)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi marca</h1>
        <p className="text-gray-500 text-sm mt-1">Configura los datos de tu marca y revisa tu membresía</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {([['profile', 'Perfil de marca', Building2], ['membership', 'Membresía', CreditCard], ['integrations', 'Integraciones', Key]] as const).map(([t, label, Icon]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Dirección principal" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 123, Ciudad" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">País</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <Input label="Correo de contacto" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="contacto@marca.com" />
            <Input label="Sitio web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://www.marca.com" />
            {/* Language selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Globe size={14} className="text-gray-400" />
                Idioma de la plataforma
              </label>
              <p className="text-xs text-gray-500 mb-2">El idioma seleccionado se aplicará para todos los usuarios de esta marca.</p>
              <div className="flex gap-2 flex-wrap">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, language: lang.code }))}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      form.language === lang.code
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {saveError.includes('policy') || saveError.includes('row-level')
                  ? 'Sin permiso para actualizar. Ejecuta el SQL phase11_fixes.sql en Supabase primero.'
                  : saveError}
              </div>
            )}
            <div className="pt-2">
              <Button onClick={handleSave} loading={saving}>
                {saved ? <><Check size={15} className="mr-1" /> Guardado</> : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === 'membership' && (
        <div>
          {/* Current plan banner */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <CreditCard size={22} className="text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Plan actual</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-bold text-gray-900">{currentPlanLabel}</span>
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
                <p className="font-bold text-gray-900">{maxEst}</p>
                <p className="text-gray-500 text-xs">Sucursales</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{maxAdv}</p>
                <p className="text-gray-500 text-xs">Usuarios</p>
              </div>
              {membership?.expires_at && (
                <div className="text-center">
                  <p className="font-bold text-gray-900">{new Date(membership.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-gray-500 text-xs">Vencimiento</p>
                </div>
              )}
            </div>
          </div>

          {/* Billing & modules row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Próxima factura */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Próxima factura</h3>
                <span className="text-xs text-gray-400">
                  {nextBilling.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{maxEst} sucursal{maxEst !== 1 ? 'es' : ''} × ${PRICING.perEstablishment}/mes</span>
                  <span className="font-medium">${maxEst * PRICING.perEstablishment}</span>
                </div>
                {maxAdv > maxEst && (
                  <div className="flex justify-between text-gray-600">
                    <span>{maxAdv - maxEst} usuario{maxAdv - maxEst !== 1 ? 's' : ''} adicional{maxAdv - maxEst !== 1 ? 'es' : ''} × ${PRICING.perAdditionalAdvisor}/mes</span>
                    <span className="font-medium">${(maxAdv - maxEst) * PRICING.perAdditionalAdvisor}</span>
                  </div>
                )}
                {activeModuleSubs.map(sub => (
                  <div key={sub.id} className="flex justify-between text-gray-600">
                    <span>{MODULE_LABELS[sub.module_key] ?? sub.module_key}</span>
                    <span className="font-medium">{sub.price_monthly ? `$${sub.price_monthly}` : 'Incluido'}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total estimado</span>
                  <span>{basePrice + modulesAddon === 0 ? 'Gratis' : `$${(basePrice + modulesAddon).toFixed(2)}`}</span>
                </div>
              </div>
            </div>

            {/* Medio de pago */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Medio de pago</h3>

              {/* Price breakdown */}
              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>{maxEst} sucursal{maxEst !== 1 ? 'es' : ''} × ${PRICING.perEstablishment}</span>
                  <span>${maxEst * PRICING.perEstablishment}</span>
                </div>
                {maxAdv > maxEst && (
                  <div className="flex justify-between text-gray-600">
                    <span>{maxAdv - maxEst} usuario{maxAdv - maxEst !== 1 ? 's' : ''} adicional{maxAdv - maxEst !== 1 ? 'es' : ''} × ${PRICING.perAdditionalAdvisor}</span>
                    <span>${(maxAdv - maxEst) * PRICING.perAdditionalAdvisor}</span>
                  </div>
                )}
                {activeModuleSubs.map(sub => {
                  const p = getModulePrice(sub.module_key)
                  return p > 0 ? (
                    <div key={sub.id} className="flex justify-between text-gray-600">
                      <span>{MODULE_LABELS[sub.module_key] ?? sub.module_key}</span>
                      <span>${p}</span>
                    </div>
                  ) : null
                })}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total mensual</span>
                  <span>${currentTotal.toFixed(2)}</span>
                </div>
              </div>

              {paypalSubError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {paypalSubError}
                </div>
              )}

              {/* State A: no subscription */}
              {!membershipSub.paypal_subscription_id && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    loading={paypalSubLoading}
                    onClick={async () => {
                      setPaypalSubLoading(true)
                      setPaypalSubError('')
                      try {
                        const returnUrl = `${window.location.origin}/admin/brand?tab=membership&paypal_ok=1&amount=${currentTotal}`
                        const cancelUrl = `${window.location.origin}/admin/brand?tab=membership`
                        const res = await fetch('/api/paypal/create-subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: currentTotal, currency: 'USD', returnUrl, cancelUrl }),
                        })
                        const data = await res.json()
                        if (!res.ok || !data.approvalUrl) throw new Error(data.error ?? 'Error creando suscripción')
                        window.location.href = data.approvalUrl
                      } catch (err: unknown) {
                        setPaypalSubError(err instanceof Error ? err.message : 'Error de PayPal')
                        setPaypalSubLoading(false)
                      }
                    }}
                  >
                    Suscribirse con PayPal — ${currentTotal.toFixed(2)}/mes
                  </Button>
                  {isColombiaAccount && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => window.open('mailto:soporte@turnapp.co?subject=Solicitud%20de%20suscripci%C3%B3n', '_blank')}
                    >
                      Contactar a soporte
                    </Button>
                  )}
                  <p className="text-xs text-gray-400 text-center">No aplican reembolsos.</p>
                </div>
              )}

              {/* State B: active subscription, same amount */}
              {membershipSub.paypal_subscription_id && currentTotal === (membershipSub.subscribed_amount ?? 0) && (
                <div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <Check size={15} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Suscripción activa</p>
                      <p className="text-xs text-green-600 font-mono break-all">{membershipSub.paypal_subscription_id}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">No aplican reembolsos.</p>
                </div>
              )}

              {/* State C: active subscription, amount changed */}
              {membershipSub.paypal_subscription_id && currentTotal !== (membershipSub.subscribed_amount ?? 0) && (
                <div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                    <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">
                      A partir de tu próxima renovación se cobrará{' '}
                      <strong>${currentTotal.toFixed(2)}/mes</strong>{' '}
                      (actualmente suscrito: ${(membershipSub.subscribed_amount ?? 0).toFixed(2)}/mes).{' '}
                      No aplican reembolsos.
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    loading={paypalSubLoading}
                    onClick={async () => {
                      setPaypalSubLoading(true)
                      setPaypalSubError('')
                      try {
                        // Cancel old subscription (PayPal only, no system change)
                        await fetch('/api/paypal/cancel-subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ subscriptionId: membershipSub.paypal_subscription_id }),
                        })
                        // Create new subscription
                        const returnUrl = `${window.location.origin}/admin/brand?tab=membership&paypal_ok=1&amount=${currentTotal}`
                        const cancelUrl = `${window.location.origin}/admin/brand?tab=membership`
                        const res = await fetch('/api/paypal/create-subscription', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: currentTotal, currency: 'USD', returnUrl, cancelUrl }),
                        })
                        const data = await res.json()
                        if (!res.ok || !data.approvalUrl) throw new Error(data.error ?? 'Error creando suscripción')
                        window.location.href = data.approvalUrl
                      } catch (err: unknown) {
                        setPaypalSubError(err instanceof Error ? err.message : 'Error de PayPal')
                        setPaypalSubLoading(false)
                      }
                    }}
                  >
                    Actualizar suscripción
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Module subscriptions — only show active/trial */}
          {activeModuleSubs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Módulos adicionales</h3>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {activeModuleSubs.map(sub => {
                  const price = getModulePrice(sub.module_key)
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{MODULE_LABELS[sub.module_key] ?? sub.module_key.replace(/_/g, ' ')}</span>
                          {price > 0 && (
                            <span className="text-xs text-gray-400 ml-2">${price}/mes</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sub.status === 'trial' && (
                            <button
                              onClick={() => setPayingModule(payingModule === sub.id ? null : sub.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                            >
                              {payingModule === sub.id ? 'Cerrar' : 'Contratar'}
                            </button>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {sub.status === 'trial' && sub.trial_expires_at
                              ? `Trial — vence ${new Date(sub.trial_expires_at).toLocaleDateString('es')}`
                              : STATUS_LABELS[sub.status] ?? sub.status}
                          </span>
                          <button
                            onClick={() => setConfirmCancel(sub.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Cancelar módulo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      {/* PayPal payment panel for trial modules */}
                      {payingModule === sub.id && price > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50">
                          <p className="text-xs text-gray-500 mt-3 mb-2">
                            Pagar <strong>${price}/mes</strong> para activar el módulo. Se renueva mensualmente.
                          </p>
                          <PayPalButton
                            moduleKey={sub.module_key}
                            amount={price}
                            currency="USD"
                            onSuccess={(expiresAt) => {
                              setModuleSubs(prev => prev.map(s =>
                                s.id === sub.id
                                  ? { ...s, status: 'active', price_monthly: price }
                                  : s
                              ))
                              setPayingModule(null)
                            }}
                          />
                          {isColombiaAccount && (
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              Próximamente: Wompi, PSE, Nequi y más opciones para Colombia.
                            </p>
                          )}
                        </div>
                      )}
                      {payingModule === sub.id && price === 0 && (
                        <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50">
                          <p className="text-xs text-gray-500 mt-3">Este módulo es gratuito — no requiere pago.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pricing reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <CreditCard size={15} className="text-indigo-500" /> Modelo de precios
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-2xl font-black text-indigo-700">${PRICING.perEstablishment}<span className="text-sm font-normal text-indigo-400">/sucursal/mes</span></p>
                <p className="text-xs text-indigo-600 mt-1">Incluye 1 usuario por sucursal</p>
                <ul className="mt-3 space-y-1">
                  {['Cola de espera', 'Pantalla TV', 'Formulario de clientes', 'Promociones', 'Campos de asesor', 'Autorizaciones'].map(f => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-indigo-700">
                      <CheckCircle size={11} className="text-indigo-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xl font-black text-gray-800">+${PRICING.perAdditionalAdvisor}<span className="text-sm font-normal text-gray-400">/usuario adicional/mes</span></p>
                  <p className="text-xs text-gray-500 mt-1">A partir del 2.º usuario por sucursal</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Módulos adicionales</p>
                  <p className="text-xs text-gray-500">Cada módulo tiene su propio precio mensual — visible en el Marketplace.</p>
                  <p className="text-xs text-gray-400 mt-1">Todos incluyen 7 días de prueba gratuita.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
              ¿Necesitas más sucursales o usuarios? Contacta a soporte para ajustar tu plan.
            </p>
          </div>
        </div>
      )}

      {/* ── Integrations tab ── */}
      {tab === 'integrations' && (
        <div>
          {/* API Keys */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Key size={16} />API Keys</h2>
                <p className="text-xs text-gray-500 mt-0.5">Autenticate con <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key: &lt;tu-clave&gt;</code> en todas las solicitudes a <code className="bg-gray-100 px-1 rounded text-xs">/api/v1/*</code></p>
              </div>
            </div>

            {/* Create new key */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-end gap-3">
              <div className="flex-1">
                <Input label="Nombre de la clave" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="ej. Zapier producción" />
              </div>
              <Button loading={keyCreating} onClick={createApiKey} disabled={!newKeyName.trim()}>
                <Plus size={14} className="mr-1" /> Generar clave
              </Button>
            </div>

            {/* Reveal modal */}
            {createdKey && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ Clave generada — cópiala ahora, no se volverá a mostrar</p>
                <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-gray-900 break-all">{createdKey}</code>
                  <button onClick={() => copyKey(createdKey)} className="shrink-0 p-1.5 rounded-lg hover:bg-green-100 text-green-700" title="Copiar">
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <button onClick={() => setCreatedKey(null)} className="text-xs text-green-700 mt-2 underline">
                  Ya la copié, cerrar
                </button>
              </div>
            )}

            {/* Keys list */}
            {!integrationsLoaded ? (
              <p className="text-sm text-gray-400 py-4 text-center">Cargando...</p>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center bg-white border border-gray-200 rounded-xl">No hay claves API generadas todavía</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-3">
                    <Key size={14} className={k.active ? 'text-indigo-500' : 'text-gray-300'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{k.name}</p>
                      <p className="text-xs font-mono text-gray-400">{k.key_prefix}••••••••••••••••••••••</p>
                    </div>
                    <div className="text-xs text-gray-400 text-right">
                      <p>Creada {new Date(k.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                      {k.last_used_at && <p>Usada {new Date(k.last_used_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {k.active ? 'Activa' : 'Inactiva'}
                    </span>
                    <button onClick={() => deleteApiKey(k.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50" title="Revocar clave">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhooks */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Webhook size={16} />Webhooks salientes</h2>
              <p className="text-xs text-gray-500 mt-0.5">TurnApp enviará un POST JSON a estas URLs cuando ocurra cada evento. Deja vacío para deshabilitar.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {WEBHOOK_EVENTS.map(event => (
                <div key={event} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium text-gray-900">{WEBHOOK_LABELS[event]}</p>
                    <code className="text-xs text-gray-400">{event}</code>
                  </div>
                  <input
                    type="url"
                    value={webhooks[event]?.url ?? ''}
                    onChange={e => setWebhooks(prev => ({ ...prev, [event]: { ...prev[event], url: e.target.value, id: prev[event]?.id ?? null, active: true } }))}
                    placeholder="https://hooks.zapier.com/..."
                    className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {webhooks[event]?.url && (
                    <div className={`w-2 h-2 rounded-full shrink-0 ${webhooks[event]?.active ? 'bg-green-400' : 'bg-gray-300'}`} title={webhooks[event]?.active ? 'Activo' : 'Inactivo'} />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <Button loading={webhooksSaving} onClick={saveWebhooks}>
                {webhooksSaved ? <><Check size={14} className="mr-1" />Guardado</> : 'Guardar webhooks'}
              </Button>
              <p className="text-xs text-gray-400">Los cambios aplican inmediatamente</p>
            </div>
          </div>

          {/* API Reference */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Referencia rápida de endpoints</h3>
            <div className="space-y-2 font-mono text-xs text-gray-600">
              {[
                ['GET', '/api/v1/establishments', 'Listar sucursales'],
                ['GET', '/api/v1/tickets?status=waiting', 'Tickets activos'],
                ['POST', '/api/v1/tickets', 'Crear ticket'],
                ['GET', '/api/v1/tickets/:id', 'Estado de un ticket'],
                ['GET', '/api/v1/stats/today', 'Resumen del día'],
              ].map(([method, path, desc]) => (
                <div key={path} className="flex items-center gap-3">
                  <span className={`w-12 text-center font-bold shrink-0 ${method === 'GET' ? 'text-blue-600' : 'text-green-600'}`}>{method}</span>
                  <code className="flex-1 bg-white border border-gray-200 rounded px-2 py-1">{path}</code>
                  <span className="text-gray-400 text-xs">{desc}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Base URL: <code className="bg-white border border-gray-200 rounded px-1">{typeof window !== 'undefined' ? window.location.origin : 'https://turnos-app-rose.vercel.app'}</code></p>
          </div>
        </div>
      )}

      {/* Confirm cancel module modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">¿Cancelar módulo?</h2>
            <p className="text-sm text-gray-500 mb-5">
              El módulo se desactivará al final del período de facturación. No se realizarán más cobros.
            </p>
            <Button
              className="w-full mb-2"
              variant="danger"
              loading={cancellingModule === confirmCancel}
              onClick={() => handleCancelModule(confirmCancel)}
            >
              Confirmar cancelación
            </Button>
            <button onClick={() => setConfirmCancel(null)} className="text-sm text-gray-400 hover:text-gray-600 w-full py-2">
              Mantener activo
            </button>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      {upgradeModal && upgradeModal !== 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Ampliar plan</h2>
            <p className="text-sm text-gray-500 mb-5">
              Contáctanos para ajustar tu plan (más sucursales, usuarios o módulos). Lo activamos en minutos:
            </p>
            <a
              href={`mailto:soporte@turnapp.co?subject=Quiero ampliar mi plan TurnApp&body=Hola, soy administrador de la marca "${initialBrand.name}" y quiero ampliar mi plan.`}
              className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3"
            >
              Contactar soporte →
            </a>
            <a
              href={`https://wa.me/573001234567?text=Hola%2C+quiero+ampliar+mi+plan+TurnApp+para+la+marca+${encodeURIComponent(initialBrand.name)}`}
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
      )}

      {/* Payment method modal */}
      {upgradeModal === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Configurar pago</h2>
            <p className="text-sm text-gray-500 mb-5">
              Estamos integrando el proceso de pago en línea. Por ahora, contáctanos para coordinar el método de pago:
            </p>
            <a
              href={`mailto:soporte@turnapp.co?subject=Configurar pago TurnApp&body=Hola, soy administrador de la marca "${initialBrand.name}" y quiero configurar un método de pago.`}
              className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3"
            >
              Contactar soporte →
            </a>
            <button onClick={() => setUpgradeModal(null)} className="text-sm text-gray-400 hover:text-gray-600">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
