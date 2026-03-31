'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ExternalLink, Monitor } from 'lucide-react'

interface Brand { id: string; name: string }
interface Establishment { id: string; name: string; slug: string; brand_id: string }
interface DisplayConfigRow {
  id?: string
  establishment_id: string
  bg_color: string
  accent_color: string
  show_waiting_list: boolean
  show_promotions: boolean
  show_clock: boolean
  custom_message: string | null
}

interface Props {
  brands: Brand[]
  establishments: Establishment[]
  displayConfigs: DisplayConfigRow[]
  defaultBrandId: string | null
}

const DEFAULT_CONFIG: Omit<DisplayConfigRow, 'establishment_id'> = {
  bg_color: '#1e1b4b',
  accent_color: '#6366f1',
  show_waiting_list: true,
  show_promotions: true,
  show_clock: true,
  custom_message: null,
}

export function DisplayConfig({ brands, establishments, displayConfigs, defaultBrandId }: Props) {
  const [selectedBrand, setSelectedBrand] = useState(defaultBrandId || brands[0]?.id || '')
  const [selectedEstId, setSelectedEstId] = useState('')
  const [config, setConfig] = useState<Omit<DisplayConfigRow, 'establishment_id'>>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const brandEstablishments = selectedBrand
    ? establishments.filter(e => e.brand_id === selectedBrand)
    : establishments

  useEffect(() => {
    if (brandEstablishments.length > 0 && !selectedEstId) {
      setSelectedEstId(brandEstablishments[0].id)
    }
  }, [selectedBrand, brandEstablishments])

  useEffect(() => {
    if (!selectedEstId) return
    const existing = displayConfigs.find(c => c.establishment_id === selectedEstId)
    if (existing) {
      setConfig({
        bg_color: existing.bg_color,
        accent_color: existing.accent_color,
        show_waiting_list: existing.show_waiting_list,
        show_promotions: existing.show_promotions,
        show_clock: existing.show_clock,
        custom_message: existing.custom_message,
      })
    } else {
      setConfig(DEFAULT_CONFIG)
    }
  }, [selectedEstId, displayConfigs])

  const selectedEst = establishments.find(e => e.id === selectedEstId)

  async function handleSave() {
    if (!selectedEstId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('display_configs').upsert({
      establishment_id: selectedEstId,
      ...config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'establishment_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Selectors */}
      <div className="md:col-span-1 flex flex-col gap-4">
        {brands.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Marca</label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={selectedBrand}
              onChange={e => { setSelectedBrand(e.target.value); setSelectedEstId('') }}
            >
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Establecimiento</label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            value={selectedEstId}
            onChange={e => setSelectedEstId(e.target.value)}
          >
            {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {selectedEst && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Vista previa</p>
            <a
              href={`/display/${selectedEst.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Monitor size={14} />
              Abrir pantalla TV
              <ExternalLink size={12} />
            </a>
            <p className="text-xs text-gray-400 mt-2 break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/display/{selectedEst.slug}
            </p>
          </div>
        )}
      </div>

      {/* Config form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Configuración de pantalla</h2>

          <div className="flex flex-col gap-5">
            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Color de fondo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.bg_color}
                    onChange={e => setConfig(c => ({ ...c, bg_color: e.target.value }))}
                    className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={config.bg_color}
                    onChange={e => setConfig(c => ({ ...c, bg_color: e.target.value }))}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Color de acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.accent_color}
                    onChange={e => setConfig(c => ({ ...c, accent_color: e.target.value }))}
                    className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={config.accent_color}
                    onChange={e => setConfig(c => ({ ...c, accent_color: e.target.value }))}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              {[
                { key: 'show_waiting_list', label: 'Mostrar lista de espera' },
                { key: 'show_promotions', label: 'Mostrar promociones' },
                { key: 'show_clock', label: 'Mostrar reloj' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={config[key as keyof typeof config] as boolean}
                      onChange={e => setConfig(c => ({ ...c, [key]: e.target.checked }))}
                      className="sr-only"
                    />
                    <div
                      onClick={() => setConfig(c => ({ ...c, [key]: !c[key as keyof typeof c] }))}
                      className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${config[key as keyof typeof config] ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform m-1 ${config[key as keyof typeof config] ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom message */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Mensaje personalizado (opcional)</label>
              <textarea
                value={config.custom_message || ''}
                onChange={e => setConfig(c => ({ ...c, custom_message: e.target.value || null }))}
                rows={3}
                placeholder="Ej: ¡Bienvenidos! Por favor tengan su turno listo."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <Button onClick={handleSave} loading={saving} className="self-start">
              {saved ? '¡Guardado!' : 'Guardar configuración'}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
          <div className="h-full flex flex-col text-white text-[8px]" style={{ backgroundColor: config.bg_color }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div>
                <div className="font-black text-sm">Marca</div>
                <div className="opacity-60">Establecimiento</div>
              </div>
              {config.show_clock && <div className="font-mono font-bold text-lg">12:00:00</div>}
            </div>
            <div className="flex-1 flex p-3 gap-3">
              <div className="flex-1">
                <div className="opacity-50 uppercase tracking-widest mb-2">Atendiendo ahora</div>
                <div className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: config.accent_color }}>
                  <div className="text-2xl font-black">001</div>
                  <div className="font-bold">Cliente demo</div>
                </div>
                {config.show_waiting_list && (
                  <div className="mt-2">
                    <div className="opacity-50 uppercase tracking-widest mb-1">En espera</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[2,3,4].map(n => (
                        <div key={n} className="rounded p-1 text-center opacity-60" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <div className="font-black">00{n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {config.show_promotions && (
                <div className="w-16 text-center opacity-70" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <div className="p-1">Promo</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
