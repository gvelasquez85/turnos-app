'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, ToggleLeft, ToggleRight, Building2, Zap, Shield } from 'lucide-react'

interface Brand { id: string; name: string; slug: string; active: boolean }
interface Sub { id: string; brand_id: string; module_key: string; status: string; trial_expires_at: string | null; expires_at: string | null; created_at: string }

const ALL_MODULES = [
  { key: 'queue', label: 'Colas de espera', color: 'text-indigo-600' },
  { key: 'appointments', label: 'Citas', color: 'text-blue-600' },
  { key: 'surveys', label: 'Encuestas', color: 'text-emerald-600' },
  { key: 'menu', label: 'Menú / Preorden', color: 'text-orange-600' },
  { key: 'mensajes', label: 'Mensajes', color: 'text-pink-600' },
  { key: 'lead_forms', label: 'Lead Forms', color: 'text-cyan-600' },
  { key: 'contabilidad', label: 'Contabilidad NIIF', color: 'text-violet-600' },
  { key: 'facturacion', label: 'Facturación DIAN', color: 'text-amber-600' },
  { key: 'pqrs', label: 'PQRS', color: 'text-rose-600' },
  { key: 'copropiedades', label: 'Copropiedades', color: 'text-teal-600' },
]

interface Props { brands: Brand[]; subscriptions: Sub[] }

export default function ModulesPerBrand({ brands, subscriptions: initialSubs }: Props) {
  const [subs, setSubs] = useState(initialSubs)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filtered = search.trim()
    ? brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.slug.toLowerCase().includes(search.toLowerCase()))
    : brands

  function getModuleStatus(brandId: string, moduleKey: string): Sub | undefined {
    return subs.find(s => s.brand_id === brandId && s.module_key === moduleKey)
  }

  async function toggleModule(brandId: string, moduleKey: string) {
    const loadingKey = `${brandId}-${moduleKey}`
    setLoading(loadingKey)
    const supabase = createClient()
    const existing = getModuleStatus(brandId, moduleKey)

    if (existing) {
      // Deactivate: set status to expired
      await supabase.from('module_subscriptions').update({ status: 'expired' }).eq('id', existing.id)
      // Also update brands.active_modules
      const { data: brand } = await supabase.from('brands').select('active_modules').eq('id', brandId).single()
      if (brand) {
        const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: false }
        await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      }
      setSubs(prev => prev.filter(s => s.id !== existing.id))
    } else {
      // Activate: insert with status='active' and no expiry (free grant by superadmin)
      const { data } = await supabase.from('module_subscriptions').insert({
        brand_id: brandId,
        module_key: moduleKey,
        status: 'active',
        trial_expires_at: null,
        expires_at: null,
      }).select().single()
      // Also update brands.active_modules
      const { data: brand } = await supabase.from('brands').select('active_modules').eq('id', brandId).single()
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
      if (!getModuleStatus(brandId, mod.key)) {
        await toggleModule(brandId, mod.key)
      }
    }
    setLoading(null)
  }

  async function deactivateAll(brandId: string) {
    setLoading(`all-${brandId}`)
    for (const mod of ALL_MODULES) {
      if (getModuleStatus(brandId, mod.key)) {
        await toggleModule(brandId, mod.key)
      }
    }
    setLoading(null)
  }

  const activeCount = (brandId: string) => ALL_MODULES.filter(m => getModuleStatus(brandId, m.key)).length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Shield size={22} className="text-indigo-600" /> Módulos por Marca
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Activa o desactiva módulos gratuitamente para cualquier marca
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar marca..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Module legend */}
      <div className="flex flex-wrap gap-2">
        {ALL_MODULES.map(m => (
          <span key={m.key} className={`text-[10px] font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 ${m.color}`}>
            {m.label}
          </span>
        ))}
      </div>

      {/* Brands list */}
      <div className="space-y-3">
        {filtered.map(brand => {
          const count = activeCount(brand.id)
          return (
            <div key={brand.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{brand.name}</p>
                    <p className="text-[10px] text-gray-400">/{brand.slug} · {count}/{ALL_MODULES.length} módulos activos</p>
                  </div>
                  {!brand.active && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactiva</span>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => activateAll(brand.id)} disabled={loading !== null}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 disabled:opacity-50">
                    Activar todos
                  </button>
                  <button onClick={() => deactivateAll(brand.id)} disabled={loading !== null}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 disabled:opacity-50">
                    Desactivar todos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {ALL_MODULES.map(mod => {
                  const active = !!getModuleStatus(brand.id, mod.key)
                  const isLoading = loading === `${brand.id}-${mod.key}` || loading === `all-${brand.id}`
                  return (
                    <button key={mod.key} onClick={() => toggleModule(brand.id, mod.key)} disabled={isLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all border ${
                        active
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-400'
                      } hover:shadow-sm disabled:opacity-50`}>
                      {active
                        ? <ToggleRight size={14} className="text-green-600 shrink-0" />
                        : <ToggleLeft size={14} className="text-gray-300 shrink-0" />
                      }
                      <span className="truncate">{mod.label}</span>
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
