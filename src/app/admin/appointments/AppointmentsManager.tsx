'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Plus, CalendarClock, Clock, User, Phone, Mail,
  CheckCircle, XCircle, AlertCircle, Calendar, ChevronDown, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ApptStatus = 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'no_show'

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

const STATUS_CONFIG: Record<ApptStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'Pendiente',  color: 'bg-gray-100 text-gray-700',   icon: Clock },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-700',   icon: CheckCircle },
  attended:  { label: 'Atendida',   color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-700',     icon: XCircle },
  no_show:   { label: 'No asistió', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
}

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

export function AppointmentsManager({
  appointments: initial, establishments, brands, visitReasons, advisors,
  defaultBrandId, defaultEstId,
}: Props) {
  const [appointments, setAppointments] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    ...emptyForm,
    establishment_id: defaultEstId || (establishments.length === 1 ? establishments[0].id : ''),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterEst, setFilterEst] = useState(defaultEstId || '')
  const [filterStatus, setFilterStatus] = useState<'' | ApptStatus>('')

  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const [selectedBrand, setSelectedBrand] = useState(autoBrandId)

  const brandEstablishments = selectedBrand
    ? establishments.filter(e => e.brand_id === selectedBrand)
    : establishments

  const brandReasons = selectedBrand
    ? visitReasons.filter(r => r.brand_id === selectedBrand)
    : visitReasons

  const estAdvisors = form.establishment_id
    ? advisors.filter(a => !a.establishment_id || a.establishment_id === form.establishment_id)
    : advisors

  const filtered = appointments.filter(a => {
    if (filterEst && a.establishment_id !== filterEst) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    attended: appointments.filter(a => a.status === 'attended').length,
    pending: appointments.filter(a => a.status === 'pending').length,
  }

  async function handleSave() {
    if (!form.establishment_id) { setError('Selecciona un establecimiento'); return }
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
    setShowForm(false)
    setForm({ ...emptyForm, establishment_id: form.establishment_id })
  }

  async function updateStatus(id: string, status: ApptStatus) {
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  function formatApptDate(iso: string) {
    const d = new Date(iso)
    return {
      date: d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const bookingEst = establishments.find(e => e.id === (filterEst || establishments[0]?.id))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Citas programadas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de agendamiento de clientes</p>
        </div>
        <div className="flex items-center gap-2">
          {bookingEst && (
            <a
              href={`/book/${bookingEst.slug}`}
              target="_blank"
              className="text-xs text-indigo-600 underline flex items-center gap-1"
            >
              Ver formulario público
            </a>
          )}
          <Button onClick={() => { setShowForm(true); setError('') }}>
            <Plus size={16} className="mr-1" /> Nueva cita
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Pendientes', value: stats.pending, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Confirmadas', value: stats.confirmed, color: 'bg-blue-100 text-blue-700' },
          { label: 'Atendidas', value: stats.attended, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
            <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${s.color}`}>{s.value}</span>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {brands.length > 1 && (
          <div className="relative">
            <Building2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              className="pl-8 pr-7 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 appearance-none focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedBrand}
              onChange={e => { setSelectedBrand(e.target.value); setFilterEst('') }}
            >
              <option value="">Todas las marcas</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        )}
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={filterEst}
          onChange={e => setFilterEst(e.target.value)}
        >
          <option value="">Todos los establecimientos</option>
          {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(STATUS_CONFIG) as ApptStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nueva cita</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brands.length > 1 && (
              <Select label="Marca" value={selectedBrand}
                onChange={e => { setSelectedBrand(e.target.value); setForm(f => ({ ...f, establishment_id: '', visit_reason_id: '' })) }}>
                <option value="">— Seleccionar marca —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
            <Select label="Establecimiento *" value={form.establishment_id}
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
            <Input label="Teléfono" type="tel" value={form.customer_phone}
              onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.customer_email}
              onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
            <Input label="Fecha *" type="date" value={form.scheduled_date}
              onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} />
            <Input label="Hora *" type="time" value={form.scheduled_time}
              onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} />
            <Select label="Duración (minutos)" value={String(form.duration_minutes)}
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
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar cita</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Appointments list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
            <CalendarClock size={32} className="mx-auto mb-2 opacity-40" />
            <p>No hay citas en este período</p>
          </div>
        )}
        {filtered.map(appt => {
          const { date, time } = formatApptDate(appt.scheduled_at)
          const sc = STATUS_CONFIG[appt.status]
          const Icon = sc.icon
          return (
            <div key={appt.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                {/* Date block */}
                <div className="shrink-0 w-14 text-center bg-indigo-50 rounded-lg p-2">
                  <div className="text-xs text-indigo-400 font-medium uppercase">{date.split(',')[0]}</div>
                  <div className="text-lg font-black text-indigo-700">{date.split(',')[1]?.trim().split(' ')[0]}</div>
                  <div className="text-xs font-bold text-indigo-600">{time}</div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{appt.customer_name}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', sc.color)}>
                      <Icon size={10} /> {sc.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {appt.visit_reasons?.name && (
                      <span className="text-xs text-gray-500">{appt.visit_reasons.name}</span>
                    )}
                    {appt.establishments?.name && (
                      <span className="text-xs text-gray-400">{appt.establishments.name}</span>
                    )}
                    {appt.customer_phone && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{appt.customer_phone}</span>
                    )}
                    {appt.profiles?.full_name && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><User size={10} />{appt.profiles.full_name}</span>
                    )}
                    <span className="text-xs text-gray-400"><Clock size={10} className="inline mr-0.5" />{appt.duration_minutes} min</span>
                  </div>
                  {appt.notes && <p className="text-xs text-gray-400 mt-1 italic">{appt.notes}</p>}
                </div>
                {/* Status actions */}
                <div className="shrink-0 flex flex-col gap-1">
                  {appt.status === 'pending' && (
                    <Button size="sm" onClick={() => updateStatus(appt.id, 'confirmed')}>Confirmar</Button>
                  )}
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <Button size="sm" onClick={() => updateStatus(appt.id, 'attended')}>Atendida</Button>
                  )}
                  {(appt.status === 'pending' || appt.status === 'confirmed') && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(appt.id, 'no_show')}>No asistió</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(appt.id, 'cancelled')}>Cancelar</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
