'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Establishment, VisitReason, Promotion } from '@/types/database'
import { ChevronRight, CheckCircle, Clock, Tag, ChevronDown, Bell } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useT } from '@/lib/i18n/context'

const CONSENT_TEXT_DEFAULT = `Al proporcionar sus datos personales, usted autoriza el tratamiento de los mismos conforme a nuestra Política de Privacidad y Tratamiento de Datos Personales. Sus datos serán utilizados para: (1) gestionar su turno de atención, (2) brindarle el servicio solicitado, y (3) enviarle información comercial si usted así lo autoriza. Tiene derecho a conocer, actualizar, rectificar y suprimir sus datos. Puede ejercer estos derechos contactándonos. Esta autorización es válida indefinidamente hasta que usted solicite su revocación.`

type Step = 'promo' | 'form' | 'reason' | 'confirm'

interface Props {
  establishment: Establishment & { brands: { name: string; logo_url: string | null; data_policy_text: string | null; form_fields: any[] | null } }
  visitReasons: VisitReason[]
  promotions: Promotion[]
}

export function CustomerFlow({ establishment, visitReasons, promotions }: Props) {
  const { t } = useT()
  const [step, setStep] = useState<Step>(promotions.length > 0 ? 'promo' : 'form')
  const [promoIndex, setPromoIndex] = useState(0)
  const [form, setForm] = useState({ name: '', phoneCode: '+57', phone: '', email: '', marketing_opt_in: false, data_consent: false })
  const [selectedReason, setSelectedReason] = useState<VisitReason | null>(null)
  const [ticket, setTicket] = useState<{ queue_number: string; id: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConsentText, setShowConsentText] = useState(false)
  const [notifEnabled, setNotifEnabled] = useState(false)

  const { permission, requestAndGetToken } = usePushNotifications()
  const [pushLoading, setPushLoading] = useState(false)
  const brand = establishment.brands
  const consentText = brand.data_policy_text || CONSENT_TEXT_DEFAULT

  function fullPhone() { return `${form.phoneCode}${form.phone.trim()}` }

  async function savePushToken(supabase: ReturnType<typeof createClient>, ticketId: string) {
    const token = await requestAndGetToken()
    if (!token) return
    await supabase
      .from('tickets')
      .update({ push_subscription: { token, type: 'fcm' } })
      .eq('id', ticketId)
    await supabase
      .from('customers')
      .upsert(
        {
          brand_id: establishment.brand_id,
          email: form.email.trim(),
          name: form.name.trim(),
          phone: form.phone.trim() ? fullPhone() : null,
          fcm_token: token,
          fcm_token_updated_at: new Date().toISOString(),
        },
        { onConflict: 'brand_id,email' }
      )
    setNotifEnabled(true)
  }

  async function handleEnablePush() {
    if (!ticket) return
    setPushLoading(true)
    const supabase = createClient()
    await savePushToken(supabase, ticket.id)
    setPushLoading(false)
  }

  function validateForm() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.phone.trim()) errs.phone = 'El teléfono es requerido'
    if (!form.email.trim()) errs.email = 'El correo electrónico es requerido'
    if (!form.data_consent) errs.data_consent = 'Debes autorizar el tratamiento de datos para continuar'
    const customFields = (establishment.brands as any).form_fields || []
    customFields.forEach((field: any) => {
      if (field.required && !(form as any)[`custom_${field.id}`]?.trim()) {
        errs[`custom_${field.id}`] = `${field.label} es requerido`
      }
    })
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
        customer_phone: form.phone.trim() ? fullPhone() : null,
        customer_email: form.email.trim(),
        marketing_opt_in: form.marketing_opt_in,
        status: 'waiting',
      })
      .select('id, queue_number')
      .single()

    if (!error && data) {
      // Insert data consent record
      await supabase.from('data_consents').insert({
        ticket_id: data.id,
        establishment_id: establishment.id,
        brand_id: establishment.brand_id,
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim() ? fullPhone() : null,
        customer_email: form.email.trim(),
        marketing_opt_in: form.marketing_opt_in,
        data_processing_consent: true,
        consent_text: consentText,
      })

      // Solicitar permiso push y guardar token
      if (permission !== 'denied') {
        await savePushToken(supabase as ReturnType<typeof createClient>, data.id)
      }

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
                {t('form.takeTurn')}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('form.yourData')}</h2>
          <p className="text-sm text-gray-500 mb-6">Completa el formulario para tomar tu turno</p>

          <div className="flex flex-col gap-4">
            <Input
              id="name"
              label={`${t('form.name')} *`}
              placeholder="Juan Pérez"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('form.phone')} *</label>
              <div className="flex gap-2">
                <select
                  value={form.phoneCode}
                  onChange={e => setForm(f => ({ ...f, phoneCode: e.target.value }))}
                  className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
                >
                  {['+57','+1','+52','+54','+56','+51','+58','+593','+595','+598','+502','+503','+504','+505','+506','+507','+509','+34','+44','+49','+33','+55'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="300 123 4567"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="flex-1 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <Input
              id="email"
              label={`${t('form.email')} *`}
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email}
            />
            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={form.marketing_opt_in}
                onChange={e => setForm(f => ({ ...f, marketing_opt_in: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-600">
                {t('form.marketing')} {brand.name}
              </span>
            </label>

            {/* Brand custom fields */}
            {(establishment.brands as any).form_fields?.map((field: any) => {
              const value = (form as any)[`custom_${field.id}`] || ''
              const onChange = (val: string) => setForm(f => ({ ...f, [`custom_${field.id}`]: val } as any))
              if (field.field_type === 'select' && field.options) {
                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? ' *' : ''}</label>
                    <select
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar...</option>
                      {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {(errors as any)[`custom_${field.id}`] && <p className="text-xs text-red-600 mt-1">{(errors as any)[`custom_${field.id}`]}</p>}
                  </div>
                )
              }
              if (field.field_type === 'textarea') {
                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required ? ' *' : ''}</label>
                    <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    {(errors as any)[`custom_${field.id}`] && <p className="text-xs text-red-600 mt-1">{(errors as any)[`custom_${field.id}`]}</p>}
                  </div>
                )
              }
              return (
                <Input
                  key={field.id}
                  label={`${field.label}${field.required ? ' *' : ''}`}
                  type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  error={(errors as any)[`custom_${field.id}`]}
                />
              )
            })}

            {/* Expandable consent section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowConsentText(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-indigo-700 font-medium bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <span>{t('form.policyTitle')}</span>
                <ChevronDown size={16} className={`transition-transform ${showConsentText ? 'rotate-180' : ''}`} />
              </button>
              {showConsentText && (
                <div className="px-4 py-3 text-xs text-gray-600 leading-relaxed bg-white border-t border-gray-200">
                  {consentText}
                </div>
              )}
            </div>

            {/* Required data consent checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.data_consent}
                  onChange={e => setForm(f => ({ ...f, data_consent: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                <span className="text-sm text-gray-700 font-medium">
                  {t('form.dataConsent')} *
                </span>
              </label>
              {errors.data_consent && (
                <p className="text-xs text-red-600 mt-1 ml-7">{errors.data_consent}</p>
              )}
            </div>

            <Button
              size="lg"
              className="w-full mt-2"
              onClick={() => {
                const errs = validateForm()
                if (Object.keys(errs).length > 0) { setErrors(errs); return }
                setStep('reason')
              }}
            >
              {t('form.continue')} <ChevronRight size={16} className="ml-1" />
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

          {/* Sala de espera — funciona en TODOS los navegadores (Safari incluido) */}
          <a
            href={`/espera/${ticket?.id}`}
            className="mt-4 w-full flex items-center justify-center gap-2 text-white text-sm font-medium rounded-xl px-4 py-3 transition-colors"
            style={{ backgroundColor: '#6366f1' }}
          >
            <Clock size={14} />
            Ver mi posición en la cola
          </a>

          {notifEnabled ? (
            <div className="mt-2 flex items-center justify-center gap-2 text-green-600 text-xs bg-green-50 rounded-xl px-4 py-2">
              <Bell size={12} />
              <span>También recibirás una notificación push</span>
            </div>
          ) : permission !== 'denied' && (
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 text-indigo-600 text-xs bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-2 transition-colors disabled:opacity-60"
            >
              <Bell size={12} />
              {pushLoading ? 'Activando…' : 'Activar aviso push (opcional)'}
            </button>
          )}

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
