'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, CreditCard, Mail, Puzzle, Check, Plus, Edit2, Building2, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

const MODULE_LIST = [
  { key: 'queue', label: 'Cola de turnos', desc: 'Sistema de turnos en espera' },
  { key: 'appointments', label: 'Citas', desc: 'Reserva de citas programadas' },
  { key: 'surveys', label: 'Encuestas', desc: 'NPS / CSAT / CES' },
  { key: 'menu', label: 'Menú / Preorden', desc: 'Pedidos anticipados' },
  { key: 'display', label: 'Pantalla sala', desc: 'TV de sala de espera' },
]

const PLAN_LABELS: Record<string, string> = { basic: 'Básico', professional: 'Profesional', enterprise: 'Empresarial' }
const PLAN_COLORS: Record<string, string> = { basic: 'bg-gray-100 text-gray-700', professional: 'bg-blue-100 text-blue-700', enterprise: 'bg-purple-100 text-purple-700' }
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', expired: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500', trial: 'bg-amber-100 text-amber-700' }

// ─── Integrations Tab ─────────────────────────────────────────────────────────

const INTEGRATIONS = [
  {
    key: 'firebase',
    label: 'Firebase / FCM',
    icon: '🔥',
    color: 'bg-orange-50 border-orange-200',
    vars: [
      { env: 'NEXT_PUBLIC_FIREBASE_API_KEY', label: 'API Key', hint: 'Firebase Console → Configuración → General → Tus apps → API Key' },
      { env: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', label: 'Project ID', hint: 'Firebase Console → Configuración → General → ID del proyecto' },
      { env: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', label: 'Sender ID', hint: 'Firebase Console → Configuración → Cloud Messaging → ID del remitente' },
      { env: 'NEXT_PUBLIC_FIREBASE_APP_ID', label: 'App ID', hint: 'Firebase Console → Configuración → General → ID de la app' },
      { env: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY', label: 'VAPID Key', hint: 'Firebase Console → Configuración → Cloud Messaging → Certificados push web → Clave pública' },
      { env: 'FIREBASE_SERVER_KEY', label: 'Server Key ⚠️', hint: 'Firebase Console → Configuración → Cloud Messaging → Server key. REQUERIDA para enviar notificaciones push.', required: true },
    ],
    docs: 'https://firebase.google.com/docs/web/setup',
    status: 'partial' as const,
    statusNote: 'Server Key pendiente de agregar en Vercel. Sin ella las notificaciones push no se envían.',
  },
  {
    key: 'vercel',
    label: 'Vercel',
    icon: '▲',
    color: 'bg-gray-50 border-gray-200',
    vars: [
      { env: 'VERCEL_TOKEN', label: 'Token API', hint: 'vercel.com → Account Settings → Tokens' },
    ],
    docs: 'https://vercel.com/docs/rest-api',
    status: 'info' as const,
    statusNote: 'El deploy actual se realiza via CLI. Para auto-deploy reconectar el repo en Vercel Dashboard → Settings → Git.',
  },
  {
    key: 'supabase',
    label: 'Supabase',
    icon: '⚡',
    color: 'bg-emerald-50 border-emerald-200',
    vars: [
      { env: 'NEXT_PUBLIC_SUPABASE_URL', label: 'URL del proyecto', hint: 'Supabase Dashboard → Settings → API → Project URL' },
      { env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Anon Key', hint: 'Supabase Dashboard → Settings → API → anon public' },
      { env: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key', hint: 'Supabase Dashboard → Settings → API → service_role (privada)' },
    ],
    docs: 'https://supabase.com/docs',
    status: 'ok' as const,
    statusNote: 'Conectado y operativo.',
  },
]

function IntegrationsTab() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">⚠️ Variables de entorno</p>
        <p>Las llaves de integración se gestionan en <strong>Vercel Dashboard → Settings → Environment Variables</strong>. Esta pantalla muestra el estado y dónde obtener cada valor, pero no puede modificar las variables directamente.</p>
        <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-amber-700 font-medium underline hover:text-amber-900">
          Ir a Vercel Dashboard <ExternalLink size={12} />
        </a>
      </div>

      {INTEGRATIONS.map(integration => (
        <div key={integration.key} className={`bg-white rounded-xl border-2 ${integration.color} overflow-hidden`}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-inherit">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{integration.label}</p>
                <p className="text-xs text-gray-500">{integration.statusNote}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.status === 'ok' && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={13} /> Activo</span>}
              {integration.status === 'partial' && <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertCircle size={13} /> Parcial</span>}
              {integration.status === 'info' && <span className="flex items-center gap-1 text-xs text-gray-500 font-medium"><AlertCircle size={13} /> Info</span>}
              <a href={integration.docs} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">Docs <ExternalLink size={10} /></a>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {integration.vars.map(v => (
              <div key={v.env} className="px-5 py-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="text-xs font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{v.env}</code>
                    <span className="text-xs text-gray-600">{v.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-snug">{v.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Pasos para activar notificaciones push</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Ir a <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Firebase Console</a></li>
          <li>Seleccionar el proyecto → Configuración del proyecto → Cloud Messaging</li>
          <li>Copiar el valor de <strong>Server key</strong></li>
          <li>En <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Vercel Dashboard</a> → Settings → Environment Variables</li>
          <li>Agregar <code className="bg-gray-100 px-1 rounded font-mono text-xs">FIREBASE_SERVER_KEY</code> con ese valor</li>
          <li>Re-deployar (o esperar al próximo deploy)</li>
        </ol>
      </div>
    </div>
  )
}

interface Brand { id: string; name: string; slug: string; active_modules: Record<string, boolean> | null; primary_color: string | null }
interface Membership { id: string; brand_id: string; plan: string; status: string; started_at: string; expires_at: string | null; max_establishments: number; max_advisors: number; brands: { name: string } | null }
interface Props { brands: Brand[]; memberships: Membership[] }

// Modal for editing membership
function MembershipModal({ brand, existing, onClose, onSave }: { brand: Brand; existing: Membership | null; onClose: () => void; onSave: (m: Membership) => void }) {
  const [form, setForm] = useState({
    plan: existing?.plan || 'basic',
    status: existing?.status || 'active',
    started_at: existing?.started_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    expires_at: existing?.expires_at?.slice(0, 10) || '',
    max_establishments: existing?.max_establishments || 1,
    max_advisors: existing?.max_advisors || 5,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      brand_id: brand.id,
      plan: form.plan,
      status: form.status,
      started_at: form.started_at,
      expires_at: form.expires_at || null,
      max_establishments: Number(form.max_establishments),
      max_advisors: Number(form.max_advisors),
    }
    let data: any
    if (existing) {
      const res = await supabase.from('memberships').update(payload).eq('id', existing.id).select('*, brands(name)').single()
      data = res.data
    } else {
      const res = await supabase.from('memberships').insert(payload).select('*, brands(name)').single()
      data = res.data
    }
    if (data) onSave(data)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-gray-900 mb-4">{existing ? 'Editar' : 'Crear'} membresía — {brand.name}</h2>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Plan</label>
            <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
              <option value="basic">Básico</option>
              <option value="professional">Profesional</option>
              <option value="enterprise">Empresarial</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Estado</label>
            <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="trial">Prueba</option>
              <option value="active">Activa</option>
              <option value="expired">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Inicio</label>
              <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.started_at} onChange={e => setForm(f => ({ ...f, started_at: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Vencimiento</label>
              <input type="date" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Max establecimientos</label>
              <input type="number" min={1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.max_establishments} onChange={e => setForm(f => ({ ...f, max_establishments: Number(e.target.value) }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Max asesores</label>
              <input type="number" min={1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" value={form.max_advisors} onChange={e => setForm(f => ({ ...f, max_advisors: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">Guardar</Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SuperadminSettings({ brands: initialBrands, memberships: initialMemberships }: Props) {
  const [tab, setTab] = useState<'modules' | 'memberships' | 'comms' | 'integrations'>('modules')
  const [brands, setBrands] = useState(initialBrands)
  const [memberships, setMemberships] = useState(initialMemberships)
  const [saving, setSaving] = useState<string | null>(null)
  const [membershipModal, setMembershipModal] = useState<{ brand: Brand; existing: Membership | null } | null>(null)

  function getModules(brand: Brand): Record<string, boolean> {
    return brand.active_modules ?? { queue: true, appointments: false, surveys: false, menu: false, display: false }
  }

  async function toggleModule(brand: Brand, key: string) {
    const current = getModules(brand)
    const updated = { ...current, [key]: !current[key] }
    setSaving(brand.id + key)
    const supabase = createClient()
    await supabase.from('brands').update({ active_modules: updated }).eq('id', brand.id)
    setBrands(bs => bs.map(b => b.id === brand.id ? { ...b, active_modules: updated } : b))
    setSaving(null)
  }

  function getBrandMembership(brandId: string) {
    return memberships.find(m => m.brand_id === brandId) || null
  }

  const TABS = [
    { key: 'modules', label: 'Módulos por marca', icon: Settings },
    { key: 'memberships', label: 'Membresías', icon: CreditCard },
    { key: 'comms', label: 'Comunicaciones', icon: Mail },
    { key: 'integrations', label: 'Integraciones', icon: Puzzle },
  ] as const

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración del sistema</h1>
        <p className="text-gray-500 text-sm mt-1">Administra módulos, membresías y configuración global</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Módulos por marca */}
      {tab === 'modules' && (
        <div className="flex flex-col gap-4">
          {brands.map(brand => {
            const mods = getModules(brand)
            return (
              <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: brand.primary_color ?? '#6366f1' }}>
                    <Building2 size={14} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MODULE_LIST.map(mod => {
                    const active = mods[mod.key] ?? false
                    const isLoading = saving === brand.id + mod.key
                    return (
                      <button
                        key={mod.key}
                        onClick={() => toggleModule(brand, mod.key)}
                        disabled={isLoading || mod.key === 'queue'}
                        className={`rounded-xl p-3 text-left border-2 transition-all ${
                          active
                            ? 'border-indigo-400 bg-indigo-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        } ${mod.key === 'queue' ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-700">{mod.label}</span>
                          {active && <Check size={12} className="text-indigo-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500">{mod.desc}</p>
                        {mod.key === 'queue' && <p className="text-[10px] text-gray-400 mt-1">Siempre activo</p>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Membresías */}
      {tab === 'memberships' && (
        <div className="flex flex-col gap-3">
          {brands.map(brand => {
            const m = getBrandMembership(brand.id)
            return (
              <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: brand.primary_color ?? '#6366f1' }}>
                  <Building2 size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{brand.name}</p>
                  {m ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[m.plan] || 'bg-gray-100 text-gray-700'}`}>{PLAN_LABELS[m.plan] || m.plan}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-gray-100'}`}>{m.status === 'active' ? 'Activa' : m.status === 'trial' ? 'Prueba' : m.status === 'expired' ? 'Vencida' : 'Cancelada'}</span>
                      {m.expires_at && <span className="text-xs text-gray-400">Vence: {new Date(m.expires_at).toLocaleDateString('es')}</span>}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Sin membresía</p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => setMembershipModal({ brand, existing: m })}>
                  {m ? <Edit2 size={14} /> : <Plus size={14} />}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Comunicaciones */}
      {tab === 'comms' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <Mail size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-700">Plantillas de comunicación</p>
          <p className="text-sm mt-1">Configuración de correos automáticos — próximamente</p>
        </div>
      )}

      {/* Integraciones */}
      {tab === 'integrations' && <IntegrationsTab />}

      {membershipModal && (
        <MembershipModal
          brand={membershipModal.brand}
          existing={membershipModal.existing}
          onClose={() => setMembershipModal(null)}
          onSave={(m) => {
            setMemberships(ms => {
              const idx = ms.findIndex(x => x.id === m.id)
              if (idx >= 0) { const next = [...ms]; next[idx] = m; return next }
              return [m, ...ms]
            })
          }}
        />
      )}
    </div>
  )
}
