'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Scissors, UtensilsCrossed, Wrench, ShoppingBag, Briefcase, HelpCircle,
  ChevronRight, ChevronLeft, CheckCircle, Loader2, Sparkles,
  User, Package, Users,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'

interface Props {
  brandId: string
  brandName: string
  userName: string
}

const BUSINESS_TYPES = [
  {
    key: 'belleza',
    label: 'Belleza',
    description: 'Peluquería, barbería, uñas, estética',
    icon: Scissors,
    color: 'bg-pink-500',
    light: 'bg-pink-50 border-pink-200 text-pink-700',
  },
  {
    key: 'restaurante',
    label: 'Restaurante / Cafetería',
    description: 'Comidas rápidas, cafetería, catering',
    icon: UtensilsCrossed,
    color: 'bg-orange-500',
    light: 'bg-orange-50 border-orange-200 text-orange-700',
  },
  {
    key: 'ferreteria',
    label: 'Ferretería / Taller',
    description: 'Repuestos, mantenimiento, reparaciones',
    icon: Wrench,
    color: 'bg-yellow-600',
    light: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  },
  {
    key: 'tienda',
    label: 'Tienda / Comercio',
    description: 'Ropa, accesorios, mascotas, papelería',
    icon: ShoppingBag,
    color: 'bg-indigo-500',
    light: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  {
    key: 'servicios',
    label: 'Servicios profesionales',
    description: 'Asesoría, salud, educación, transporte',
    icon: Briefcase,
    color: 'bg-emerald-500',
    light: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    key: 'otros',
    label: 'Otro tipo de negocio',
    description: 'Mi negocio no está en la lista',
    icon: HelpCircle,
    color: 'bg-gray-400',
    light: 'bg-gray-50 border-gray-200 text-gray-600',
  },
]

// Vocabulary adapts by business type
const VOCAB: Record<string, { service: string; client: string; agenda: string; product: string }> = {
  belleza:     { service: 'servicio', client: 'clienta', agenda: 'cita', product: 'producto' },
  restaurante: { service: 'plato', client: 'cliente', agenda: 'pedido', product: 'ingrediente' },
  ferreteria:  { service: 'trabajo', client: 'cliente', agenda: 'orden', product: 'producto' },
  tienda:      { service: 'producto', client: 'cliente', agenda: 'venta', product: 'artículo' },
  servicios:   { service: 'servicio', client: 'cliente', agenda: 'cita', product: 'servicio' },
  otros:       { service: 'servicio', client: 'cliente', agenda: 'pedido', product: 'producto' },
}

export function OnboardingWizard({ brandId, brandName, userName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form state
  const [businessType, setBusinessType] = useState('')
  const [tagline, setTagline] = useState('')
  const [firstClientName, setFirstClientName] = useState('')
  const [firstClientPhone, setFirstClientPhone] = useState('')
  const [firstProductName, setFirstProductName] = useState('')
  const [firstProductPrice, setFirstProductPrice] = useState('')

  const v = VOCAB[businessType] || VOCAB.otros
  const selectedType = BUSINESS_TYPES.find(b => b.key === businessType)

  const steps = [
    { label: 'Tipo de negocio' },
    { label: 'Tu primer cliente' },
    { label: 'Tu primer producto' },
    { label: '¡Listo!' },
  ]

  async function handleFinish() {
    setSaving(true)
    const supabase = createClient()

    // Save business type & tagline to brand
    await supabase.from('brands').update({
      business_type: businessType || 'otros',
      tagline: tagline || null,
      onboarding_completed: true,
    }).eq('id', brandId)

    // Create first customer if provided
    if (firstClientName.trim()) {
      await supabase.from('customers').insert({
        brand_id: brandId,
        name: firstClientName.trim(),
        phone: firstClientPhone.trim() || null,
        canal_contacto: 'WhatsApp',
      }).select().single()
    }

    // Create first product if provided
    if (firstProductName.trim()) {
      const price = parseFloat(firstProductPrice) || 0
      await supabase.from('products').insert({
        brand_id: brandId,
        name: firstProductName.trim(),
        price,
        unit: v.service === 'producto' ? 'unidad' : 'servicio',
        stock: 0,
        product_type: ['ferreteria', 'tienda'].includes(businessType) ? 'physical' : 'service',
      })
    }

    setSaving(false)
    router.push('/admin/home')
  }

  const firstName = userName.split(' ')[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <TurnFlowLogo size={32} />
          <span className="font-bold text-gray-900 text-xl tracking-tight">TurnFlow</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < step ? 'bg-emerald-500' : i === step ? 'bg-indigo-600 w-8' : 'bg-gray-200'
              }`} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Step 0: Tipo de negocio ── */}
          {step === 0 && (
            <div className="p-7">
              <p className="text-sm text-indigo-600 font-semibold mb-1">Hola {firstName} 👋</p>
              <h1 className="text-2xl font-black text-gray-900 mb-1">¿Qué tipo de negocio tienes?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Así adaptamos la app para que hable tu idioma
              </p>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(bt => {
                  const Icon = bt.icon
                  const selected = businessType === bt.key
                  return (
                    <button
                      key={bt.key}
                      onClick={() => setBusinessType(bt.key)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 ${bt.color} rounded-lg flex items-center justify-center`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{bt.label}</p>
                        <p className="text-xs text-gray-400 leading-snug">{bt.description}</p>
                      </div>
                      {selected && <CheckCircle size={14} className="text-indigo-500 self-end" />}
                    </button>
                  )
                })}
              </div>

              {businessType && (
                <div className="mt-5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    ¿Cómo le presentas tu negocio a los clientes? (opcional)
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={`Ej: "Las mejores uñas del norte de Bogotá"`}
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    maxLength={100}
                  />
                </div>
              )}

              <button
                onClick={() => setStep(1)}
                disabled={!businessType}
                className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 1: Primer cliente ── */}
          {step === 1 && (
            <div className="p-7">
              <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
                <ChevronLeft size={14} /> Volver
              </button>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <Users size={22} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Tu primer {v.client}</h1>
              <p className="text-sm text-gray-500 mb-6">
                Agrega a alguien que ya te compra. Después puedes agregar más desde el módulo de Clientes.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nombre
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={`Nombre del ${v.client}`}
                    value={firstClientName}
                    onChange={e => setFirstClientName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    WhatsApp / Celular (opcional)
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="3001234567"
                    value={firstClientPhone}
                    onChange={e => setFirstClientPhone(e.target.value)}
                    type="tel"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50"
                >
                  Saltar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Primer producto/servicio ── */}
          {step === 2 && (
            <div className="p-7">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
                <ChevronLeft size={14} /> Volver
              </button>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <Package size={22} className="text-indigo-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Tu primer {v.product}</h1>
              <p className="text-sm text-gray-500 mb-6">
                Agrega lo que más vendes. Puedes agregar más desde Inventario.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Nombre del {v.service}
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={
                      businessType === 'belleza' ? 'Ej: Manicure semipermanente' :
                      businessType === 'restaurante' ? 'Ej: Corriente del día' :
                      businessType === 'ferreteria' ? 'Ej: Tornillos 3/8" (caja 100)' :
                      'Ej: Mi producto principal'
                    }
                    value={firstProductName}
                    onChange={e => setFirstProductName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Precio de venta (COP)
                  </label>
                  <input
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej: 45000"
                    value={firstProductPrice}
                    onChange={e => setFirstProductPrice(e.target.value.replace(/\D/, ''))}
                    type="number"
                    min={0}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50"
                >
                  Saltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Listo ── */}
          {step === 3 && (
            <div className="p-7 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">
                ¡{brandName} está listo!
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Tu negocio ya tiene su espacio organizado. Cada día la app te va a decir
                a qué clientes contactar, qué productos reponer y qué acciones tomar.
              </p>

              {selectedType && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-6 ${selectedType.light}`}>
                  {(() => { const Icon = selectedType.icon; return <Icon size={12} /> })()}
                  {selectedType.label}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Lo que puedes hacer hoy
                </p>
                {[
                  `Agregar más ${v.client}s en el módulo de Clientes`,
                  `Registrar tu primera ${v.agenda} o venta`,
                  'Ver el inventario y agregar más productos',
                  'Explorar el asistente de mensajes con IA',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {saving ? 'Configurando...' : 'Ir a mi panel'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Puedes cambiar todo esto después en Configuración
        </p>
      </div>
    </div>
  )
}
