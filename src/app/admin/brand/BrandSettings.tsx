'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Building2, CreditCard, Check, CheckCircle,
  X, AlertTriangle, Key, Webhook, Copy, Trash2, Plus,
  Globe, Lock, RefreshCw,
} from 'lucide-react'
import { useEffect, useCallback } from 'react'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/translations'
import {
  PRICING_COP, calcMonthlyTotalBilling, toCents, fromCents, formatCurrency,
  type BillingCurrency,
} from '@/lib/billing-cop'
import { WompiCardForm } from '@/components/WompiCardForm'

interface Brand {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string | null
  secondary_color: string | null
  font_color: string | null
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
  // Wompi billing
  wompi_payment_source_id?: string | null
  wompi_customer_email?: string | null
  billing_currency?: BillingCurrency | null
  billing_anchor_day?: number | null
  billing_status?: 'none' | 'active' | 'past_due' | 'suspended' | null
  next_billing_at?: string | null
  last_billed_at?: string | null
  last_billing_amount?: number | null   // centavos
  past_due_since?: string | null
  past_due_attempts?: number | null
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
  currentEstablishments?: number
  currentAdvisors?: number
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
  trial: 'En prueba',
  expired: 'Prueba finalizada',
  cancelled: 'Cancelada',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const BILLING_STATUS_LABELS: Record<string, string> = {
  active:    'Suscripción activa',
  past_due:  'Pago pendiente',
  suspended: 'Cuenta suspendida',
  none:      'Sin método de pago',
}
const BILLING_STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  past_due:  'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  none:      'bg-gray-100 text-gray-500',
}

