'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, UserCheck, UserPlus, RotateCcw, Search,
  Phone, Mail, Building2, Calendar, TrendingUp, Star,
  ChevronDown, ChevronUp, X, Plus, Edit2, Check,
  MessageSquare, Tag, Clock, FileText, ChevronRight,
  Cake, Wifi, Smartphone, Save, Loader2,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  document_id: string | null
  first_visit_at: string
  last_visit_at: string
  total_visits: number
  establishment_ids: string[]
  // Extended fields (added by DB migration)
  celular?: string | null
  canal_contacto?: string | null
  ultima_compra?: string | null
  intereses?: string[] | null
  cumpleanos?: string | null
}

interface CustomerTag {
  id: string
  customer_id: string
  tag_key: string
}

interface CustomerHistoryItem {
  id: string
  customer_id: string
  tipo: string
  fecha: string
  detalles: string | null
}

interface Establishment {
  id: string
  name: string
}

interface Props {
  customers: Customer[]
  establishments: Establishment[]
  brandId: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PREDEFINED_TAGS: { key: string; label: string; color: string }[] = [
  { key: 'cliente_frecuente', label: 'Frecuente', color: 'bg-green-100 text-green-700' },
  { key: 'cliente_nuevo', label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
  { key: 'cliente_inactivo', label: 'Inactivo', color: 'bg-gray-100 text-gray-500' },
  { key: 'pregunto_pero_no_compro', label: 'Preguntó / no compró', color: 'bg-amber-100 text-amber-700' },
  { key: 'requiere_seguimiento', label: 'Requiere seguimiento', color: 'bg-orange-100 text-orange-700' },
  { key: 'cliente_premium', label: 'Premium', color: 'bg-purple-100 text-purple-700' },
  { key: 'debe_volver_30_dias', label: 'Volver en 30 días', color: 'bg-rose-100 text-rose-700' },
]

const CANAL_OPTIONS = ['WhatsApp', 'Llamada', 'Email', 'Presencial', 'Instagram', 'Otro']

const INTERES_OPTIONS = [
  'Corte', 'Color', 'Tinte', 'Manicure', 'Pedicure', 'Tratamiento capilar',
  'Depilación', 'Masajes', 'Faciales', 'Uñas acrílicas',
]

function tagInfo(key: string) {
  return PREDEFINED_TAGS.find(t => t.key === key) ?? { key, label: key, color: 'bg-gray-100 text-gray-500' }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function visitTag(totalVisits: number): { label: string; color: string } {
  if (totalVisits === 1) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' }
  if (totalVisits <= 3) return { label: 'Ocasional', color: 'bg-amber-100 text-amber-700' }
  if (totalVisits <= 9) return { label: 'Frecuente', color: 'bg-green-100 text-green-700' }
  return { label: 'Fiel', color: 'bg-purple-100 text-purple-700' }
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function fmt(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── SlideOver ──────────────────────────────────────────────────────────────

type Tab = 'perfil' | 'etiquetas' | 'historial' | 'notas'

function CustomerSlideOver({
  customer,
  establishments,
  onClose,
  onUpdate,
}: {
  customer: Customer
  establishments: Establishment[]
  onClose: () => void
  onUpdate: (c: Customer) => void
}) {
  const [tab, setTab] = useState<Tab>('perfil')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...customer })
  const [saving, setSaving] = useState(false)
  const [tags, setTags] = useState<CustomerTag[]>([])
  const [history, setHistory] = useState<CustomerHistoryItem[]>([])
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loadingTabs, setLoadingTabs] = useState(false)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const loadTabData = useCallback(async () => {
    if (tab === 'etiquetas' || tab === 'historial' || tab === 'notas') {
      setLoadingTabs(true)
      const supabase = createClient()
      if (tab === 'etiquetas') {
        const { data } = await supabase
          .from('customer_tags')
          .select('*')
          .eq('customer_id', customer.id)
        setTags(data ?? [])
      } else {
        const { data } = await supabase
          .from('customer_history')
          .select('*')
          .eq('customer_id', customer.id)
          .order('fecha', { ascending: false })
          .limit(30)
        setHistory(data ?? [])
      }
      setLoadingTabs(false)
    }
  }, [tab, customer.id])

  useEffect(() => { loadTabData() }, [loadTabData])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const patch: Record<string, unknown> = {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      document_id: form.document_id || null,
    }
    // Extended fields — only include if key exists in schema
    if ('celular' in customer) patch.celular = form.celular || null
    if ('canal_contacto' in customer) patch.canal_contacto = form.canal_contacto || null
    if ('cumpleanos' in customer) patch.cumpleanos = form.cumpleanos || null
    if ('intereses' in customer) patch.intereses = form.intereses ?? []

    const { data } = await supabase.from('customers').update(patch).eq('id', customer.id).select().single()
    setSaving(false)
    setEditing(false)
    if (data) onUpdate({ ...customer, ...data })
  }

  async function toggleTag(tagKey: string) {
    const supabase = createClient()
    const existing = tags.find(t => t.tag_key === tagKey)
    if (existing) {
      await supabase.from('customer_tags').delete().eq('id', existing.id)
      setTags(prev => prev.filter(t => t.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('customer_tags')
        .insert({ customer_id: customer.id, tag_key: tagKey })
        .select().single()
      if (data) setTags(prev => [...prev, data as CustomerTag])
    }
  }

  async function saveNote() {
    if (!note.trim()) return
    setSavingNote(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('customer_history')
      .insert({ customer_id: customer.id, tipo: 'nota', detalles: note.trim() })
      .select().single()
    setSavingNote(false)
    setNote('')
    if (data) setHistory(prev => [data as CustomerHistoryItem, ...prev])
  }

  function toggleInterest(val: string) {
    const curr = form.intereses ?? []
    setForm(f => ({
      ...f,
      intereses: curr.includes(val) ? curr.filter(i => i !== val) : [...curr, val],
    }))
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'perfil', label: 'Perfil', icon: FileText },
    { key: 'etiquetas', label: 'Etiquetas', icon: Tag },
    { key: 'historial', label: 'Historial', icon: Clock },
    { key: 'notas', label: 'Notas', icon: MessageSquare },
  ]

  const vtag = visitTag(customer.total_visits)
  const days = daysSince(customer.last_visit_at)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-sm font-bold text-indigo-700">
            {initials(customer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${vtag.color}`}>{vtag.label}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {tab === 'perfil' && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Edit2 size={15} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 text-center bg-gray-50">
          <div className="py-3 px-2">
            <p className="text-lg font-bold text-gray-900">{customer.total_visits}</p>
            <p className="text-[10px] text-gray-400">visitas</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">
              {days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `${days}d`}
            </p>
            <p className="text-[10px] text-gray-400">última visita</p>
          </div>
          <div className="py-3 px-2">
            <p className="text-sm font-semibold text-gray-900">
              {fmt(customer.first_visit_at, { month: 'short', year: '2-digit' })}
            </p>
            <p className="text-[10px] text-gray-400">desde</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setEditing(false) }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold flex-1 justify-center transition-colors border-b-2 ${
                tab === key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Perfil ── */}
          {tab === 'perfil' && (
            <div className="p-5 space-y-5">
              {editing ? (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { key: 'name', label: 'Nombre completo', type: 'text', required: true },
                      { key: 'phone', label: 'Teléfono', type: 'tel' },
                      { key: 'email', label: 'Correo electrónico', type: 'email' },
                      { key: 'document_id', label: 'Documento de identidad', type: 'text' },
                      ...(('celular' in customer) ? [{ key: 'celular', label: 'Celular (WhatsApp)', type: 'tel' }] : []),
                    ].map(({ key, label, type, required }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>
                        <input
                          type={type}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={(form as any)[key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        />
                      </div>
                    ))}

                    {/* Canal de contacto */}
                    {'canal_contacto' in customer && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Canal preferido</label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={form.canal_contacto ?? ''}
                          onChange={e => setForm(f => ({ ...f, canal_contacto: e.target.value }))}
                        >
                          <option value="">Seleccionar...</option>
                          {CANAL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    )}

                    {/* Cumpleaños */}
                    {'cumpleanos' in customer && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Cumpleaños</label>
                        <input
                          type="date"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                          value={form.cumpleanos ?? ''}
                          onChange={e => setForm(f => ({ ...f, cumpleanos: e.target.value }))}
                        />
                      </div>
                    )}

                    {/* Intereses */}
                    {'intereses' in customer && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Servicios de interés</label>
                        <div className="flex flex-wrap gap-1.5">
                          {INTERES_OPTIONS.map(opt => {
                            const active = (form.intereses ?? []).includes(opt)
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleInterest(opt)}
                                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                  active
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {opt}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || !form.name.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setForm({ ...customer }) }}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Contact info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contacto</p>
                    <div className="space-y-2.5">
                      <InfoRow icon={Phone} label="Teléfono" value={customer.phone} />
                      {'celular' in customer
                        ? <InfoRow icon={Smartphone} label="Celular / WhatsApp" value={customer.celular} />
                        : null
                      }
                      <InfoRow icon={Mail} label="Correo" value={customer.email} />
                      <InfoRow icon={FileText} label="Documento" value={customer.document_id} />
                      {'canal_contacto' in customer
                        ? <InfoRow icon={Wifi} label="Canal preferido" value={customer.canal_contacto} />
                        : null
                      }
                      {'cumpleanos' in customer
                        ? <InfoRow icon={Cake} label="Cumpleaños" value={customer.cumpleanos ? fmt(customer.cumpleanos, { day: 'numeric', month: 'long' }) : null} />
                        : null
                      }
                    </div>
                  </div>

                  {/* Intereses */}
                  {'intereses' in customer && (customer.intereses ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Servicios de interés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(customer.intereses ?? []).map(i => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{i}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Establishments */}
                  {customer.establishment_ids.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Sucursales visitadas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {customer.establishment_ids.map(eid => (
                          <span key={eid} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                            <Building2 size={9} />{estMap[eid] ?? '?'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Actividad</p>
                    <div className="space-y-2">
                      <InfoRow icon={Calendar} label="Primera visita" value={fmt(customer.first_visit_at)} />
                      <InfoRow icon={Calendar} label="Última visita" value={fmt(customer.last_visit_at)} />
                      {'ultima_compra' in customer && (
                        <InfoRow icon={Star} label="Última compra" value={customer.ultima_compra ? fmt(customer.ultima_compra) : null} />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Etiquetas ── */}
          {tab === 'etiquetas' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Asigna etiquetas a este cliente</p>
              {loadingTabs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {PREDEFINED_TAGS.map(({ key, label, color }) => {
                    const active = tags.some(t => t.tag_key === key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleTag(key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          active
                            ? 'border-indigo-200 bg-indigo-50'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          active ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                        }`}>
                          {active && <Check size={10} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Historial ── */}
          {tab === 'historial' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Actividad reciente</p>
              {loadingTabs ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-indigo-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin historial registrado aún</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map(item => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.tipo === 'visita' ? 'bg-green-100 text-green-600'
                        : item.tipo === 'compra' ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.tipo === 'visita' ? <UserCheck size={13} /> : item.tipo === 'compra' ? <Star size={13} /> : <MessageSquare size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 capitalize">{item.tipo}</p>
                        {item.detalles && <p className="text-xs text-gray-500 mt-0.5">{item.detalles}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{fmt(item.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Notas ── */}
          {tab === 'notas' && (
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Agregar nota rápida</p>
              <div className="flex flex-col gap-2 mb-5">
                <textarea
                  rows={3}
                  placeholder="Ej: Cliente prefiere citas los martes por la tarde..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none resize-none"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button
                  onClick={saveNote}
                  disabled={!note.trim() || savingNote}
                  className="self-end flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                >
                  {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Guardar nota
                </button>
              </div>

              {/* Previous notes from history */}
              {loadingTabs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-indigo-400" />
                </div>
              ) : (
                <div className="space-y-2">
                  {history.filter(h => h.tipo === 'nota').map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-sm text-gray-700">{item.detalles}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{fmt(item.fecha, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                  {history.filter(h => h.tipo === 'nota').length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Sin notas registradas</p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={12} className="text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium truncate">{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ─── CreateModal ─────────────────────────────────────────────────────────────

function CreateModal({ brandId, onClose, onCreated }: {
  brandId: string
  onClose: () => void
  onCreated: (c: Customer) => void
}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', document_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('customers')
      .insert({
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        document_id: form.document_id || null,
        brand_id: brandId,
      })
      .select()
      .single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) {
      onCreated({
        ...data,
        first_visit_at: data.created_at || new Date().toISOString(),
        last_visit_at: data.created_at || new Date().toISOString(),
        total_visits: 0,
        establishment_ids: [],
      } as Customer)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Nuevo cliente</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { key: 'name', label: 'Nombre *', type: 'text' },
            { key: 'phone', label: 'Teléfono', type: 'tel' },
            { key: 'email', label: 'Correo', type: 'email' },
            { key: 'document_id', label: 'Documento', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Creando...' : 'Crear cliente'}
            </button>
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function CRMDashboard({ customers: initialCustomers, establishments, brandId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [filterEst, setFilterEst] = useState('')
  const [filterType, setFilterType] = useState<'' | 'new' | 'occasional' | 'frequent' | 'loyal'>('')
  const [sortField, setSortField] = useState<'last_visit_at' | 'total_visits' | 'name'>('last_visit_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [createModal, setCreateModal] = useState(false)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const filtered = useMemo(() => {
    let list = [...customers]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.document_id?.includes(q)
      )
    }
    if (filterEst) list = list.filter(c => c.establishment_ids.includes(filterEst))
    if (filterType) {
      list = list.filter(c => {
        const v = c.total_visits
        if (filterType === 'new') return v === 1
        if (filterType === 'occasional') return v >= 2 && v <= 3
        if (filterType === 'frequent') return v >= 4 && v <= 9
        if (filterType === 'loyal') return v >= 10
        return true
      })
    }
    list.sort((a, b) => {
      let av: any = a[sortField]
      let bv: any = b[sortField]
      if (sortField === 'last_visit_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime() }
      if (sortField === 'name') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })
    return list
  }, [customers, search, filterEst, filterType, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const total = customers.length
  const newOnes = customers.filter(c => c.total_visits === 1).length
  const returning = customers.filter(c => c.total_visits >= 2).length
  const loyal = customers.filter(c => c.total_visits >= 10).length
  const avgVisits = total > 0 ? (customers.reduce((s, c) => s + c.total_visits, 0) / total).toFixed(1) : '0'

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">Historial de visitas y perfil de cada cliente</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', sub: 'clientes', value: total, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Nuevos', sub: '1 sola visita', value: newOnes, icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
          { label: 'Recurrentes', sub: '2 o más visitas', value: returning, icon: RotateCcw, color: 'bg-green-100 text-green-600' },
          { label: 'Fieles', sub: '10+ visitas', value: loyal, icon: Star, color: 'bg-purple-100 text-purple-600' },
          { label: 'Promedio', sub: 'visitas por cliente', value: avgVisits, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
        ].map(({ label, sub, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={13} />
              </div>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {establishments.length > 1 && (
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
        >
          <option value="">Todos los tipos</option>
          <option value="new">Nuevos (1 visita)</option>
          <option value="occasional">Ocasionales (2–3)</option>
          <option value="frequent">Frecuentes (4–9)</option>
          <option value="loyal">Fieles (10+)</option>
        </select>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center px-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck size={28} className="text-indigo-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Aún no hay clientes registrados</p>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Los clientes se registran automáticamente cada vez que se atiende un turno en la cola de espera.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('name')}>
                      Cliente <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">Contacto</th>
                  <th className="px-4 py-2.5 text-left hidden lg:table-cell">Sucursales</th>
                  <th className="px-4 py-2.5 text-center">
                    <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('total_visits')}>
                      Visitas <SortIcon field="total_visits" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('last_visit_at')}>
                      Última visita <SortIcon field="last_visit_at" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      Sin resultados para los filtros aplicados
                    </td>
                  </tr>
                ) : filtered.map(customer => {
                  const tag = visitTag(customer.total_visits)
                  const days = daysSince(customer.last_visit_at)
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomer(customer)}
                      className="hover:bg-indigo-50/40 cursor-pointer group transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-700">
                            {initials(customer.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tag.color}`}>{tag.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone size={10} className="shrink-0 text-gray-400" /> {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail size={10} className="shrink-0 text-gray-400" />
                              <span className="truncate max-w-[160px]">{customer.email}</span>
                            </div>
                          )}
                          {!customer.phone && !customer.email && <span className="text-xs text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {customer.establishment_ids.slice(0, 2).map(eid => (
                            <span key={eid} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {estMap[eid] ?? '?'}
                            </span>
                          ))}
                          {customer.establishment_ids.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{customer.establishment_ids.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-sm font-bold text-gray-900">{customer.total_visits}</p>
                        <p className="text-[10px] text-gray-400">
                          desde {new Date(customer.first_visit_at).toLocaleDateString('es', { month: 'short', year: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(customer.last_visit_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} de {total} clientes · Haz clic en una fila para ver el perfil completo
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selectedCustomer && (
        <CustomerSlideOver
          customer={selectedCustomer}
          establishments={establishments}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={updated => {
            setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c))
            setSelectedCustomer(updated)
          }}
        />
      )}

      {/* Create modal */}
      {createModal && (
        <CreateModal
          brandId={brandId}
          onClose={() => setCreateModal(false)}
          onCreated={newCustomer => {
            setCustomers(cs => [newCustomer, ...cs])
          }}
        />
      )}
    </div>
  )
}
