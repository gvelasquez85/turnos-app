'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Eye, EyeOff, CheckCircle, Lock, AlertTriangle,
  CalendarClock, ClipboardList, UtensilsCrossed, LogIn, LogOut, Coffee, UserCheck,
  type LucideIcon,
} from 'lucide-react'
import type { MarketplaceModule } from '@/app/admin/marketplace/MarketplaceClient'

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarClock, ClipboardList, UtensilsCrossed,
  LogIn, LogOut, Coffee, UserCheck, Zap,
}
function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Zap
}

interface Props {
  modules: MarketplaceModule[]
}

export function MarketplaceManager({ modules: initialModules }: Props) {
  const [modules, setModules] = useState<MarketplaceModule[]>(initialModules)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function toggleVisibility(mod: MarketplaceModule) {
    setSaving(mod.module_key)
    setError('')
    const supabase = createClient()
    const next = !mod.is_visible_to_brands
    const { error: err } = await supabase
      .from('marketplace_modules')
      .update({ is_visible_to_brands: next })
      .eq('module_key', mod.module_key)
    setSaving(null)
    if (err) { setError(err.message); return }
    setModules(ms => ms.map(m => m.module_key === mod.module_key ? { ...m, is_visible_to_brands: next } : m))
  }

  async function toggleComingSoon(mod: MarketplaceModule) {
    setSaving(mod.module_key + '_cs')
    setError('')
    const supabase = createClient()
    const next = !mod.is_coming_soon
    const { error: err } = await supabase
      .from('marketplace_modules')
      .update({ is_coming_soon: next })
      .eq('module_key', mod.module_key)
    setSaving(null)
    if (err) { setError(err.message); return }
    setModules(ms => ms.map(m => m.module_key === mod.module_key ? { ...m, is_coming_soon: next } : m))
  }

  const visibleCount = modules.filter(m => m.is_visible_to_brands).length

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Zap size={22} className="text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketplace de módulos</h1>
          <p className="text-sm text-gray-500">
            Controla qué módulos son visibles para las marcas. Solo verán los módulos que habilites aquí.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
          <p className="text-xs text-gray-500 mt-1">Módulos totales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{visibleCount}</p>
          <p className="text-xs text-gray-500 mt-1">Visibles para marcas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{modules.length - visibleCount}</p>
          <p className="text-xs text-gray-500 mt-1">Ocultos / en desarrollo</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Module list */}
      <div className="flex flex-col gap-3">
        {modules.map(mod => {
          const Icon = getIcon(mod.icon ?? '')
          const isSavingThis = saving === mod.module_key
          const isSavingCS = saving === mod.module_key + '_cs'

          return (
            <div
              key={mod.module_key}
              className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                mod.is_visible_to_brands ? 'border-green-200' : 'border-gray-200 opacity-70'
              }`}
            >
              {/* Icon */}
              <div className={`w-11 h-11 ${mod.color ?? 'bg-indigo-500'} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={20} className="text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{mod.label}</span>
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{mod.module_key}</span>
                  {mod.is_visible_to_brands && (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> Visible
                    </span>
                  )}
                  {mod.is_coming_soon && (
                    <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{mod.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  ${mod.price_per_establishment}/sucursal · ${mod.price_per_advisor}/usuario adicional
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Coming soon toggle */}
                <button
                  onClick={() => toggleComingSoon(mod)}
                  disabled={!!saving}
                  title={mod.is_coming_soon ? 'Quitar "Próximamente"' : 'Marcar como Próximamente'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    mod.is_coming_soon
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                  } ${isSavingCS ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {mod.is_coming_soon ? 'Pronto ✓' : 'Pronto'}
                </button>

                {/* Visibility toggle */}
                <button
                  onClick={() => toggleVisibility(mod)}
                  disabled={!!saving}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    mod.is_visible_to_brands
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                  } ${isSavingThis ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {mod.is_visible_to_brands
                    ? <><Eye size={12} /> Visible</>
                    : <><EyeOff size={12} /> Oculto</>
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Los cambios aplican inmediatamente. Las marcas solo ven módulos marcados como "Visible".
      </p>
    </div>
  )
}
