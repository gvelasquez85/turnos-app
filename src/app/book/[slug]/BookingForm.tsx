'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarClock, CheckCircle, ChevronRight, Clock } from 'lucide-react'

interface Props {
  establishment: { id: string; name: string; brand_id: string; brands: { name: string } }
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

  const brand = establishment.brands

  function validateForm() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (!form.scheduled_date) errs.date = 'La fecha es requerida'
    if (!form.scheduled_time) errs.time = 'La hora es requerida'
    // No past dates
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
        duration_minutes: 30,
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

  // Min date: today
  const today = new Date().toISOString().split('T')[0]

  if (step === 'done') {
    const d = new Date(`${form.scheduled_date}T${form.scheduled_time}`)
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-6">
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
              <p className="text-gray-500">Establecimiento: <span className="font-medium text-gray-900">{establishment.name}</span></p>
            </div>
          </div>
          <p className="text-white/50 text-xs mt-6">{brand.name}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-indigo-600 text-white text-center py-6 px-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CalendarClock size={20} />
          <h1 className="text-xl font-bold">{brand.name}</h1>
        </div>
        <p className="text-indigo-200 text-sm">Agenda tu cita en {establishment.name}</p>
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
              <div className="grid grid-cols-2 gap-3">
                <Input label="Fecha *" type="date" min={today} value={form.scheduled_date}
                  onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} error={errors.date} />
                <Input label="Hora *" type="time" value={form.scheduled_time}
                  onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))} error={errors.time} />
              </div>
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
