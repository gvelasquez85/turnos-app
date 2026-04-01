'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, CreditCard, Check } from 'lucide-react'

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

const PLAN_LABELS: Record<string, string> = { basic: 'Básico', professional: 'Profesional', enterprise: 'Empresarial' }
const PLAN_COLORS: Record<string, string> = { basic: 'bg-gray-100 text-gray-700', professional: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' }
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500', trial: 'bg-amber-100 text-amber-700' }

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
                    // Normalise: if user typed without #, add it; validate hex
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
        <div className="max-w-lg">
          {!membership ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin membresía registrada</p>
              <p className="text-sm mt-1">Contacta a soporte para activar tu plan.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${PLAN_COLORS[membership.plan] || 'bg-gray-100 text-gray-700'}`}>
                  {PLAN_LABELS[membership.plan] || membership.plan}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[membership.status] || 'bg-gray-100'}`}>
                  {membership.status === 'active' ? 'Activa' : membership.status === 'trial' ? 'Prueba' : membership.status === 'expired' ? 'Vencida' : 'Cancelada'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Inicio</p>
                  <p className="font-medium">{new Date(membership.started_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vencimiento</p>
                  <p className="font-medium">{membership.expires_at ? new Date(membership.expires_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin vencimiento'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Establecimientos</p>
                  <p className="font-medium">Hasta {membership.max_establishments}</p>
                </div>
                <div>
                  <p className="text-gray-500">Asesores</p>
                  <p className="font-medium">Hasta {membership.max_advisors}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">Para cambios en tu membresía, contacta a soporte@turnapp.co</p>
            </div>
          )}

          {/* Módulos adicionales */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Módulos adicionales</h3>
            {moduleSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-400">Sin módulos contratados. <a href="/admin/marketplace" className="text-indigo-600 underline">Ver marketplace</a></p>
            ) : (
              <div className="flex flex-col gap-2">
                {moduleSubscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
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
            )}
            <a href="/admin/marketplace" className="inline-block mt-3 text-xs text-indigo-600 hover:underline">Ir al marketplace →</a>
          </div>
        </div>
      )}
    </div>
  )
}
