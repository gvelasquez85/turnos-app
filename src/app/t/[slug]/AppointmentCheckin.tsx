'use client'

import { useState } from 'react'
import { CheckCircle, CalendarCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  establishment: { id: string; name: string; brands: { name: string } }
  onBack: () => void
}

type Step = 'search' | 'found' | 'done'

export default function AppointmentCheckin({ establishment, onBack }: Props) {
  const [step, setStep] = useState<Step>('search')
  const [phone, setPhone] = useState('')
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch() {
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data } = await supabase
        .from('appointments')
        .select('*, visit_reasons(name)')
        .eq('establishment_id', establishment.id)
        .eq('customer_phone', phone.trim())
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at')

      if (data && data.length > 0) {
        setAppointments(data)
        setStep('found')
      } else {
        setError('No encontramos citas para este teléfono hoy')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(appointment: any) {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase
        .from('appointments')
        .update({ status: 'attended' })
        .eq('id', appointment.id)
      setSelectedAppointment(appointment)
      setStep('done')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 py-10 text-center text-white">
        <p className="text-lg font-medium opacity-80">{establishment.brands.name}</p>
        <h1 className="text-3xl font-bold mt-1">{establishment.name}</h1>
      </div>

      <div className="max-w-sm mx-auto p-6 flex flex-col gap-4 mt-4 w-full flex-1">
        {/* Step: search */}
        {step === 'search' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Cumplir mi cita</h2>
                <p className="text-sm text-gray-500">Ingresa tu número de teléfono</p>
              </div>
            </div>

            <Input
              type="tel"
              placeholder="Número de teléfono"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button onClick={handleSearch} disabled={loading || !phone.trim()} className="w-full">
              {loading ? 'Buscando...' : 'Buscar mi cita'}
            </Button>
          </div>
        )}

        {/* Step: found */}
        {step === 'found' && (
          <div className="flex flex-col gap-3">
            <h2 className="font-bold text-gray-900 text-lg">
              {appointments.length === 1 ? 'Cita encontrada' : 'Citas encontradas'}
            </h2>
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-900 text-base">
                      {new Date(appt.scheduled_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {appt.visit_reasons?.name && (
                      <p className="text-sm text-gray-500 mt-0.5">{appt.visit_reasons.name}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                      appt.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {appt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>
                <Button
                  onClick={() => handleConfirm(appt)}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Procesando...' : 'Confirmar llegada'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Step: done */}
        {step === 'done' && selectedAppointment && (
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">¡Bienvenido!</h2>
              <p className="text-gray-500 mt-1">Tu llegada ha sido registrada</p>
            </div>
            <div className="bg-white border-2 border-green-100 rounded-2xl p-4 w-full text-left">
              <p className="text-sm text-gray-500">Hora de tu cita</p>
              <p className="font-bold text-gray-900 mt-0.5">
                {new Date(selectedAppointment.scheduled_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {selectedAppointment.visit_reasons?.name && (
                <>
                  <p className="text-sm text-gray-500 mt-3">Motivo</p>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedAppointment.visit_reasons.name}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="mt-auto pt-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  )
}
