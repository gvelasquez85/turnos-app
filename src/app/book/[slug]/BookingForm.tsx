'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarClock, CheckCircle, ChevronRight } from 'lucide-react'

interface AppointmentSettings {
  slot_minutes: number
  max_per_slot: number
  open_days: number[]
  open_time: string
  close_time: string
  buffer_minutes: number
}

interface Props {
  establishment: {
    id: string
    name: string
    brand_id: string
    brands: { name: string; logo_url: string | null; primary_color: string | null }
  }
  visitReasons: { id: string; name: string; description: string | null }[]
}

export function BookingForm({ establishment, visitReasons }: Props) {
  const [step, setStep] = useState<'form' | 'reason' | 'done'>('form')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', notes: '',
    scheduled_date: '', scheduled_time: '',
  })
  const [selectedReason, setSelectedReason] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [appointmentId, setAppointmentId] = useState<string | null>(null)

  // Slot picker state
  const [settings, setSettings] = useState<AppointmentSettings | null | undefined>(undefined) // undefined = not loaded yet
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(new Set())
  const [dayBlocked, setDayBlocked] = useState(false)

  const brand = establishment.brands
  const primaryColor = brand?.primary_color ?? '#6366f1'

  // Load settings once
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('appointment_settings')
      .select('*')
      .eq('establishment_id', establishment.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data as AppointmentSettings | null)
      })
  }, [establishment.id])

  // Load slots when date changes
  useEffect(() => {
    if (!form.scheduled_date || !settings) return

    const dayOfWeek = new Date(form.scheduled_date + 'T12:00:00').getDay()
    if (!settings.open_days.includes(dayOfWeek)) {
      setDayBlocked(true)
      setAvailableSlots([])
      setUnavailableSlots(new Set())
      setForm(f => ({ ...f, scheduled_time: '' }))
      return
    }
    setDayBlocked(false)

    // Generate all slots for the day
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
    setAvailableSlots(slots)

    // Fetch booked appointments for that date
    setSlotsLoading(true)
    const dayStart = `${form.scheduled_date}T00:00:00`
    const dayEnd = `${form.scheduled_date}T23:59:59`
    const supabase = createClient()
    supabase
      .from('appointments')
      .select('scheduled_at, duration_minutes, status')
      .eq('establishment_id', establishment.id)
      .gte('scheduled_at', dayStart)
      .lte('scheduled_at', dayEnd)
      .not('status', 'in', '("cancelled","no_show")')
      .then(({ data }) => {
        const booked = data || []
        // Count bookings per slot
        const slotCounts: Record<string, number> = {}
        for (const slot of slots) {
          const [sh, sm] = slot.split(':').map(Number)
          const slotMinutes = sh * 60 + sm
          let count = 0
          for (const appt of booked) {
            const apptDate = new Date(appt.scheduled_at)
            const apptMinutes = apptDate.getHours() * 60 + apptDate.getMinutes()
            if (Math.abs(apptMinutes - slotMinutes) < settings!.slot_minutes) {
              count++
            }
          }
          slotCounts[slot] = count
        }
        const unavail = new Set(
          slots.filter(s => slotCounts[s] >= settings!.max_per_slot)
        )
        setUnavailableSlots(unavail)
        setSlotsLoading(false)
      })
  }, [form.scheduled_date, settings, establishment.id])

  function validateForm() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (!form.scheduled_date) errs.date = 'La fecha es requerida'
    if (!form.scheduled_time) errs.time = 'La hora es requerida'
    if (form.scheduled_date) {
      const selected = new Date(`${form.scheduled_date}T${form.scheduled_time || '00:00'}`)
      if (selected < new Date()) errs.date = 'La fecha no puede ser en el pasado'
    }
    return errs
  }

  async function handleSubmit() {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    const supabase = createClient()

    const scheduled_at = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        establishment_id: establishment.id,
        visit_reason_id: selectedReason?.id || null,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim() || null,
        scheduled_at,
        duration_minutes: settings?.slot_minutes ?? 30,
        notes: form.notes.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single()

    setLoading(false)
    if (!error && data) {
      setAppointmentId(data.id)
      setStep('done')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (step === 'done') {
    const d = new Date(`${form.scheduled_date}T${form.scheduled_time}`)
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)` }}>
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={64} className="text-white mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-1">¡Cita agendada!</h1>
          <p className="text-white/70 mb-8">Te esperamos en {establishment.name}</p>
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CalendarClock size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm text-gray-500">
                  {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
              <p className="text-gray-500">Nombre: <span className="font-medium text-gray-900">{form.name}</span></p>
              {selectedReason && <p className="text-gray-500">Motivo: <span className="font-medium text-gray-900">{selectedReason.name}</span></p>}
              <p className="text-gray-500">Sucursal: <span className="font-medium text-gray-900">{establishment.name}</span></p>
            </div>
          </div>
          <p className="text-white/50 text-xs mt-6">{brand.name}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="text-white text-center py-6 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="flex items-center justify-center gap-3 mb-1">
          {brand.logo_url && (
            <img src={brand.logo_url} alt={brand.name} className="rounded-xl w-12 h-12 object-cover" />
          )}
          <h1 className="text-xl font-bold">{brand.name}</h1>
        </div>
        <p className="text-white/70 text-sm">Agenda tu cita en {establishment.name}</p>
      </div>

      <div className="flex-1 p-6 max-w-sm mx-auto w-full">
        {step === 'form' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Tus datos</h2>
            <p className="text-sm text-gray-500 mb-6">Completa el formulario para agendar tu cita</p>
            <div className="flex flex-col gap-4">
              <Input label="Nombre completo *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} error={errors.name} />
              <Input label="Teléfono *" type="tel" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} error={errors.phone} />
              <Input label="Correo electrónico" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

              {/* Date picker - always shown */}
              <Input label="Fecha *" type="date" min={today} value={form.scheduled_date}
                onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value, scheduled_time: '' }))}
                error={errors.date} />

              {/* Time: slot grid or fallback input */}
              {settings === undefined ? null : settings === null ? (
                /* No settings → fallback to plain time input */
                <Input label="Hora *" type="time" value={form.scheduled_time}
                  onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} error={errors.time} />
              ) : (
                /* Settings exist → slot grid */
                form.scheduled_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hora *</label>
                    {dayBlocked ? (
                      <p className="text-sm text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                        No hay turnos disponibles para este día
                      </p>
                    ) : slotsLoading ? (
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map(slot => {
                          const isUnavailable = unavailableSlots.has(slot)
                          const isSelected = form.scheduled_time === slot
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isUnavailable}
                              onClick={() => !isUnavailable && setForm(f => ({ ...f, scheduled_time: slot }))}
                              className={[
                                'px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors',
                                isUnavailable
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50',
                              ].join(' ')}
                            >
                              {slot}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
                  </div>
                )
              )}

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Comentarios</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Cuéntanos algo que debamos saber..."
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <Button size="lg" className="w-full mt-2"
                onClick={() => {
                  const errs = validateForm()
                  if (Object.keys(errs).length > 0) { setErrors(errs); return }
                  if (visitReasons.length > 0) setStep('reason')
                  else handleSubmit()
                }}>
                {visitReasons.length > 0 ? <>Continuar <ChevronRight size={16} className="ml-1" /></> : 'Agendar cita'}
              </Button>
            </div>
          </>
        )}

        {step === 'reason' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Motivo de la cita</h2>
            <p className="text-sm text-gray-500 mb-6">¿En qué podemos ayudarte?</p>
            <div className="flex flex-col gap-3 mb-6">
              {visitReasons.map(r => (
                <button key={r.id} onClick={() => setSelectedReason(r)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedReason?.id === r.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}>
                  <div className="font-medium text-gray-900">{r.name}</div>
                  {r.description && <div className="text-sm text-gray-500 mt-0.5">{r.description}</div>}
                </button>
              ))}
              <button onClick={() => setSelectedReason(null)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedReason === null ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}>
                <div className="font-medium text-gray-900">Otro / Sin especificar</div>
              </button>
            </div>
            <Button size="lg" className="w-full" loading={loading} onClick={handleSubmit}>
              Confirmar cita
            </Button>
            <button onClick={() => setStep('form')} className="w-full text-center text-sm text-gray-400 mt-3 hover:text-gray-600">
              Volver
            </button>
          </>
        )}
      </div>
    </div>
  )
}
