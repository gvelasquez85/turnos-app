'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Establishment, VisitReason, Promotion } from '@/types/database'
import { ChevronRight, CheckCircle, Clock, Tag } from 'lucide-react'

type Step = 'promo' | 'form' | 'reason' | 'confirm'

interface Props {
  establishment: Establishment & { brands: { name: string; logo_url: string | null } }
  visitReasons: VisitReason[]
  promotions: Promotion[]
}

export function CustomerFlow({ establishment, visitReasons, promotions }: Props) {
  const [step, setStep] = useState<Step>(promotions.length > 0 ? 'promo' : 'form')
  const [promoIndex, setPromoIndex] = useState(0)
  const [form, setForm] = useState({ name: '', phone: '', email: '', marketing_opt_in: false })
  const [selectedReason, setSelectedReason] = useState<VisitReason | null>(null)
  const [ticket, setTicket] = useState<{ queue_number: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const brand = establishment.brands

  function validateForm() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    return errs
  }

  async function handleSubmit() {
    const errs = validateForm()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (!selectedReason) return
    setLoading(true)
    const supabase = createClient()

    // Obtener número de turno
    const { data: queueNum } = await supabase
      .rpc('get_next_queue_number', { p_establishment_id: establishment.id })

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        establishment_id: establishment.id,
        visit_reason_id: selectedReason.id,
        queue_number: queueNum || '001',
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim() || null,
        customer_email: form.email.trim() || null,
        marketing_opt_in: form.marketing_opt_in,
        status: 'waiting',
      })
      .select('id, queue_number')
      .single()

    if (!error && data) {
      setTicket(data)
      setStep('confirm')
    }
    setLoading(false)
  }

  // STEP: Promotions
  if (step === 'promo') {
    const promo = promotions[promoIndex]
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-3 py-1 rounded-full mb-3">
                <Tag size={12} /> Promoción {promoIndex + 1} de {promotions.length}
              </span>
              <h2 className="text-white text-2xl font-bold">{brand.name}</h2>
              <p className="text-white/70 text-sm">{establishment.name}</p>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {promo.image_url && (
                <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{promo.title}</h3>
                {promo.description && <p className="text-gray-600 text-sm">{promo.description}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {promoIndex < promotions.length - 1 ? (
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => setPromoIndex(i => i + 1)}
                >
                  Siguiente <ChevronRight size={16} />
                </Button>
              ) : null}
              <Button
                className="flex-1 bg-white text-indigo-700 hover:bg-white/90"
                onClick={() => setStep('form')}
              >
                Tomar turno
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // STEP: Customer form
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-indigo-600 text-white text-center py-6 px-4">
          <h1 className="text-xl font-bold">{brand.name}</h1>
          <p className="text-indigo-200 text-sm">{establishment.name}</p>
        </div>
        <div className="flex-1 p-6 max-w-sm mx-auto w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Tus datos</h2>
          <p className="text-sm text-gray-500 mb-6">Completa el formulario para tomar tu turno</p>

          <div className="flex flex-col gap-4">
            <Input
              id="name"
              label="Nombre completo *"
              placeholder="Juan Pérez"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              id="phone"
              label="Teléfono *"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              error={errors.phone}
            />
            <Input
              id="email"
              label="Correo electrónico (opcional)"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.marketing_opt_in}
                onChange={e => setForm(f => ({ ...f, marketing_opt_in: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-600">
                Acepto recibir promociones y novedades de {brand.name}
              </span>
            </label>

            <Button
              size="lg"
              className="w-full mt-2"
              onClick={() => {
                const errs = validateForm()
                if (Object.keys(errs).length > 0) { setErrors(errs); return }
                setStep('reason')
              }}
            >
              Continuar <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // STEP: Select reason
  if (step === 'reason') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-indigo-600 text-white text-center py-6 px-4">
          <h1 className="text-xl font-bold">{brand.name}</h1>
          <p className="text-indigo-200 text-sm">{establishment.name}</p>
        </div>
        <div className="flex-1 p-6 max-w-sm mx-auto w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">¿En qué te podemos ayudar?</h2>
          <p className="text-sm text-gray-500 mb-6">Selecciona el motivo de tu visita</p>

          <div className="flex flex-col gap-3">
            {visitReasons.map(reason => (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedReason?.id === reason.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="font-medium text-gray-900">{reason.name}</div>
                {reason.description && (
                  <div className="text-sm text-gray-500 mt-0.5">{reason.description}</div>
                )}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full mt-6"
            disabled={!selectedReason}
            loading={loading}
            onClick={handleSubmit}
          >
            Confirmar turno
          </Button>
        </div>
      </div>
    )
  }

  // STEP: Confirmation
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <CheckCircle size={64} className="text-white mx-auto mb-4" />
        <h1 className="text-white text-2xl font-bold mb-1">¡Turno registrado!</h1>
        <p className="text-white/70 mb-8">Te atenderemos en breve</p>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <p className="text-gray-500 text-sm mb-2">Tu número de turno</p>
          <div className="text-6xl font-black text-indigo-600 mb-4">{ticket?.queue_number}</div>
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <Clock size={16} />
            <span>Por favor espera a ser llamado</span>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-left">
            <p className="text-xs text-gray-500">Motivo: <span className="font-medium text-gray-700">{selectedReason?.name}</span></p>
            <p className="text-xs text-gray-500 mt-1">Nombre: <span className="font-medium text-gray-700">{form.name}</span></p>
          </div>
        </div>

        <p className="text-white/50 text-xs mt-6">{brand.name} · {establishment.name}</p>
      </div>
    </div>
  )
}
