'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, CreditCard, Mail, Puzzle, Check, Plus, Edit2, Building2, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink, Loader2, Save, Key, Trash2, Send, FileText, Languages } from 'lucide-react'
import { TranslationsManager } from '@/app/superadmin/translations/TranslationsManager'
import { getTranslations, SUPPORTED_LANGUAGES } from '@/lib/i18n/translations'

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
    key: 'brevo',
    label: 'Brevo (Email)',
    icon: '📧',
    color: 'bg-blue-50 border-blue-200',
    vars: [
      {
        env: 'BREVO_API_KEY',
        label: 'API Key',
        hint: 'Brevo → SMTP & API → API Keys → Crear clave. Úsala para envío de campañas.',
        required: true,
      },
      {
        env: 'COMMS_FROM_EMAIL',
        label: 'Email remitente',
        hint: 'Dirección verificada en Brevo (ej: noreply@turnapp.co). Debe estar autorizada como sender.',
      },
      {
        env: 'COMMS_FROM_NAME',
        label: 'Nombre remitente',
        hint: 'Nombre que verán los destinatarios (ej: TurnApp)',
      },
    ],
    docs: 'https://developers.brevo.com/docs/send-a-transactional-email',
    status: 'info' as const,
    statusNote: 'Configura la API Key de Brevo para habilitar campañas de email y correos transaccionales.',
    extra: (
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-900 space-y-1">
        <p className="font-semibold">🔑 SMTP para Supabase Auth (reset de contraseña, invitaciones)</p>
        <p>Configura en <strong>Supabase Dashboard → Authentication → SMTP Settings</strong>:</p>
        <ul className="ml-3 space-y-0.5 text-blue-800">
          <li><strong>Host:</strong> smtp-relay.brevo.com</li>
          <li><strong>Port:</strong> 587</li>
          <li><strong>Username:</strong> tu correo de login en Brevo</li>
          <li><strong>Password:</strong> Brevo → SMTP & API → SMTP → clave SMTP (¡no la contraseña de tu cuenta!)</li>
          <li><strong>Sender email:</strong> el mismo que COMMS_FROM_EMAIL</li>
        </ul>
      </div>
    ),
  },
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
    statusNote: 'Server Key pendiente. Sin ella las notificaciones push no se envían.',
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

// ─── API Keys per brand Tab ───────────────────────────────────────────────────
type ApiKeyEntry = { id: string; name: string; key_prefix: string; active: boolean; created_at: string; last_used_at: string | null }

