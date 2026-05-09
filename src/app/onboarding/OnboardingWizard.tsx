'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Scissors, UtensilsCrossed, Wrench, ShoppingBag, Briefcase, HelpCircle,
  ChevronRight, ChevronLeft, CheckCircle, Loader2, Sparkles,
  Package, Users, Building2,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'

interface Props {
  userId: string
  brandId: string | null   // null = brand not yet created
  userName: string
}

const BUSINESS_TYPES = [
  { key: 'belleza',     label: 'Belleza',                  description: 'Peluquería, barbería, uñas, estética',         icon: Scissors,        color: 'bg-pink-500',    light: 'bg-pink-50 border-pink-200 text-pink-700' },
  { key: 'restaurante', label: 'Restaurante / Cafetería',  description: 'Comidas rápidas, cafetería, catering',          icon: UtensilsCrossed, color: 'bg-orange-500',  light: 'bg-orange-50 border-orange-200 text-orange-700' },
  { key: 'ferreteria',  label: 'Ferretería / Taller',       description: 'Repuestos, mantenimiento, reparaciones',        icon: Wrench,          color: 'bg-yellow-600',  light: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { key: 'tienda',      label: 'Tienda / Comercio',         description: 'Ropa, accesorios, mascotas, papelería',         icon: ShoppingBag,     color: 'bg-indigo-500',  light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { key: 'servicios',   label: 'Servicios profesionales',   description: 'Asesoría, salud, educación, transporte',        icon: Briefcase,       color: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'otros',       label: 'Otro tipo de negocio',      description: 'Mi negocio no está en la lista',               icon: HelpCircle,      color: 'bg-gray-400',    light: 'bg-gray-50 border-gray-200 text-gray-600' },
]

const VOCAB: Record<string, { service: string; client: string; agenda: string; product: string; clients: string }> = {
  belleza:     { service: 'servicio', client: 'clienta',  agenda: 'cita',    product: 'producto',     clients: 'clientas' },
  restaurante: { service: 'plato',    client: 'cliente',  agenda: 'pedido',  product: 'ingrediente',  clients: 'clientes' },
  ferreteria:  { service: 'trabajo',  client: 'cliente',  agenda: 'orden',   product: 'producto',     clients: 'clientes' },
  tienda:      { service: 'producto', client: 'cliente',  agenda: 'venta',   product: 'artículo',     clients: 'clientes' },
  servicios:   { service: 'servicio', client: 'cliente',  agenda: 'cita',    product: 'servicio',     clients: 'clientes' },
  otros:       { service: 'servicio', client: 'cliente',  agenda: 'pedido',  product: 'producto',     clients: 'clientes' },
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'mi-negocio'
}

export function OnboardingWizard({ userId, brandId: initialBrandId, userName }: Props) {
  const router = useRouter()
  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  // Resolved brand id (set after step 0 when brand didn't exist)
  const [resolvedBrandId, setResolvedBrandId] = useState<string | null>(initialBrandId)

  // Step 0 — nombre del negocio (only shown when no brand yet)
  const needsName = !initialBrandId
  const [brandName, setBrandName] = useState('')

  // Step 1 — tipo de negocio
  const [businessType, setBusinessType] = useState('')
  const [tagline, setTagline] = useState('')

  // Step 2 — primer cliente
  const [firstClientName, setFirstClientName]   = useState('')
  const [firstClientPhone, setFirstClientPhone] = useState('')

  // Step 3 — primer producto
  const [firstProductName, setFirstProductName]   = useState('')
  const [firstProductPrice, setFirstProductPrice] = useState('')

  const v            = VOCAB[businessType] || VOCAB.otros
  const selectedType = BUSINESS_TYPES.find(b => b.key === businessType)
  const firstName    = userName.split(' ')[0]

  // Total steps differ if brand already exists
  const totalSteps = needsName ? 5 : 4  // +1 for name step
  const stepOffset  = needsName ? 1 : 0  // visual step 0 = name when needed

  // ── Step 0: Create brand (only when no brand_id) ─────────────────────────
  async function handleCreateBrand() {
    if (!brandName.trim()) return
    setSaving(true)
    setError('')
    const supabase = createClient()

    const slug = generateSlug(brandName.trim())

    // Create brand
    const { data: brand, error: brandErr } = await supabase
      .from('brands')
      .insert({
        name: brandName.trim(),
        slug,
        active: true,
        country: 'Colombia',
        active_modules: {
          queue: false, appointments: false, surveys: false,
          menu: false, display: false, mensajes: false,
        },
        onboarding_completed: false,
      })
      .select('id')
      .single()

    if (brandErr || !brand) {
      // Slug conflict — append random suffix and retry
      const { data: brand2, error: err2 } = await supabase
        .from('brands')
        .insert({
          name: brandName.trim(),
          slug: `${slug}-${Math.floor(Math.random() * 9000) + 1000}`,
          active: true,
          country: 'Colombia',
          active_modules: { queue: false, appointments: false, surveys: false, menu: false, display: false, mensajes: false },
          onboarding_completed: false,
        })
        .select('id')
        .single()

      if (err2 || !brand2) {
        setError('No se pudo crear el negocio. Intenta de nuevo.')
        setSaving(false)
        return
      }
      setResolvedBrandId(brand2.id)
      // Link brand to profile
      await supabase.from('profiles').update({ brand_id: brand2.id }).eq('id', userId)
      // Create free membership
      await supabase.from('memberships').insert({ brand_id: brand2.id, plan: 'free', status: 'active', max_establishments: 1, max_advisors: 1, billing_anchor_day: new Date().getDate() })
    } else {
      setResolvedBrandId(brand.id)
      await supabase.from('profiles').update({ brand_id: brand.id }).eq('id', userId)
      await supabase.from('memberships').insert({ brand_id: brand.id, plan: 'free', status: 'active', max_establishments: 1, max_advisors: 1, billing_anchor_day: new Date().getDate() })
    }

    setSaving(false)
    setStep(1)
  }

  // ── Final step: save everything ───────────────────────────────────────────
  async function handleFinish() {
    if (!resolvedBrandId) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('brands').update({
      business_type: businessType || 'otros',
      tagline: tagline || null,
      onboarding_completed: true,
    }).eq('id', resolvedBrandId)

    if (firstClientName.trim()) {
      await supabase.from('customers').insert({
        brand_id: resolvedBrandId,
        name: firstClientName.trim(),
        phone: firstClientPhone.trim() || null,
        canal_contacto: 'WhatsApp',
      })
    }

    if (firstProductName.trim()) {
      const price = parseFloat(firstProductPrice) || 0
      await supabase.from('products').insert({
        brand_id: resolvedBrandId,
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

  // Step indices when needsName=true: 0=name, 1=type, 2=client, 3=product, 4=done
  // Step indices when needsName=false: 0=type, 1=client, 2=product, 3=done
  const STEPS_WITH_NAME    = ['Tu negocio', 'Tipo de negocio', 'Tu primer cliente', 'Tu primer producto', '¡Listo!']
  const STEPS_WITHOUT_NAME = ['Tipo de negocio', 'Tu primer cliente', 'Tu primer producto', '¡Listo!']
  const steps = needsName ? STEPS_WITH_NAME : STEPS_WITHOUT_NAME

  // Logical step for rendering when needsName=false (step is already offset-free)
  const renderStep = needsName ? step : step

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
          {steps.map((_, i) => (
            <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${
              i < step ? 'w-2.5 bg-emerald-500' : i === step ? 'w-8 bg-indigo-600' : 'w-2.5 bg-gray-200'
            }`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Step 0 (when needsName): Nombre del negocio ───────────────── */}
          {needsName && step === 0 && (
            <div className="p-7">
              <p className="text-sm text-indigo-600 font-semibold mb-1">Hola {firstName} 👋</p>
              <h1 className="text-2xl font-black text-gray-900 mb-1">¿Cómo se llama tu negocio?</h1>
              <p className="text-sm text-gray-500 mb-6">
                Este será el nombre que verán tus clientes
              </p>
              <div className="relative mb-2">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder='Ej: Peluquería Moderna, Tienda La 15...'
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && brandName.trim()) handleCreateBrand() }}
                  maxLength={60}
                />
              </div>
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <button
                onClick={handleCreateBrand}
                disabled={!brandName.trim() || saving}
                className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <ChevronRight size={16} />}
                {saving ? 'Creando...' : 'Continuar'}
              </button>
            </div>
          )}

          {/* ── Tipo de negocio ───────────────────────────────────────────── */}
          {(needsName ? step === 1 : step === 0) && (
            <div className="p-7">
              {needsName && (
                <button onClick={() => setStep(0)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
                  <ChevronLeft size={14} /> Volver
                </button>
              )}
              <h1 className="text-2xl font-black text-gray-900 mb-1">¿Qué tipo de negocio tienes?</h1>
              <p className="text-sm text-gray-500 mb-6">Así adaptamos la app para que hable tu idioma</p>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(bt => {
                  const Icon = bt.icon
                  const selected = businessType === bt.key
                  return (
                    <button key={bt.key} onClick={() => setBusinessType(bt.key)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        selected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}>
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
                    ¿Cómo describes tu negocio a los clientes? (opcional)
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
                onClick={() => setStep(s => s + 1)}
                disabled={!businessType}
                className="mt-6 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                Continuar <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ── Primer cliente ────────────────────────────────────────────── */}
          {(needsName ? step === 2 : step === 1) && (
            <div className="p-7">
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
                <ChevronLeft size={14} /> Volver
              </button>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <Users size={22} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Tu primer {v.client}</h1>
              <p className="text-sm text-gray-500 mb-6">
                Agrega a alguien que ya te compra. Después puedes agregar más desde Clientes.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                  <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={`Nombre del ${v.client}`} value={firstClientName}
                    onChange={e => setFirstClientName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">WhatsApp / Celular (opcional)</label>
                  <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="3001234567" value={firstClientPhone}
                    onChange={e => setFirstClientPhone(e.target.value)} type="tel" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50">
                  Saltar
                </button>
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Primer producto ───────────────────────────────────────────── */}
          {(needsName ? step === 3 : step === 2) && (
            <div className="p-7">
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4">
                <ChevronLeft size={14} /> Volver
              </button>
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <Package size={22} className="text-indigo-600" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-1">Tu primer {v.product}</h1>
              <p className="text-sm text-gray-500 mb-6">Agrega lo que más vendes. Puedes agregar más después.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del {v.service}</label>
                  <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={businessType === 'belleza' ? 'Ej: Manicure semipermanente' : businessType === 'restaurante' ? 'Ej: Corriente del día' : 'Ej: Mi producto principal'}
                    value={firstProductName} onChange={e => setFirstProductName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Precio de venta (COP)</label>
                  <input className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Ej: 45000" value={firstProductPrice}
                    onChange={e => setFirstProductPrice(e.target.value.replace(/\D/, ''))}
                    type="number" min={0} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50">
                  Saltar
                </button>
                <button onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2">
                  Continuar <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── ¡Listo! ───────────────────────────────────────────────────── */}
          {(needsName ? step === 4 : step === 3) && (
            <div className="p-7 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-2">
                ¡Todo listo{brandName ? `, ${brandName}` : ''}!
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Tu negocio ya tiene su espacio organizado. Cada día la app te dirá
                a qué clientes contactar y qué acciones tomar.
              </p>
              {selectedType && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-6 ${selectedType.light}`}>
                  {(() => { const Icon = selectedType.icon; return <Icon size={12} /> })()}
                  {selectedType.label}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lo que puedes hacer hoy</p>
                {[
                  `Agregar más ${v.clients} en el módulo de Clientes`,
                  `Registrar tu primera ${v.agenda} o venta`,
                  'Ver el inventario y agregar más productos',
                  'Explorar el marketplace de módulos adicionales',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <button onClick={handleFinish} disabled={saving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-bold text-sm hover:opacity-90 flex items-center justify-center gap-2 transition-opacity disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {saving ? 'Configurando...' : 'Ir a mi panel →'}
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