export function BrandSettings({ brand: initialBrand, membership, moduleSubscriptions: initialModuleSubs, availableModules = [], currentEstablishments = 1, currentAdvisors = 0 }: Props) {
  const [tab, setTab] = useState<'profile' | 'membership' | 'integrations'>('profile')
  const [brand, setBrand] = useState(initialBrand)
  const [form, setForm] = useState({
    name: initialBrand.name,
    logo_url: initialBrand.logo_url || '',
    primary_color: initialBrand.primary_color || '#6366f1',
    secondary_color: initialBrand.secondary_color || '#7c3aed',
    font_color: initialBrand.font_color || '#ffffff',
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

  // ── Wompi billing local state ─────────────────────────────────────────────
  const [showCardForm, setShowCardForm] = useState(false)
  const [localBillingStatus, setLocalBillingStatus] = useState(membership?.billing_status ?? null)
  const [localHasCard, setLocalHasCard] = useState(!!membership?.wompi_payment_source_id)
  const [localNextBillingAt, setLocalNextBillingAt] = useState(membership?.next_billing_at ?? null)
  const [localLastBillingAmount, setLocalLastBillingAmount] = useState(membership?.last_billing_amount ?? null)

  // Read ?tab= URL param to open the correct tab on load (e.g. links from limit banners)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    if (tabParam === 'membership' || tabParam === 'integrations' || tabParam === 'profile') {
      setTab(tabParam)
    }
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
        secondary_color: form.secondary_color,
        font_color: form.font_color,
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
  // Free plan is capped at fixed limits regardless of what's in the membership record
  const FREE_EST_LIMIT = 1
  const FREE_ADV_LIMIT = 2
  const maxEst = currentPlan === 'free' ? FREE_EST_LIMIT : (membership?.max_establishments ?? 1)
  const maxAdv = currentPlan === 'free' ? FREE_ADV_LIMIT : (membership?.max_advisors ?? 2)
  // For billing calculations: only active/trial modules count
  const activeModuleSubs = moduleSubs.filter(s => s.status === 'active' || s.status === 'trial')
  // For display in membership tab: also show expired/cancelled so user sees what they had
  const allModuleSubs = moduleSubs.filter(s => ['active', 'trial', 'expired', 'cancelled'].includes(s.status))
  const numPaidModules = activeModuleSubs.filter(s => (s.price_monthly ?? 0) > 0).length
  // COP billing — uses billing-cop.ts pricing
  const currency: BillingCurrency = (membership?.billing_currency as BillingCurrency) ?? 'COP'
  const currentTotal = calcMonthlyTotalBilling(maxEst, maxAdv, numPaidModules, currency)
  const currentTotalCents = toCents(currentTotal)
  // Free plan: genuinely free when within the fixed free-tier limits (1 est, 2 advisors, no paid modules)
  const isFreeWithinLimits = currentPlan === 'free' && maxEst <= 1 && maxAdv <= 2 && numPaidModules === 0

  const pricing = currency === 'COP' ? PRICING_COP : { perEstablishment: 15, perAdditionalAdvisor: 5, moduleFlat: 20 }

  function getModulePrice(moduleKey: string): number {
    const mod = availableModules.find(m => m.module_key === moduleKey)
    if (!mod) return 0
    return mod.price_monthly ?? 0
  }

  function handleCardSuccess(nextBillingAt: string) {
    setLocalHasCard(true)
    setLocalBillingStatus('active')
    setLocalNextBillingAt(nextBillingAt)
    setLocalLastBillingAmount(currentTotalCents)
    setShowCardForm(false)
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
            {/* ── Colores de marca ── */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">Colores de la marca</p>
              <p className="text-xs text-gray-400 -mt-2">Se usan en formularios públicos, pantalla TV y páginas de turno.</p>
              {/* Color helper */}
              {([
                { key: 'primary_color', label: 'Color principal', hint: 'Botones, encabezados y elementos de acción', placeholder: '#6366f1' },
                { key: 'secondary_color', label: 'Color secundario', hint: 'Fondos de página y pantalla TV', placeholder: '#7c3aed' },
                { key: 'font_color', label: 'Color de fuente', hint: 'Texto sobre fondos de color de la marca', placeholder: '#ffffff' },
              ] as const).map(({ key, label, hint, placeholder }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  {hint && <p className="text-xs text-gray-400">{hint}</p>}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
                    />
                    <input
                      type="text"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      onBlur={e => {
                        let val = e.target.value.trim()
                        if (val && !val.startsWith('#')) val = '#' + val
                        if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
                          setForm(f => ({ ...f, [key]: val.toLowerCase() }))
                        } else {
                          setForm(f => ({ ...f, [key]: form[key] }))
                        }
                      }}
                      maxLength={7}
                      placeholder={placeholder}
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="w-9 h-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: form[key] }} />
                  </div>
                </div>
              ))}
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
          <div className={`grid grid-cols-1 ${!isFreeWithinLimits ? 'md:grid-cols-2' : ''} gap-4 mb-8`}>
            {/* Próxima factura — oculta en plan gratuito */}
            {!isFreeWithinLimits && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Próxima factura</h3>
                  {localNextBillingAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(localNextBillingAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{maxEst} sucursal{maxEst !== 1 ? 'es' : ''} × {formatCurrency(pricing.perEstablishment, currency)}/mes</span>
                    <span className="font-medium">{formatCurrency(maxEst * pricing.perEstablishment, currency)}</span>
                  </div>
                  {maxAdv > maxEst && (
                    <div className="flex justify-between text-gray-600">
                      <span>{maxAdv - maxEst} usuario{maxAdv - maxEst !== 1 ? 's' : ''} adicional{maxAdv - maxEst !== 1 ? 'es' : ''} × {formatCurrency(pricing.perAdditionalAdvisor, currency)}/mes</span>
                      <span className="font-medium">{formatCurrency((maxAdv - maxEst) * pricing.perAdditionalAdvisor, currency)}</span>
                    </div>
                  )}
                  {activeModuleSubs.filter(s => (s.price_monthly ?? 0) > 0).map(sub => (
                    <div key={sub.id} className="flex justify-between text-gray-600">
                      <span>{MODULE_LABELS[sub.module_key] ?? sub.module_key}</span>
                      <span className="font-medium">{formatCurrency(pricing.moduleFlat, currency)}/mes</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                    <span>Total mensual</span>
                    <span>{currentTotal === 0 ? 'Gratis' : `${formatCurrency(currentTotal, currency)}`}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">Precios incluyen IVA. Se cobra el día {membership?.billing_anchor_day ?? '—'} de cada mes.</p>
              </div>
            )}

            {/* Medio de pago */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Medio de pago</h3>

              {/* Free plan */}
              {isFreeWithinLimits && (
                <div className="text-sm text-gray-500 bg-green-50 border border-green-200 rounded-lg px-3 py-3 text-center">
                  <p className="font-medium text-green-700">Plan gratuito</p>
                  <p className="text-xs mt-1">Sin costo mientras estés dentro de los límites incluidos</p>
                </div>
              )}

              {/* Suspended */}
              {!isFreeWithinLimits && localBillingStatus === 'suspended' && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-3">
                    <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Cuenta suspendida</p>
                      <p className="text-xs text-red-600 mt-0.5">El acceso está restringido por falta de pago. Actualiza tu tarjeta para reactivar.</p>
                    </div>
                  </div>
                  <WompiCardForm
                    amountCents={currentTotalCents}
                    currency={currency}
                    onSuccess={handleCardSuccess}
                  />
                </div>
              )}

              {/* Past due */}
              {!isFreeWithinLimits && localBillingStatus === 'past_due' && !showCardForm && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3">
                    <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Pago pendiente</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Llevamos {membership?.past_due_attempts ?? 0} intento{(membership?.past_due_attempts ?? 0) !== 1 ? 's' : ''} fallido{(membership?.past_due_attempts ?? 0) !== 1 ? 's' : ''}.
                        {membership?.past_due_since && ` En mora desde ${new Date(membership.past_due_since).toLocaleDateString('es')}.`}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setShowCardForm(true)}>
                    <RefreshCw size={14} className="mr-2" /> Actualizar tarjeta
                  </Button>
                </div>
              )}

              {/* Past due — show card form */}
              {!isFreeWithinLimits && localBillingStatus === 'past_due' && showCardForm && (
                <div className="space-y-3">
                  <WompiCardForm
                    amountCents={currentTotalCents}
                    currency={currency}
                    onSuccess={handleCardSuccess}
                    onCancel={() => setShowCardForm(false)}
                  />
                </div>
              )}

              {/* Active — card saved */}
              {!isFreeWithinLimits && localBillingStatus === 'active' && !showCardForm && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-3">
                    <Check size={15} className="text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800">Suscripción activa</p>
                      {membership?.wompi_customer_email && (
                        <p className="text-xs text-green-600 truncate">Tarjeta registrada en {membership.wompi_customer_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center text-sm">
                    {localNextBillingAt && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400">Próximo cobro</p>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {new Date(localNextBillingAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-xs text-indigo-600 font-medium">{formatCurrency(currentTotal, currency)}</p>
                      </div>
                    )}
                    {localLastBillingAmount != null && localLastBillingAmount > 0 && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400">Último cobro</p>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {membership?.last_billed_at
                            ? new Date(membership.last_billed_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })
                            : '—'}
                        </p>
                        <p className="text-xs text-gray-500">{formatCurrency(fromCents(localLastBillingAmount), currency)}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowCardForm(true)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 text-center py-1 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Actualizar tarjeta
                  </button>
                </div>
              )}

              {/* Active — update card form */}
              {!isFreeWithinLimits && localBillingStatus === 'active' && showCardForm && (
                <WompiCardForm
                  amountCents={currentTotalCents}
                  currency={currency}
                  onSuccess={handleCardSuccess}
                  onCancel={() => setShowCardForm(false)}
                />
              )}

              {/* No card yet (billing_status is null/none) */}
              {!isFreeWithinLimits && !localHasCard && localBillingStatus !== 'active' && localBillingStatus !== 'past_due' && localBillingStatus !== 'suspended' && (
                <WompiCardForm
                  amountCents={currentTotalCents}
                  currency={currency}
                  onSuccess={handleCardSuccess}
                />
              )}
            </div>
          </div>

          {/* Module subscriptions — active, trial, expired, cancelled */}
          {allModuleSubs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Módulos adicionales</h3>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {allModuleSubs.map(sub => {
                  const price = getModulePrice(sub.module_key)
                  const isExpiredOrCancelled = sub.status === 'expired' || sub.status === 'cancelled'
                  return (
                    <div key={sub.id}>
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm font-medium ${isExpiredOrCancelled ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {MODULE_LABELS[sub.module_key] ?? sub.module_key.replace(/_/g, ' ')}
                          </span>
                          {price > 0 && !isExpiredOrCancelled && (
                            <span className="text-xs text-gray-400">${price}/mes</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Contratar (trial activo) */}
                          {sub.status === 'trial' && (
                            <button
                              onClick={() => setPayingModule(payingModule === sub.id ? null : sub.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                            >
                              {payingModule === sub.id ? 'Cerrar' : 'Contratar'}
                            </button>
                          )}
                          {/* Comprar para seguir usando (vencido) */}
                          {sub.status === 'expired' && (
                            <button
                              onClick={() => setPayingModule(payingModule === sub.id ? null : sub.id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                              {payingModule === sub.id ? 'Cerrar' : 'Comprar para seguir usando'}
                            </button>
                          )}
                          {/* Badge de estado */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.status === 'active'    ? 'bg-green-100 text-green-700' :
                            sub.status === 'trial'     ? 'bg-amber-100 text-amber-700' :
                            sub.status === 'expired'   ? 'bg-red-100 text-red-700'     :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {sub.status === 'trial' && sub.trial_expires_at
                              ? `Prueba — vence ${new Date(sub.trial_expires_at).toLocaleDateString('es')}`
                              : STATUS_LABELS[sub.status] ?? sub.status}
                          </span>
                          {/* Cancelar solo si está activo/trial */}
                          {!isExpiredOrCancelled && (
                            <button
                              onClick={() => setConfirmCancel(sub.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                              title="Cancelar módulo"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Activar módulo — se incluye en el cobro mensual de Wompi */}
                      {payingModule === sub.id && price > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50">
                          <p className="text-xs text-gray-500 mt-3 mb-3">
                            Al activar este módulo, se sumará <strong>{formatCurrency(pricing.moduleFlat, currency)}/mes</strong> a tu factura mensual automática.
                          </p>
                          <a
                            href={`mailto:soporte@turnflow.co?subject=Activar módulo ${MODULE_LABELS[sub.module_key] ?? sub.module_key}&body=Hola, soy administrador de la marca "${initialBrand.name}" y quiero activar el módulo ${MODULE_LABELS[sub.module_key] ?? sub.module_key}.`}
                            className="block w-full py-2 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors text-center"
                          >
                            Solicitar activación →
                          </a>
                          <p className="text-[10px] text-gray-400 mt-2 text-center">El equipo de soporte lo activa en minutos.</p>
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
                <p className="text-2xl font-black text-indigo-700">
                  {formatCurrency(PRICING_COP.perEstablishment, 'COP')}
                  <span className="text-sm font-normal text-indigo-400">/sucursal/mes</span>
                </p>
                <p className="text-xs text-indigo-600 mt-1">Incluye hasta {PRICING_COP.freeAdvisors} usuarios — IVA incluido</p>
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
                  <p className="text-xl font-black text-gray-800">
                    +{formatCurrency(PRICING_COP.perAdditionalAdvisor, 'COP')}
                    <span className="text-sm font-normal text-gray-400">/usuario adicional/mes</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">A partir del {PRICING_COP.freeAdvisors + 1}.º usuario por sucursal</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    +{formatCurrency(PRICING_COP.moduleFlat, 'COP')}<span className="text-xs font-normal text-gray-400">/módulo adicional/mes</span>
                  </p>
                  <p className="text-xs text-gray-500">Módulos opcionales como Citas, Encuestas y más — disponibles en el Marketplace.</p>
                  <p className="text-xs text-gray-400 mt-1">Todos incluyen 7 días de prueba gratuita.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400">
              <Lock size={10} /> Cobros automáticos procesados por Wompi · Visa · Mastercard
            </div>
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
              <p className="text-xs text-gray-500 mt-0.5">TurnFlow enviará un POST JSON a estas URLs cuando ocurra cada evento. Deja vacío para deshabilitar.</p>
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
      {upgradeModal && (
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
              href={`mailto:soporte@turnflow.co?subject=Quiero ampliar mi plan TurnFlow&body=Hola, soy administrador de la marca "${initialBrand.name}" y quiero ampliar mi plan.`}
              className="block w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors mb-3"
            >
              Contactar soporte →
            </a>
            <a
              href={`https://wa.me/573001234567?text=Hola%2C+quiero+ampliar+mi+plan+TurnFlow+para+la+marca+${encodeURIComponent(initialBrand.name)}`}
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
    </div>
  )
}
