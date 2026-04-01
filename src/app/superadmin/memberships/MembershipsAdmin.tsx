'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PLAN_LIMITS, ADDON_PRICES, getLimits, type Plan } from '@/lib/planLimits'
import {
  CreditCard, CheckCircle, AlertCircle, Clock, TrendingUp,
  Edit2, Plus, Building2, Users, DollarSign, X,
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
  brands: { name: string; slug: string } | null
}

interface Brand { id: string; name: string; slug: string }

const PLAN_KEYS = Object.keys(PLAN_LIMITS) as Plan[]

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

const PLAN_COLOR: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  basic: 'bg-blue-100 text-blue-700',
  professional: 'bg-indigo-100 text-indigo-700',
  enterprise: 'bg-purple-100 text-purple-700',
  enterprise_plus: 'bg-rose-100 text-rose-700',
}

function EditModal({
  membership, brands, onClose, onSaved,
}: {
  membership: Membership | null
  brands: Brand[]
  onClose: () => void
  onSaved: (m: Membership) => void
}) {
  const defaultBrandId = membership?.brand_id ?? brands[0]?.id ?? ''
  const defaultLimits = getLimits(membership?.plan ?? 'free')
  const [form, setForm] = useState({
    brand_id: defaultBrandId,
    plan: membership?.plan ?? 'free',
    status: membership?.status ?? 'active',
    started_at: membership?.started_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    expires_at: membership?.expires_at?.slice(0, 10) ?? '',
    max_establishments: membership?.max_establishments ?? defaultLimits.maxEstablishments,
    max_advisors: membership?.max_advisors ?? defaultLimits.maxAdvisors,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function onPlanChange(plan: string) {
    const limits = getLimits(plan)
    setForm(f => ({
      ...f, plan,
      max_establishments: limits.maxEstablishments >= 9999 ? f.max_establishments : limits.maxEstablishments,
      max_advisors: limits.maxAdvisors >= 9999 ? f.max_advisors : limits.maxAdvisors,
    }))
  }

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
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
          <Select label="Plan *" value={form.plan} onChange={e => onPlanChange(e.target.value)}>
            {PLAN_KEYS.map(k => (
              <option key={k} value={k}>{PLAN_LIMITS[k].label}
                {PLAN_LIMITS[k].priceMonthly != null ? ` — $${PLAN_LIMITS[k].priceMonthly}/mes` : ' — A medida'}
              </option>
            ))}
          </Select>
          <Select label="Estado *" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Input label="Inicio" type="date" value={form.started_at} onChange={e => setForm(f => ({ ...f, started_at: e.target.value }))} />
          <Input label="Vencimiento (opcional)" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          <Input label="Máx. sucursales" type="number" min={1} value={form.max_establishments}
            onChange={e => setForm(f => ({ ...f, max_establishments: Number(e.target.value) }))} />
          <Input label="Máx. agentes" type="number" min={1} value={form.max_advisors}
            onChange={e => setForm(f => ({ ...f, max_advisors: Number(e.target.value) }))} />
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

export function MembershipsAdmin({ memberships: initial, brands }: {
  memberships: Membership[]
  brands: Brand[]
}) {
  const [memberships, setMemberships] = useState(initial)
  const [editTarget, setEditTarget] = useState<Membership | 'new' | null>(null)
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  function onSaved(m: Membership) {
    setMemberships(prev => {
      const idx = prev.findIndex(x => x.id === m.id)
      return idx >= 0 ? prev.map(x => x.id === m.id ? m : x) : [m, ...prev]
    })
    setEditTarget(null)
  }

  const active = memberships.filter(m => m.status === 'active')
  const byPlan = PLAN_KEYS.reduce((acc, k) => {
    acc[k] = memberships.filter(m => m.plan === k).length; return acc
  }, {} as Record<string, number>)

  // Monthly revenue estimate
  const mrr = memberships
    .filter(m => m.status === 'active')
    .reduce((sum, m) => sum + (PLAN_LIMITS[m.plan as Plan]?.priceMonthly ?? 0), 0)

  const filtered = memberships.filter(m =>
    (!filterPlan || m.plan === filterPlan) &&
    (!filterStatus || m.status === filterStatus)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Membresías</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de planes y suscripciones por marca</p>
        </div>
        <Button onClick={() => setEditTarget('new')}><Plus size={16} className="mr-1" /> Nueva membresía</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Activas', value: active.length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Total marcas', value: memberships.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'MRR estimado', value: `$${mrr}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Vencidas', value: memberships.filter(m => m.status === 'expired').length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Distribución por plan</h3>
        <div className="flex flex-wrap gap-3">
          {PLAN_KEYS.map(k => (
            <div key={k} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLOR[k]}`}>{PLAN_LIMITS[k].label}</span>
              <span className="text-sm font-bold text-gray-900">{byPlan[k] ?? 0}</span>
              {PLAN_LIMITS[k].priceMonthly != null && (
                <span className="text-xs text-gray-400">${PLAN_LIMITS[k].priceMonthly}/mes</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing reference */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-sm text-indigo-800">
        <p className="font-semibold mb-1">Add-ons:</p>
        <span className="mr-4">+${ADDON_PRICES.extraAdvisor}/agente adicional/mes</span>
        <span>+${ADDON_PRICES.extraEstablishment}/sucursal adicional/mes</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los planes</option>
          {PLAN_KEYS.map(k => <option key={k} value={k}>{PLAN_LIMITS[k].label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Sucursales</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Agentes</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Vencimiento</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">MRR</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(m => {
              const price = PLAN_LIMITS[m.plan as Plan]?.priceMonthly
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.brands?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLOR[m.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                      {PLAN_LIMITS[m.plan as Plan]?.label ?? m.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[m.status] ?? ''}`}>
                      {STATUS_OPTS.find(o => o.value === m.status)?.label ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {m.max_establishments >= 9999 ? '∞' : m.max_establishments}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {m.max_advisors >= 9999 ? '∞' : m.max_advisors}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {m.expires_at
                      ? new Date(m.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {price != null ? `$${price}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditTarget(m)}>
                      <Edit2 size={14} />
                    </Button>
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
    </div>
  )
}
