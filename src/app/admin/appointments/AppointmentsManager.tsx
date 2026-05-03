'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Plus, CalendarClock, Clock, User, Phone,
  CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight,
  Building2, Link2, LayoutList, CalendarDays, MessageCircle, Search,
  Settings2, Save, ToggleLeft, ToggleRight, Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ApptStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'no_show'
type ViewMode = 'week' | 'list' | 'settings'

interface Appointment {
  id: string
  establishment_id: string
  visit_reason_id: string | null
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  scheduled_at: string
  duration_minutes: number
  status: ApptStatus
  notes: string | null
  advisor_id: string | null
  establishments: { name: string } | null
  visit_reasons: { name: string } | null
  profiles: { full_name: string | null } | null
}

interface AppointmentSettings {
  id?: string
  establishment_id: string
  slot_minutes: number
  max_per_slot: number
  open_days: number[]
  open_time: string
  close_time: string
  advance_days: number
  buffer_minutes: number
  is_active: boolean
}

const DEFAULT_SETTINGS: Omit<AppointmentSettings, 'establishment_id'> = {
  slot_minutes: 30,
  max_per_slot: 1,
  open_days: [1, 2, 3, 4, 5],
  open_time: '08:00',
  close_time: '18:00',
  advance_days: 30,
  buffer_minutes: 0,
  is_active: true,
}

