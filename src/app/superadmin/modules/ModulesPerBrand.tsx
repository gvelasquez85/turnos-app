'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ToggleLeft, ToggleRight, Building2, Shield, Gift, CreditCard } from 'lucide-react'

interface Brand { id: string; name: string; slug: string; active: boolean }
interface Sub {
  id: string
  brand_id: string
  module_key: string
  status: string
  trial_expires_at: string | null
  expires_at: string | null
  granted_by_superadmin: boolean
  created_at: string
}

const ALL_MODULES = [
  { key: 'queue',          label: 'Colas de espera',    color: 'text-indigo-600' },
  { key: 'appointments',   label: 'Citas',               color: 'text-blue-600'   },
  { key: 'surveys',        label: 'Encuestas',           color: 'text-emerald-600' },
  { key: 'menu',           label: 'Menú / Preorden',    color: 'text-orange-600' },
  { key: 'mensajes',       label: 'Mensajes',            color: 'text-pink-600'   },
  { key: 'lead_forms',     label: 'Lead Forms',          color: 'text-cyan-600'   },
  { key: 'contabilidad',   label: 'Contabilidad NIIF',  color: 'text-violet-600' },
  { key: 'facturacion',    label: 'Facturación DIAN',   color: 'text-amber-600'  },
  { key: 'pqrs',           label: 'PQRS',                color: 'text-rose-600'   },
  { key: 'copropiedades',  label: 'Copropiedades',       color: 'text-teal-600'   },
  { key: 'ai_copilot',     label: 'Copilot IA',          color: 'text-purple-600' },
]

interface Props { brands: Brand[]; subscriptions: Sub[] }

export default function ModulesPerBrand({ brands, subscriptions: initialSubs }: Props) {
  const [subs, setSubs] = useState(initialSubs)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = search.trim()
    ? brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase())
      )
    : brands

  function getSub(brandId: string, moduleKey: string): Sub | undefined {
    return subs.find(s => s.brand_id === brandId && s.module_key === moduleKey)
  }

  async function toggleModule(brandId: string, moduleKey: string) {
    const loadingKey = `${brandId}-${moduleKey}`
    setLoading(loadingKey)
    const supabase = createClient()
    const existing = getSub(brandId, moduleKey)

    if (existing) {
      // Deactivate regardless of who activated it
      await supabase
        .from('module_subscriptions')
        .update({ status: 'expired' })
        .eq('id', existing.id)

      const { data: brand } = await supabase
        .from('brands').select('active_modules').eq('id', brandId).single()
      if (brand) {
        const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: false }
        await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      }
      setSubs(prev => prev.filter(s => s.id !== existing.id))
    } else {
      // Activate — always mark granted_by_superadmin = TRUE (never billed)
      const { data } = await supabase
        .from('module_subscriptions')
        .insert({
          brand_id: brandId,
          module_key: moduleKey,
          status: 'active',
          trial_expires_at: null,
          expires_at: null,
          granted_by_superadmin: true,   // ← clave: no se factura
        })
        .select()
        .single()

      const { data: brand } = await supabase
        .from('brands').select('active_modules').eq('id', brandId).single()
      if (brand) {
        const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: true }
        await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      }
      if (data) setSubs(prev => [...prev, data as Sub])
    }
    setLoading(null)
  }

  async function activateAll(brandId: string) {
    setLoading(`all-${brandId}`)
    for (const mod of ALL_MODULES) {
      if (!getSub(brandId, mod.key)) await toggleModule(brandId, mod.key)
    }
    setLoading(null)
  }

  async function deactivateAll(brandId: string) {
    setLoading(`all-${brandId}`)
    for (const mod of ALL_MODULES) {
      if (getSub(brandId, mod.key)) await toggleModule(brandId, mod.key)
    }
    setLoading(null)
  }

  const grantedCount  = (brandId: string) => ALL_MODULES.filter(m => getSub(brandId, m.key)?.granted_by_superadmin).length
  const billedCount   = (brandId: string) => ALL_MODULES.filter(m => {
    const s = getSub(brandId, m.key)
    return s && !s.granted_by_superadmin
  }).length
  const activeCount   = (brandId: string) => ALL_MODULES.filter(m => getSub(brandId, m.key)).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield size={22} className="text-indigo-600" /> Módulos por Marca
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Los módulos activados aquí son <strong>gratuitos</strong> para la marca y no se facturan.
          Los que la marca activa desde el marketplace sí generan cobro.
        </p>
      </div>

      {/* Leyenda de origen */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700">
        <span className="flex items-center gap-1.5">
          <Gift size={12} className="text-indigo-500" />
          <span className="font-semibold text-indigo-600">Superadmin</span> — gratuito, no facturado
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span className="flex items-center gap-1.5">
          <CreditCard size={12} className="text-green-600" />
          <span className="font-semibold text-green-600">Marca</span> — auto-activado, se factura
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Buscar marca..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Brands list */}
      <div className="space-y-3">
        {filtered.map(brand => {
          const granted = grantedCount(brand.id)
          const billed  = billedCount(brand.id)
          const active  = activeCount(brand.id)
          return (
            <div key={brand.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              {/* Brand header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 size={16} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{brand.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                      <span>/{brand.slug}</span>
                      <span>·</span>
                      <span>{active}/{ALL_MODULES.length} activos</span>
                      {granted > 0 && (
                        <span className="flex items-center gap-0.5 text-indigo-500 font-semibold">
                          <Gift size={9} /> {granted} gratis
                        </span>
                      )}
                      {billed > 0 && (
                        <span className="flex items-center gap-0.5 text-green-600 font-semibold">
                          <CreditCard size={9} /> {billed} facturado{billed > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {!brand.active && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">Inactiva</span>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => activateAll(brand.id)} disabled={loading !== null}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-1">
                    <Gift size={9} /> Activar todos gratis
                  </button>
                  <button
                    onClick={() => deactivateAll(brand.id)} disabled={loading !== null}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-50">
                    Desactivar todos
                  </button>
                </div>
              </div>

              {/* Module toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-1.5">
                {ALL_MODULES.map(mod => {
                  const sub = getSub(brand.id, mod.key)
                  const active = !!sub
                  const isGranted = sub?.granted_by_superadmin === true
                  const isBilled  = active && !isGranted
                  const isLoading = loading === `${brand.id}-${mod.key}` || loading === `all-${brand.id}`

                  return (
                    <button
                      key={mod.key}
                      onClick={() => toggleModule(brand.id, mod.key)}
                      disabled={isLoading}
                      title={
                        isGranted ? 'Activado por superadmin — gratis, no facturado'
                        : isBilled ? 'Activado por la marca — se factura mensualmente'
                        : 'Inactivo — click para activar gratis'
                      }
                      className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                        isGranted
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                          : isBilled
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-400'
                      } hover:shadow-sm disabled:opacity-50`}
                    >
                      {/* Origen badge */}
                      {isGranted && (
                        <Gift size={9} className="text-indigo-400 shrink-0" />
                      )}
                      {isBilled && (
                        <CreditCard size={9} className="text-green-500 shrink-0" />
                      )}
                      {!active && (
                        <ToggleLeft size={13} className="text-gray-300 shrink-0" />
                      )}
                      <span className="truncate">{mod.label}</span>

                      {/* Spinner */}
                      {isLoading && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-lg">
                          <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
