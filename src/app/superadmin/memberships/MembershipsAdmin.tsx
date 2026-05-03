'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency, fromCents } from '@/lib/billing-cop'
import { PLANS, PLAN_ORDER, normalizePlan, fmtCOP } from '@/lib/planLimits'
import {
  CreditCard, CheckCircle, AlertCircle,
  Edit2, Plus, Building2, Users, X, BadgeDollarSign, TrendingUp,
} from 'lucide-react'

interface Membership {
  id: string
  brand_id: string
  plan: string
  status: string
  started_at: string
  expires_at: string | null
  max_establishments: number
  max_advisors: number
  // Wompi billing
  billing_status?: string | null
  next_billing_at?: string | null
  last_billing_amount?: number | null
  wompi_payment_source_id?: string | null
  billing_currency?: string | null
  brands: { name: string; slug: string } | null
}

interface Brand { id: string; name: string; slug: string }

const STATUS_OPTS = [
  { value: 'active', label: 'Activa' },
  { value: 'trial', label: 'Prueba' },
  { value: 'expired', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' },
]

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  trial: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const BILLING_STATUS_COLOR: Record<string, string> = {
  active:    'bg-green-100 text-green-700',
  past_due:  'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  none:      'bg-gray-100 text-gray-500',
}

const BILLING_STATUS_LABEL: Record<string, string> = {
  active:    'Cobro activo',
  past_due:  'Pago pendiente',
  suspended: 'Suspendida',
  none:      'Sin tarjeta',
}

// ─── Modal de edición ─────────────────────────────────────────────────────────
function EditModal({
  membership, brands, onClose, onSaved,
}: {
  membership: Membership | null
  brands: Brand[]
  onClose: () => void
  onSaved: (m: Membership) => void
}) {
  const defaultBrandId = membership?.brand_id ?? brands[0]?.id ?? ''
  const initPlan = normalizePlan(membership?.plan)
  const [form, setForm] = useState({
    brand_id: defaultBrandId,
    plan: initPlan,
    status: membership?.status ?? 'active',
    started_at: membership?.started_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    expires_at: membership?.expires_at?.slice(0, 10) ?? '',
    max_establishments: membership?.max_establishments ?? PLANS[initPlan].maxEstablishments,
    max_advisors: membership?.max_advisors ?? PLANS[initPlan].maxUsers,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const planDef = PLANS[form.plan as keyof typeof PLANS] ?? PLANS.free
  const extraUsers = Math.max(0, form.max_advisors - planDef.maxUsers)
  const totalMonthly = planDef.price + extraUsers * 9_900

  async function handleSave() {
    setSaving(true); setError('')
    const supabase = createClient()
    const payload = {
      brand_id: form.brand_id,
      plan: form.plan,
      status: form.status,
      started_at: form.started_at,
      expires_at: form.expires_at || null,
      max_establishments: Number(form.max_establishments),
      max_advisors: Number(form.max_advisors),
    }
    let result: any
    if (membership) {
      const { data, error: err } = await supabase
        .from('memberships').update(payload).eq('id', membership.id)
        .select('*, brands(name, slug)').single()
      if (err) { setError(err.message); setSaving(false); return }
      result = data
    } else {
      const { data, error: err } = await supabase
        .from('memberships').insert(payload)
        .select('*, brands(name, slug)').single()
      if (err) { setError(err.message); setSaving(false); return }
      result = data
    }
    setSaving(false)
    onSaved(result)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{membership ? 'Editar membresía' : 'Nueva membresía'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {!membership && (
            <div className="col-span-2">
              <Select label="Marca *" value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          )}
          {/* Plan selector */}
          <div className="col-span-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Plan</p>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_ORDER.map(key => {
                const p = PLANS[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      plan: key,
                      max_establishments: p.maxEstablishments,
                      max_advisors: p.maxUsers,
                    }))}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-colors ${form.plan === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-xs font-bold text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.price === 0 ? 'Gratis' : `${fmtCOP(p.price)}/mes`}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <Select label="Estado *" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Input label="Inicio" type="date" value={form.started_at} onChange={e => setForm(f => ({ ...f, started_at: e.target.value }))} />
          <div className="col-span-2">
            <Input label="Vencimiento (opcional)" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          </div>
        </div>

        {/* Overrides */}
        <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Límites (override superadmin)</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-sm text-gray-700">Sucursales máx</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">plan incluye {planDef.maxEstablishments}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, max_establishments: Math.max(1, f.max_establishments - 1) }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">−</button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{form.max_establishments}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, max_establishments: f.max_establishments + 1 }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <span className="text-sm text-gray-700">Usuarios máx</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">plan incluye {planDef.maxUsers}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, max_advisors: Math.max(1, f.max_advisors - 1) }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">−</button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{form.max_advisors}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, max_advisors: f.max_advisors + 1 }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total mensual estimado</span>
              <span className="text-lg font-bold text-indigo-700">{totalMonthly === 0 ? 'Gratis' : `${fmtCOP(totalMonthly)}/mes`}</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex gap-3 mt-5">
          <Button loading={saving} onClick={handleSave}>Guardar</Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de pago manual ─────────────────────────────────────────────────────
function PaymentModal({
  membership,
  onClose,
  onSaved,
}: {
  membership: Membership
  onClose: () => void
  onSaved: (m: Membership) => void
}) {
  const initPlan = normalizePlan(membership.plan)
  const [form, setForm] = useState({
    plan: initPlan,
    max_establishments: membership.max_establishments,
    max_advisors: membership.max_advisors,
    payment_method: 'Wompi',
    payment_date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const planDef = PLANS[form.plan as keyof typeof PLANS] ?? PLANS.free
  const extraUsers = Math.max(0, form.max_advisors - planDef.maxUsers)
  const totalMonthly = planDef.price + extraUsers * 9_900

  async function handleSave() {
    setSaving(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('memberships')
      .update({
        status: 'active',
        plan: form.plan,
        max_establishments: form.max_establishments,
        max_advisors: form.max_advisors,
      })
      .eq('id', membership.id)
      .select('*, brands(name, slug)')
      .single()
    if (err) { setError(err.message); setSaving(false); return }
    onSaved(data as Membership)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BadgeDollarSign size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Registrar pago recibido</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-sm">
          <p className="font-medium text-gray-900">{membership.brands?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Estado actual: <span className="font-medium">{membership.status}</span></p>
        </div>

        {/* Payment info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Método</label>
            <select
              value={form.payment_method}
              onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option>Wompi</option>
              <option>Transferencia</option>
              <option>PSE</option>
              <option>Nequi</option>
              <option>Efectivo</option>
              <option>Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de pago</label>
            <input
              type="date"
              value={form.payment_date}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Monto recibido COP (referencia)</label>
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              defaultValue={String(totalMonthly)}
              onChange={e => setForm(f => ({ ...f }))}
              className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Plan selector */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Plan</p>
          <div className="grid grid-cols-3 gap-2">
            {PLAN_ORDER.map(key => {
              const p = PLANS[key]
              return (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, plan: key, max_establishments: p.maxEstablishments, max_advisors: p.maxUsers }))}
                  className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-colors ${form.plan === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <span className="text-xs font-bold text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.price === 0 ? 'Gratis' : `${fmtCOP(p.price)}/mes`}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Capacity config */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Capacidad a activar</p>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Sucursales</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, max_establishments: Math.max(1, f.max_establishments - 1) }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">−</button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{form.max_establishments}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, max_establishments: f.max_establishments + 1 }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Usuarios totales</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, max_advisors: Math.max(f.max_establishments, f.max_advisors - 1) }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">−</button>
                <span className="w-8 text-center text-sm font-bold text-gray-900">{form.max_advisors}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, max_advisors: f.max_advisors + 1 }))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold">+</button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Total mensual estimado</span>
              <span className="text-sm font-bold text-indigo-700">{totalMonthly === 0 ? 'Gratis' : `${fmtCOP(totalMonthly)}/mes`}</span>
            </div>
            {extraUsers > 0 && (
              <p className="text-xs text-gray-400">
                {planDef.maxUsers} incluidos + {extraUsers} adicional{extraUsers !== 1 ? 'es' : ''} × {fmtCOP(9_900)}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <Button loading={saving} onClick={handleSave} className="flex-1">
            <CheckCircle size={15} className="mr-1" /> Confirmar y activar
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function MembershipsAdmin({ memberships: initial, brands }: {
  memberships: Membership[]
  brands: Brand[]
}) {
  const [memberships, setMemberships] = useState(initial)
  const [editTarget, setEditTarget] = useState<Membership | 'new' | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Membership | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBilling, setFilterBilling] = useState('')

  function onSaved(m: Membership) {
    setMemberships(prev => {
      const idx = prev.findIndex(x => x.id === m.id)
      return idx >= 0 ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]
    })
    setEditTarget(null)
  }

  const active = memberships.filter(m => m.status === 'active')
  const withCard = memberships.filter(m => m.wompi_payment_source_id)
  const pastDue = memberships.filter(m => m.billing_status === 'past_due')
  const suspended = memberships.filter(m => m.billing_status === 'suspended')

  // MRR en COP — membresías activas
  const mrr = memberships
    .filter(m => m.status === 'active')
    .reduce((sum, m) => {
      const p = PLANS[normalizePlan(m.plan)]
      const extra = Math.max(0, m.max_advisors - p.maxUsers)
      return sum + p.price + extra * 9_900
    }, 0)

  const filtered = memberships.filter(m =>
    (!filterStatus || m.status === filterStatus) &&
    (!filterBilling || m.billing_status === filterBilling)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Membresías</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de capacidad y cobros por marca</p>
        </div>
        <Button onClick={() => setEditTarget('new')}><Plus size={16} className="mr-1" /> Nueva membresía</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Activas', value: active.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Con tarjeta Wompi', value: withCard.length, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'MRR estimado', value: formatCurrency(mrr, 'COP'), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pagos vencidos', value: pastDue.length + suspended.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing reference */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-800">
        <p className="font-semibold mb-1">Planes (COP · IVA incluido):</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {PLAN_ORDER.map(k => {
            const p = PLANS[k]
            return (
              <span key={k}>
                <strong>{p.name}</strong>: {p.price === 0 ? 'Gratis' : `${fmtCOP(p.price)}/mes`}
                <span className="text-indigo-500 ml-1">({p.maxEstablishments} suc · {p.maxUsers} usuarios)</span>
              </span>
            )
          })}
          <span>+{fmtCOP(9_900)}/usuario extra/mes</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterBilling}
          onChange={e => setFilterBilling(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los cobros</option>
          <option value="active">Cobro activo</option>
          <option value="past_due">Pago pendiente</option>
          <option value="suspended">Suspendida</option>
        </select>
        <span className="flex items-center text-sm text-gray-500 ml-2">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Marca</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Cobro Wompi</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Sucursales</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Usuarios</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Próximo cobro</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">MRR</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(m => {
              const mPlan = PLANS[normalizePlan(m.plan)]
              const mExtra = Math.max(0, m.max_advisors - mPlan.maxUsers)
              const monthly = mPlan.price + mExtra * 9_900
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.brands?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 capitalize">{mPlan.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_OPTS.find(o => o.value === m.status)?.label ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.billing_status ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BILLING_STATUS_COLOR[m.billing_status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {BILLING_STATUS_LABEL[m.billing_status] ?? m.billing_status}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {m.max_establishments >= 9999 ? '∞' : m.max_establishments}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {m.max_advisors >= 9999 ? '∞' : m.max_advisors}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {m.next_billing_at
                      ? new Date(m.next_billing_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 text-xs">
                    {monthly === 0 ? <span className="text-gray-400">Gratis</span> : formatCurrency(monthly, 'COP')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPaymentTarget(m)}
                        title="Registrar pago / ajustar capacidad"
                        className="text-green-600 hover:bg-green-50"
                      >
                        <BadgeDollarSign size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditTarget(m)}>
                        <Edit2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-gray-400">Sin membresías</p>
        )}
      </div>

      {editTarget && (
        <EditModal
          membership={editTarget === 'new' ? null : editTarget}
          brands={brands}
          onClose={() => setEditTarget(null)}
          onSaved={onSaved}
        />
      )}
      {paymentTarget && (
        <PaymentModal
          membership={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSaved={(m) => { onSaved(m); setPaymentTarget(null) }}
        />
      )}
    </div>
  )
}