const STATUS_CONFIG: Record<ApptStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:   { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400',  icon: Clock },
  confirmed: { label: 'Confirmada', color: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500',   icon: CheckCircle },
  attended:  { label: 'Atendida',   color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500',  icon: CheckCircle },
  cancelled: { label: 'Cancelada',  color: 'bg-gray-50 text-gray-500 border-gray-200',     dot: 'bg-gray-300',   icon: XCircle },
  no_show:   { label: 'No asistió', color: 'bg-red-50 text-red-600 border-red-200',        dot: 'bg-red-400',    icon: AlertCircle },
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface Props {
  appointments: Appointment[]
  establishments: { id: string; name: string; brand_id: string; slug: string }[]
  brands: { id: string; name: string }[]
  visitReasons: { id: string; name: string; brand_id: string }[]
  advisors: { id: string; full_name: string | null; establishment_id: string | null }[]
  defaultBrandId: string | null
  defaultEstId: string | null
}

const emptyForm = {
  establishment_id: '', visit_reason_id: '', customer_name: '',
  customer_phone: '', customer_email: '',
  scheduled_date: '', scheduled_time: '',
  duration_minutes: 30, advisor_id: '', notes: '',
}

// ── date helpers ──────────────────────────────────────────────────────────────
function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(m.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}
function addDays(d: Date, n: number): Date {
  const m = new Date(d); m.setDate(m.getDate() + n); return m
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function fmtDate(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString('es', opts ?? { weekday: 'short', day: 'numeric', month: 'short' })
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// ── slot helpers ──────────────────────────────────────────────────────────────
function generateSlots(settings: AppointmentSettings): string[] {
  const slots: string[] = []
  const [oh, om] = settings.open_time.split(':').map(Number)
  const [ch, cm] = settings.close_time.split(':').map(Number)
  let cur = oh * 60 + om
  const end = ch * 60 + cm
  const step = settings.slot_minutes + settings.buffer_minutes
  while (cur + settings.slot_minutes <= end) {
    const h = Math.floor(cur / 60).toString().padStart(2, '0')
    const m = (cur % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += step
  }
  return slots
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({
  establishments,
  defaultEstId,
}: {
  establishments: { id: string; name: string; brand_id: string; slug: string }[]
  defaultEstId: string | null
}) {
  const [estId, setEstId] = useState(defaultEstId || establishments[0]?.id || '')
  const [cfg, setCfg] = useState<AppointmentSettings>({ ...DEFAULT_SETTINGS, establishment_id: estId })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!estId) return
    setLoading(true)
    setCfg({ ...DEFAULT_SETTINGS, establishment_id: estId })
    supabase
      .from('appointment_settings')
      .select('*')
      .eq('establishment_id', estId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCfg(data as AppointmentSettings)
        else setCfg({ ...DEFAULT_SETTINGS, establishment_id: estId })
        setLoading(false)
      })
  }, [estId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true)
    const payload = { ...cfg, establishment_id: estId, updated_at: new Date().toISOString() }
    if (cfg.id) {
      await supabase.from('appointment_settings').update(payload).eq('id', cfg.id)
    } else {
      const { data } = await supabase.from('appointment_settings').insert(payload).select().single()
      if (data) setCfg(data as AppointmentSettings)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleDay(day: number) {
    setCfg(c => ({
      ...c,
      open_days: c.open_days.includes(day)
        ? c.open_days.filter(d => d !== day)
        : [...c.open_days, day].sort(),
    }))
  }

  const est = establishments.find(e => e.id === estId)
  const bookingUrl = est ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${est.slug}` : ''
  const previewSlots = generateSlots(cfg)

  function copyLink() {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Establishment selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <Building2 size={16} className="text-gray-400 shrink-0" />
        <select
          value={estId}
          onChange={e => setEstId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
        >
          {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Booking link */}
      {est && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-600 mb-2 uppercase tracking-wide">Link público de reserva</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 text-sm text-indigo-800 font-mono bg-white border border-indigo-200 rounded-lg px-3 py-2 truncate">{bookingUrl}</span>
            <button onClick={copyLink}
              className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700')}>
              <Copy size={13} />
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-indigo-500 mt-2">Comparte este link con tus clientes para que agenden directamente.</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Cargando configuración…</div>
      ) : (
        <>
          {/* Active toggle */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">Reservas activas</p>
              <p className="text-xs text-gray-500 mt-0.5">Los clientes pueden agendar citas desde el link público</p>
            </div>
            <button onClick={() => setCfg(c => ({ ...c, is_active: !c.is_active }))}>
              {cfg.is_active
                ? <ToggleRight size={32} className="text-indigo-600" />
                : <ToggleLeft size={32} className="text-gray-400" />}
            </button>
          </div>

          {/* Days of week */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Días de atención</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'w-12 h-12 rounded-xl font-semibold text-sm transition-colors',
                    cfg.open_days.includes(day)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {DAY_NAMES[day]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {cfg.open_days.length === 0
                ? 'Sin días seleccionados'
                : cfg.open_days.map(d => DAY_FULL[d]).join(', ')}
            </p>
          </div>

          {/* Hours + slot config */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Horario y duración de turnos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apertura</label>
                <input type="time" value={cfg.open_time}
                  onChange={e => setCfg(c => ({ ...c, open_time: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cierre</label>
                <input type="time" value={cfg.close_time}
                  onChange={e => setCfg(c => ({ ...c, close_time: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Duración (min)</label>
                <select value={cfg.slot_minutes}
                  onChange={e => setCfg(c => ({ ...c, slot_minutes: Number(e.target.value) }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none bg-white">
                  {[10, 15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max por slot</label>
                <input type="number" min={1} max={20} value={cfg.max_per_slot}
                  onChange={e => setCfg(c => ({ ...c, max_per_slot: Number(e.target.value) }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Anticipación máx (días)</label>
                <input type="number" min={1} max={365} value={cfg.advance_days}
                  onChange={e => setCfg(c => ({ ...c, advance_days: Number(e.target.value) }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buffer entre turnos (min)</label>
                <input type="number" min={0} max={60} step={5} value={cfg.buffer_minutes}
                  onChange={e => setCfg(c => ({ ...c, buffer_minutes: Number(e.target.value) }))}
                  className="w-full h-9 rounded-lg border border-gray-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Slot preview */}
          {previewSlots.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Vista previa — {previewSlots.length} turnos disponibles por día
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previewSlots.map(s => (
                  <span key={s} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2 py-1 font-mono">{s}</span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Capacidad total: {previewSlots.length * cfg.max_per_slot} citas/día · Duración: {cfg.slot_minutes} min c/u
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button loading={saving} onClick={handleSave}>
              <Save size={15} className="mr-1.5" />
              Guardar configuración
            </Button>
            {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Guardado</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function AppointmentsManager({
  appointments: initial, establishments, brands, visitReasons, advisors,
  defaultBrandId, defaultEstId,
}: Props) {
  const [appointments, setAppointments] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm, establishment_id: defaultEstId || (establishments.length === 1 ? establishments[0].id : '') })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterEst, setFilterEst] = useState(defaultEstId || '')
  const [filterStatus, setFilterStatus] = useState<'' | ApptStatus>('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)

  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrand, setSelectedBrand] = useState(() => storeBrandId || autoBrandId)

  useEffect(() => {
    if (storeBrandId) { setSelectedBrand(storeBrandId); setFilterEst('') }
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const brandEstablishments = selectedBrand
    ? establishments.filter(e => e.brand_id === selectedBrand)
    : establishments
  const brandReasons = selectedBrand
    ? visitReasons.filter(r => r.brand_id === selectedBrand)
    : visitReasons
  const estAdvisors = form.establishment_id
    ? advisors.filter(a => !a.establishment_id || a.establishment_id === form.establishment_id)
    : advisors

  const filtered = useMemo(() => appointments.filter(a => {
    if (filterEst && a.establishment_id !== filterEst) return false
    if (filterStatus && a.status !== filterStatus) return false
    if (search && !a.customer_name.toLowerCase().includes(search.toLowerCase()) &&
        !(a.customer_phone ?? '').includes(search)) return false
    return true
  }), [appointments, filterEst, filterStatus, search])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    filtered.forEach(a => {
      const d = new Date(a.scheduled_at)
      const key = dayKey(d)
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [filtered])

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    attended: appointments.filter(a => a.status === 'attended').length,
    pending: appointments.filter(a => a.status === 'pending').length,
  }

  // Conflict detection: check if slot is already taken for same establishment
  function hasConflict(estId: string, date: string, time: string, durationMin: number): boolean {
    if (!estId || !date || !time) return false
    const start = new Date(`${date}T${time}`).getTime()
    const end = start + durationMin * 60_000
    return appointments.some(a => {
      if (a.establishment_id !== estId) return false
      if (['cancelled', 'no_show'].includes(a.status)) return false
      const aStart = new Date(a.scheduled_at).getTime()
      const aEnd = aStart + a.duration_minutes * 60_000
      return start < aEnd && end > aStart
    })
  }

  async function handleSave() {
    if (!form.establishment_id) { setError('Selecciona una sucursal'); return }
    if (!form.customer_name.trim()) { setError('El nombre es requerido'); return }
    if (!form.scheduled_date || !form.scheduled_time) { setError('Fecha y hora son requeridas'); return }
    setError(''); setLoading(true)
    const scheduled_at = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString()
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('appointments')
      .insert({
        establishment_id: form.establishment_id,
        visit_reason_id: form.visit_reason_id || null,
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim() || null,
        customer_email: form.customer_email.trim() || null,
        scheduled_at,
        duration_minutes: Number(form.duration_minutes),
        advisor_id: form.advisor_id || null,
        notes: form.notes.trim() || null,
        status: 'pending',
      })
      .select('*, establishments(name), visit_reasons(name), profiles(full_name)')
      .single()
    setLoading(false)
    if (err) { setError(err.message); return }
    setAppointments(prev => [...prev, data as any].sort((a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    ))
    const newWeek = startOfWeek(new Date(`${form.scheduled_date}T${form.scheduled_time}`))
    setWeekStart(newWeek)
    setShowForm(false)
    setForm({ ...emptyForm, establishment_id: form.establishment_id })
  }

  async function updateStatus(id: string, status: ApptStatus) {
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    if (selectedAppt?.id === id) setSelectedAppt(prev => prev ? { ...prev, status } : null)
  }

  function openWhatsApp(phone: string, name: string, scheduledAt: string) {
    const d = new Date(scheduledAt)
    const dateStr = d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    const timeStr = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    const msg = encodeURIComponent(`Hola ${name} 👋, te recordamos tu cita el ${dateStr} a las ${timeStr}. ¡Te esperamos!`)
    const clean = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank')
  }

  const bookingEst = establishments.find(e => e.id === (filterEst || brandEstablishments[0]?.id))
  const today = new Date()
  const conflict = form.scheduled_date && form.scheduled_time && form.establishment_id
    ? hasConflict(form.establishment_id, form.scheduled_date, form.scheduled_time, form.duration_minutes)
    : false

  // ── Detail panel ─────────────────────────────────────────────────────────
  function ApptDetail({ appt, onClose }: { appt: Appointment; onClose: () => void }) {
    const sc = STATUS_CONFIG[appt.status]
    const d = new Date(appt.scheduled_at)
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-gray-900 text-base">{appt.customer_name}</p>
              <p className="text-sm text-gray-500">
                {d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} · {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium', sc.color)}>{sc.label}</span>
          </div>
          <div className="space-y-1.5 text-sm text-gray-600 mb-4">
            {appt.visit_reasons?.name && <p><span className="text-gray-400">Motivo:</span> {appt.visit_reasons.name}</p>}
            {appt.establishments?.name && <p><span className="text-gray-400">Sucursal:</span> {appt.establishments.name}</p>}
            {appt.profiles?.full_name && <p><span className="text-gray-400">Asesor:</span> {appt.profiles.full_name}</p>}
            <p><span className="text-gray-400">Duración:</span> {appt.duration_minutes} min</p>
            {appt.customer_phone && <p><span className="text-gray-400">Teléfono:</span> {appt.customer_phone}</p>}
            {appt.customer_email && <p><span className="text-gray-400">Email:</span> {appt.customer_email}</p>}
            {appt.notes && <p className="italic text-gray-400">{appt.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {appt.customer_phone && (
              <button onClick={() => openWhatsApp(appt.customer_phone!, appt.customer_name, appt.scheduled_at)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600">
                <MessageCircle size={13} /> WhatsApp
              </button>
            )}
            {appt.status === 'pending' && (
              <button onClick={() => updateStatus(appt.id, 'confirmed')}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirmar</button>
            )}
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <button onClick={() => updateStatus(appt.id, 'attended')}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">Atendida ✓</button>
            )}
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <button onClick={() => updateStatus(appt.id, 'no_show')}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600">No asistió</button>
            )}
            {(appt.status === 'pending' || appt.status === 'confirmed') && (
              <button onClick={() => updateStatus(appt.id, 'cancelled')}
                className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Citas programadas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Agenda y gestión de citas de clientes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {bookingEst && (
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/book/${bookingEst.slug}`) }}
              className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium border border-indigo-200 bg-indigo-50 rounded-lg px-3 py-2 hover:bg-indigo-100"
              title="Copiar link de reserva"
            >
              <Link2 size={13} /> Link de reserva
            </button>
          )}
          <Button onClick={() => { setShowForm(true); setError(''); setView('week') }}>
            <Plus size={16} className="mr-1" /> Nueva cita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total período', value: stats.total,     color: 'bg-gray-100 text-gray-700' },
          { label: 'Pendientes',    value: stats.pending,   color: 'bg-amber-100 text-amber-700' },
          { label: 'Confirmadas',   value: stats.confirmed, color: 'bg-blue-100 text-blue-700' },
          { label: 'Atendidas',     value: stats.attended,  color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${s.color}`}>{s.value}</span>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* View / filter controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {view !== 'settings' && (
          <>
            <select className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              value={filterEst} onChange={e => setFilterEst(e.target.value)}>
              <option value="">Todas las sucursales</option>
              {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
              <option value="">Todos los estados</option>
              {(Object.keys(STATUS_CONFIG) as ApptStatus[]).map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Buscar cliente…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:outline-none w-44" />
            </div>
          </>
        )}
        {/* View toggle */}
        <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden">
          {([
            ['week', <CalendarDays size={13} />, 'Semana'],
            ['list', <LayoutList size={13} />, 'Lista'],
            ['settings', <Settings2 size={13} />, 'Config'],
          ] as const).map(([v, icon, label]) => (
            <button key={v} onClick={() => setView(v as ViewMode)}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
                view === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* New appointment form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nueva cita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Sucursal *" value={form.establishment_id}
              onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
              <option value="">— Seleccionar —</option>
              {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
            <Select label="Motivo de visita" value={form.visit_reason_id}
              onChange={e => setForm(f => ({ ...f, visit_reason_id: e.target.value }))}>
              <option value="">— Sin especificar —</option>
              {brandReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Input label="Nombre del cliente *" value={form.customer_name}
              onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
            <Input label="Teléfono / WhatsApp" type="tel" value={form.customer_phone}
              onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.customer_email}
              onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
            <Input label="Fecha *" type="date" value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
            <div>
              <Input label="Hora *" type="time" value={form.scheduled_time}
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} />
              {conflict && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Posible conflicto con otra cita en este horario
                </p>
              )}
            </div>
            <Select label="Duración" value={String(form.duration_minutes)}
              onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}>
              {[15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
            </Select>
            <Select label="Asesor asignado" value={form.advisor_id}
              onChange={e => setForm(f => ({ ...f, advisor_id: e.target.value }))}>
              <option value="">Sin asignar</option>
              {estAdvisors.map(a => <option key={a.id} value={a.id}>{a.full_name || 'Sin nombre'}</option>)}
            </Select>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notas internas</label>
              <textarea rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar cita</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* ── SETTINGS VIEW ─────────────────────────────────────────────────── */}
      {view === 'settings' && (
        <SettingsPanel establishments={brandEstablishments.length > 0 ? brandEstablishments : establishments} defaultEstId={filterEst || defaultEstId} />
      )}

      {/* ── WEEK VIEW ─────────────────────────────────────────────────────── */}
      {view === 'week' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={() => setWeekStart(w => addDays(w, -7))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-800">
                {fmtDate(weekStart, { day: 'numeric', month: 'short' })} – {fmtDate(addDays(weekStart, 6), { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {!sameDay(weekStart, startOfWeek(today)) && (
                <button onClick={() => setWeekStart(startOfWeek(today))}
                  className="text-xs text-indigo-600 font-medium hover:underline">Hoy</button>
              )}
            </div>
            <button onClick={() => setWeekStart(w => addDays(w, 7))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {weekDays.map(d => {
              const isToday = sameDay(d, today)
              const count = (byDay[dayKey(d)] ?? []).length
              return (
                <div key={d.toISOString()} className={cn('p-2 text-center border-r border-gray-100 last:border-r-0', isToday && 'bg-indigo-50')}>
                  <div className={cn('text-xs font-medium uppercase tracking-wide', isToday ? 'text-indigo-600' : 'text-gray-500')}>
                    {d.toLocaleDateString('es', { weekday: 'short' })}
                  </div>
                  <div className={cn('text-lg font-bold mt-0.5', isToday ? 'text-indigo-700' : 'text-gray-800')}>
                    {d.getDate()}
                  </div>
                  {count > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-7 min-h-[320px]">
            {weekDays.map(d => {
              const isToday = sameDay(d, today)
              const dayAppts = (byDay[dayKey(d)] ?? []).sort(
                (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
              )
              return (
                <div key={d.toISOString()} className={cn('p-1.5 border-r border-gray-100 last:border-r-0 min-h-[120px]', isToday && 'bg-indigo-50/40')}>
                  {dayAppts.length === 0 && (
                    <div className="h-full flex items-start pt-2 justify-center">
                      <span className="text-[10px] text-gray-300">—</span>
                    </div>
                  )}
                  {dayAppts.map(a => {
                    const sc = STATUS_CONFIG[a.status]
                    const t = new Date(a.scheduled_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <button key={a.id} onClick={() => setSelectedAppt(a)}
                        className={cn('w-full text-left rounded-lg px-2 py-1.5 mb-1 border text-[11px] transition-colors hover:opacity-80', sc.color)}>
                        <div className="font-semibold truncate">{t} · {a.customer_name.split(' ')[0]}</div>
                        {a.visit_reasons?.name && <div className="truncate opacity-70">{a.visit_reasons.name}</div>}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
              <CalendarClock size={32} className="mx-auto mb-2 opacity-40" />
              <p>No hay citas en este período</p>
            </div>
          )}
          {filtered.map(appt => {
            const sc = STATUS_CONFIG[appt.status]
            const d = new Date(appt.scheduled_at)
            return (
              <div key={appt.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-200 transition-colors cursor-pointer"
                onClick={() => setSelectedAppt(appt)}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 text-center bg-indigo-50 rounded-lg p-2">
                    <div className="text-xs text-indigo-400 font-medium uppercase">{d.toLocaleDateString('es', { weekday: 'short' })}</div>
                    <div className="text-lg font-black text-indigo-700">{d.getDate()}</div>
                    <div className="text-xs font-bold text-indigo-600">{d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{appt.customer_name}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', sc.color)}>{sc.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                      {appt.visit_reasons?.name && <span>{appt.visit_reasons.name}</span>}
                      {appt.establishments?.name && <span className="text-gray-400">{appt.establishments.name}</span>}
                      {appt.customer_phone && <span className="flex items-center gap-0.5"><Phone size={10} />{appt.customer_phone}</span>}
                      {appt.profiles?.full_name && <span className="flex items-center gap-0.5"><User size={10} />{appt.profiles.full_name}</span>}
                      <span><Clock size={10} className="inline mr-0.5" />{appt.duration_minutes} min</span>
                    </div>
                  </div>
                  {appt.customer_phone && (appt.status === 'pending' || appt.status === 'confirmed') && (
                    <button onClick={e => { e.stopPropagation(); openWhatsApp(appt.customer_phone!, appt.customer_name, appt.scheduled_at) }}
                      className="shrink-0 p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="Recordatorio WhatsApp">
                      <MessageCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedAppt && <ApptDetail appt={selectedAppt} onClose={() => setSelectedAppt(null)} />}
    </div>
  )
}
