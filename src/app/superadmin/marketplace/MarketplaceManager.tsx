'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Zap, Eye, EyeOff, CheckCircle, Lock, AlertTriangle, ChevronDown, ChevronUp,
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

type PricingDraft = {
  price_monthly: string
  price_per_user: boolean
  price_per_user_amount: string
  trial_days: string
}

export function MarketplaceManager({ modules: initialModules }: Props) {
  const [modules, setModules] = useState<MarketplaceModule[]>(initialModules)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [expandedPricing, setExpandedPricing] = useState<string | null>(null)
  const [pricingDrafts, setPricingDrafts] = useState<Record<string, PricingDraft>>({})

  function getPricingDraft(mod: MarketplaceModule): PricingDraft {
    return pricingDrafts[mod.module_key] ?? {
      price_monthly: String(mod.price_monthly ?? 0),
      price_per_user: mod.price_per_user ?? false,
      price_per_user_amount: String(mod.price_per_user_amount ?? 0),
      trial_days: String(mod.trial_days ?? 7),
    }
  }

  function updateDraft(moduleKey: string, patch: Partial<PricingDraft>) {
    setPricingDrafts(prev => ({
      ...prev,
      [moduleKey]: { ...getPricingDraft(modules.find(m => m.module_key === moduleKey)!), ...prev[moduleKey], ...patch },
    }))
  }

  async function savePricing(mod: MarketplaceModule) {
    const draft = getPricingDraft(mod)
    setSaving(mod.module_key + '_price')
    setError('')
    const supabase = createClient()
    const update = {
      price_monthly: parseFloat(draft.price_monthly) || 0,
      price_per_user: draft.price_per_user,
      price_per_user_amount: parseFloat(draft.price_per_user_amount) || 0,
      trial_days: parseInt(draft.trial_days) || 7,
    }
    const { error: err } = await supabase
      .from('marketplace_modules')
      .update(update)
      .eq('module_key', mod.module_key)
    setSaving(null)
    if (err) { setError(err.message); return }
    setModules(ms => ms.map(m => m.module_key === mod.module_key ? { ...m, ...update } : m))
    setExpandedPricing(null)
  }

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
          const isSavingPrice = saving === mod.module_key + '_price'
          const isPricingOpen = expandedPricing === mod.module_key
          const draft = getPricingDraft(mod)

          return (
            <div
              key={mod.module_key}
              className={`bg-white rounded-xl border transition-all ${
                mod.is_visible_to_brands ? 'border-green-200' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
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
                    ${mod.price_monthly ?? 0}/mes
                    {mod.price_per_user && ` + $${mod.price_per_user_amount ?? 0}/usuario`}
                    {` · trial ${mod.trial_days ?? 7} días`}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Pricing toggle */}
                  <button
                    onClick={() => setExpandedPricing(isPricingOpen ? null : mod.module_key)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Precio {isPricingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

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

              {/* Pricing editor (expandable) */}
              {isPricingOpen && (
                <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 rounded-b-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Configuración de precio</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Precio mensual ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.price_monthly}
                        onChange={e => updateDraft(mod.module_key, { price_monthly: e.target.value })}
                        className="w-full h-8 rounded-lg border border-gray-300 px-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Días de trial</label>
                      <input
                        type="number"
                        min="0"
                        value={draft.trial_days}
                        onChange={e => updateDraft(mod.module_key, { trial_days: e.target.value })}
                        className="w-full h-8 rounded-lg border border-gray-300 px-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 cursor-pointer pb-1">
                        <input
                          type="checkbox"
                          checked={draft.price_per_user}
                          onChange={e => updateDraft(mod.module_key, { price_per_user: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-gray-600">Cobro por usuario</span>
                      </label>
                    </div>
                    {draft.price_per_user && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">$/usuario/mes</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.price_per_user_amount}
                          onChange={e => updateDraft(mod.module_key, { price_per_user_amount: e.target.value })}
                          className="w-full h-8 rounded-lg border border-gray-300 px-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => savePricing(mod)}
                      disabled={isSavingPrice}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors ${isSavingPrice ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isSavingPrice ? 'Guardando…' : 'Guardar precio'}
                    </button>
                    <button
                      onClick={() => setExpandedPricing(null)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
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