function ApiKeysTab({ brands }: { brands: { id: string; name: string; primary_color: string | null }[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.id ?? '')
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedBrand) return
    setLoading(true)
    supabase
      .from('api_keys')
      .select('id, name, key_prefix, active, created_at, last_used_at')
      .eq('brand_id', selectedBrand)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setKeys(data ?? []); setLoading(false) })
  }, [selectedBrand])

  async function revokeKey(id: string) {
    setRevoking(id)
    await supabase.from('api_keys').update({ active: false }).eq('id', id)
    setKeys(ks => ks.map(k => k.id === id ? { ...k, active: false } : k))
    setRevoking(null)
  }

  const brand = brands.find(b => b.id === selectedBrand)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <Building2 size={16} className="text-gray-400" />
        <select
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
        >
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
        </div>
      ) : keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
          <Key size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">{brand?.name ?? 'Esta marca'} no tiene API keys generadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {keys.map(k => (
            <div key={k.id} className="flex items-center gap-3 px-4 py-3">
              <Key size={14} className={k.active ? 'text-indigo-500' : 'text-gray-300'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{k.name}</p>
                <p className="text-xs font-mono text-gray-400">{k.key_prefix}••••••••••••••••••••••</p>
              </div>
              <div className="text-xs text-gray-400 text-right hidden sm:block">
                <p>Creada {new Date(k.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                {k.last_used_at && <p>Usada {new Date(k.last_used_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${k.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {k.active ? 'Activa' : 'Revocada'}
              </span>
              {k.active && (
                <button
                  onClick={() => revokeKey(k.id)}
                  disabled={revoking === k.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Revocar clave"
                >
                  {revoking === k.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Las claves se generan desde <strong>Mi marca → Integraciones</strong> dentro de cada cuenta de marca.
      </p>
    </div>
  )
}

// ─── Communications Tab ───────────────────────────────────────────────────────
type ConsentContact = { id: string; customer_name: string; customer_email: string | null; customer_phone: string | null; establishment_id: string }

function CommsTab({ brands }: { brands: { id: string; name: string; primary_color: string | null }[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.id ?? '')
  const [contacts, setContacts] = useState<ConsentContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('<h2>Hola {{nombre}},</h2>\n<p>Te escribimos desde [tu marca].</p>\n<p></p>\n<p>Saludos,<br/>El equipo</p>')
  const [preview, setPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ ok: number; fail: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedBrand) return
    setLoadingContacts(true)
    setSent(null)
    supabase
      .from('consents')
      .select('id, customer_name, customer_email, customer_phone, establishment_id')
      .eq('brand_id', selectedBrand)
      .eq('consented', true)
      .not('customer_email', 'is', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setContacts(data ?? []); setLoadingContacts(false) })
  }, [selectedBrand])

  async function handleSend() {
    if (!subject.trim() || !body.trim() || contacts.length === 0) return
    setSending(true)
    setSent(null)
    const res = await fetch('/api/superadmin/comms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_id: selectedBrand, subject, body, contacts }),
    })
    const json = await res.json()
    setSent({ ok: json.sent ?? 0, fail: json.failed ?? 0 })
    setSending(false)
  }

  const previewHtml = body
    .replace(/\{\{nombre\}\}/g, contacts[0]?.customer_name ?? 'Cliente')

  return (
    <div className="space-y-5">
      {/* Brand + contact list */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Building2 size={16} className="text-gray-400 shrink-0" />
          <select
            className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
          >
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {loadingContacts ? (
          <p className="text-sm text-gray-400 flex items-center gap-1"><Loader2 size={13} className="animate-spin" /> Cargando contactos...</p>
        ) : (
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className={contacts.length > 0 ? 'text-green-500' : 'text-gray-300'} />
            <p className="text-sm text-gray-700">
              <strong>{contacts.length}</strong> contactos con autorización y correo registrado
            </p>
            {contacts.length > 0 && (
              <span className="text-xs text-gray-400">({contacts.filter(c => c.customer_email).length} con email)</span>
            )}
          </div>
        )}
        {contacts.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 divide-y divide-gray-50">
            {contacts.slice(0, 20).map(c => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600">
                <span className="font-medium truncate flex-1">{c.customer_name}</span>
                <span className="text-gray-400 truncate">{c.customer_email}</span>
              </div>
            ))}
            {contacts.length > 20 && <p className="px-3 py-1.5 text-xs text-gray-400">+{contacts.length - 20} más...</p>}
          </div>
        )}
      </div>

      {/* Email builder */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2"><FileText size={15} /> Constructor de correo</h3>
          <button
            onClick={() => setPreview(p => !p)}
            className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
          >
            <Eye size={12} /> {preview ? 'Editar' : 'Vista previa'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Asunto</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            placeholder="ej. Te tenemos novedades 🎉"
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Cuerpo HTML <span className="text-gray-400 font-normal">— usa <code className="bg-gray-100 px-1 rounded">{'{{nombre}}'}</code> para personalizar</span>
          </label>
          {preview ? (
            <div
              className="min-h-[200px] rounded-lg border border-gray-200 p-4 prose prose-sm max-w-none text-gray-800 bg-gray-50"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none min-h-[200px]"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">⚙️ Servicio de envío requerido</p>
          <p>Para enviar correos reales conecta <strong>Resend</strong> o <strong>SendGrid</strong> en la pestaña Integraciones del sistema. El envío usa el endpoint <code className="bg-amber-100 px-1 rounded">/api/superadmin/comms/send</code>.</p>
        </div>

        {sent && (
          <div className={`rounded-lg p-3 text-sm font-medium ${sent.fail === 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {sent.ok} correo(s) enviado(s) correctamente{sent.fail > 0 ? ` · ${sent.fail} fallido(s)` : ''}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || contacts.length === 0 || !subject.trim() || !body.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? 'Enviando...' : `Enviar a ${contacts.length} contacto${contacts.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  )
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

type SettingEntry = { masked: string; source: 'env' | 'db'; editable: boolean; set: boolean }
type SettingsData = Record<string, SettingEntry>

function IntegrationsTab() {
  const [settings, setSettings] = useState<SettingsData>({})
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [showVal, setShowVal] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/settings')
      const json = await res.json()
      if (json.data) setSettings(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveKey(envKey: string) {
    const value = edits[envKey] ?? ''
    setSaving(envKey)
    await fetch('/api/superadmin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [envKey]: value }),
    })
    setSaved(s => ({ ...s, [envKey]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [envKey]: false })), 2000)
    setSaving(null)
    // refresh
    await load()
    setEdits(e => { const n = { ...e }; delete n[envKey]; return n })
  }

  const statusForIntegration = (key: string): 'ok' | 'partial' | 'info' => {
    if (key === 'brevo') {
      const hasKey = settings['BREVO_API_KEY']?.set
      const hasFrom = settings['COMMS_FROM_EMAIL']?.set
      if (hasKey && hasFrom) return 'ok'
      if (hasKey) return 'partial'
      return 'info'
    }
    if (key === 'firebase') {
      const serverKey = settings['FIREBASE_SERVER_KEY']
      const hasAll = ['NEXT_PUBLIC_FIREBASE_API_KEY','NEXT_PUBLIC_FIREBASE_PROJECT_ID','NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID','NEXT_PUBLIC_FIREBASE_APP_ID','NEXT_PUBLIC_FIREBASE_VAPID_KEY'].every(k => settings[k]?.set)
      if (hasAll && serverKey?.set) return 'ok'
      return 'partial'
    }
    if (key === 'supabase') {
      const allSet = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'].every(k => settings[k]?.set)
      return allSet ? 'ok' : 'partial'
    }
    if (key === 'vercel') return settings['VERCEL_TOKEN']?.set ? 'ok' : 'info'
    return 'info'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Llaves de integración</p>
        <p>Las llaves marcadas como <span className="font-medium">editables</span> se guardan en la base de datos y se aplican sin redeploy. Las variables <code className="bg-blue-100 px-1 rounded font-mono text-xs">NEXT_PUBLIC_*</code> se configuran en el build y requieren un redeploy para actualizarse.</p>
      </div>

      {INTEGRATIONS.map(integration => {
        const status = statusForIntegration(integration.key)
        return (
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
                {status === 'ok' && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={13} /> Activo</span>}
                {status === 'partial' && <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertCircle size={13} /> Parcial</span>}
                {status === 'info' && <span className="flex items-center gap-1 text-xs text-gray-500 font-medium"><AlertCircle size={13} /> Info</span>}
                <a href={integration.docs} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">Docs <ExternalLink size={10} /></a>
              </div>
            </div>

            {'extra' in integration && integration.extra && (
              <div className="px-5 py-3 border-b border-inherit">
                {integration.extra}
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {integration.vars.map(v => {
                const entry = settings[v.env]
                const isEditable = entry?.editable ?? false
                const isSet = entry?.set ?? false
                const isSaving = saving === v.env
                const isSaved = saved[v.env]
                const isShowingVal = showVal[v.env]
                const currentEdit = edits[v.env]
                const isDirty = currentEdit !== undefined

                return (
                  <div key={v.env} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <code className="text-xs font-mono text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">{v.env}</code>
                      <span className="text-xs text-gray-600 font-medium">{v.label}</span>
                      {isEditable
                        ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-semibold">Editable</span>
                        : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">Requiere redeploy</span>
                      }
                      {isSet
                        ? <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium"><CheckCircle size={10} /> Configurada</span>
                        : <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-medium"><AlertCircle size={10} /> Sin configurar</span>
                      }
                    </div>
                    <p className="text-xs text-gray-400 mb-2 leading-snug">{v.hint}</p>

                    {isEditable ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={isShowingVal ? 'text' : 'password'}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-9 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none bg-white placeholder:text-gray-400"
                            placeholder={isSet ? entry.masked : 'Pegar valor aquí…'}
                            value={currentEdit ?? ''}
                            onChange={e => setEdits(ed => ({ ...ed, [v.env]: e.target.value }))}
                          />
                          <button
                            type="button"
                            onClick={() => setShowVal(s => ({ ...s, [v.env]: !s[v.env] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {isShowingVal ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          onClick={() => saveKey(v.env)}
                          disabled={isSaving || !isDirty}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            isSaved
                              ? 'bg-green-500 text-white'
                              : isDirty
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? <Loader2 size={13} className="animate-spin" /> : isSaved ? <CheckCircle size={13} /> : <Save size={13} />}
                          {isSaved ? 'Guardado' : 'Guardar'}
                        </button>
                        {isSet && entry.source === 'db' && (
                          <button
                            title="Borrar override (vuelve al valor de env)"
                            className="text-xs text-gray-400 hover:text-red-500 px-2 py-2"
                            onClick={() => setEdits(ed => ({ ...ed, [v.env]: '' }))}
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-500 select-all">
                          {isSet ? entry.masked : <span className="text-gray-400 italic text-xs">No configurada en Vercel</span>}
                        </div>
                        <a
                          href="https://vercel.com/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-indigo-500 hover:underline whitespace-nowrap"
                        >
                          Editar en Vercel <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Pasos para activar notificaciones push</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Ir a <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Firebase Console</a></li>
          <li>Seleccionar el proyecto → Configuración del proyecto → Cloud Messaging</li>
          <li>Copiar el valor de <strong>Server key</strong></li>
          <li>Pegar en el campo <code className="bg-gray-100 px-1 rounded font-mono text-xs">FIREBASE_SERVER_KEY</code> de arriba y guardar</li>
          <li>Las notificaciones push quedarán activas de inmediato (sin redeploy)</li>
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
  const [tab, setTab] = useState<'modules' | 'comms' | 'apikeys' | 'integrations' | 'translations'>('modules')
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
    { key: 'translations', label: 'Traducciones', icon: Languages },
    { key: 'comms', label: 'Comunicaciones', icon: Mail },
    { key: 'apikeys', label: 'API Keys por marca', icon: Key },
    { key: 'integrations', label: 'Integraciones del sistema', icon: Puzzle },
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

      {/* Comunicaciones */}
      {tab === 'comms' && <CommsTab brands={brands} />}

      {/* API Keys por marca */}
      {tab === 'apikeys' && <ApiKeysTab brands={brands} />}

      {/* Integraciones */}
      {tab === 'integrations' && <IntegrationsTab />}

      {/* Traducciones */}
      {tab === 'translations' && (
        <TranslationsManager
          staticByLang={Object.fromEntries(SUPPORTED_LANGUAGES.map(l => [l.code, getTranslations(l.code) as Record<string, string>]))}
          dbOverrides={[]}
          supportedLangs={SUPPORTED_LANGUAGES.map(l => ({ code: l.code, label: l.label }))}
        />
      )}

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
