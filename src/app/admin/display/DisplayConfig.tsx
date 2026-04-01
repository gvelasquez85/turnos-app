'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Monitor, GripVertical, Trash2, ChevronDown, ChevronUp,
  Play, Image, Type, List, Clock, Plus, ExternalLink,
} from 'lucide-react'

interface Brand { id: string; name: string }
interface Establishment { id: string; name: string; slug: string; brand_id: string }

type WidgetType = 'queue_now' | 'queue_waiting' | 'clock' | 'text' | 'youtube' | 'image'
interface Widget {
  id: string
  type: WidgetType
  col: 'main' | 'side'
  config: {
    title?: string
    content?: string
    youtubeUrl?: string
    imageUrl?: string
    maxItems?: number
    textAlign?: 'left' | 'center' | 'right'
    fontSize?: 'sm' | 'md' | 'lg' | 'xl'
  }
}

interface DisplayConfigRow {
  id?: string
  establishment_id: string
  bg_color: string
  accent_color: string
  show_clock: boolean
  widgets: Widget[]
}

interface Props {
  brands: Brand[]
  establishments: Establishment[]
  displayConfigs: DisplayConfigRow[]
  defaultBrandId: string | null
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', type: 'queue_now', col: 'main', config: { title: 'Atendiendo ahora' } },
  { id: 'w2', type: 'queue_waiting', col: 'main', config: { title: 'Próximos en cola', maxItems: 6 } },
  { id: 'w3', type: 'clock', col: 'side', config: {} },
]

const DEFAULT_CONFIG = {
  bg_color: '#1e1b4b',
  accent_color: '#6366f1',
  show_clock: true,
  widgets: DEFAULT_WIDGETS,
}

const WIDGET_META: Record<WidgetType, { label: string; icon: React.ReactNode }> = {
  queue_now:      { label: 'Cola activa',    icon: <Monitor size={18} /> },
  queue_waiting:  { label: 'Lista de espera', icon: <List size={18} /> },
  clock:          { label: 'Reloj',          icon: <Clock size={18} /> },
  text:           { label: 'Texto libre',    icon: <Type size={18} /> },
  youtube:        { label: 'Video YouTube',  icon: <Play size={18} /> },
  image:          { label: 'Imagen',         icon: <Image size={18} /> },
}

const ALL_WIDGET_TYPES: WidgetType[] = ['queue_now', 'queue_waiting', 'clock', 'text', 'youtube', 'image']

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function WidgetConfigFields({
  widget,
  onChange,
}: {
  widget: Widget
  onChange: (cfg: Widget['config']) => void
}) {
  const { type, config } = widget

  if (type === 'clock') {
    return <p className="text-xs text-gray-400 italic">Sin opciones adicionales.</p>
  }

  return (
    <div className="flex flex-col gap-3 mt-2">
      {(type === 'queue_now' || type === 'queue_waiting' || type === 'youtube' || type === 'image') && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Título de sección (opcional)</label>
          <Input
            value={config.title ?? ''}
            onChange={e => onChange({ ...config, title: e.target.value })}
            placeholder="Ej: Atendiendo ahora"
            className="h-8 text-sm"
          />
        </div>
      )}

      {type === 'queue_waiting' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Máximo de elementos</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={config.maxItems ?? 6}
            onChange={e => onChange({ ...config, maxItems: parseInt(e.target.value) || 6 })}
            className="h-8 text-sm w-24"
          />
        </div>
      )}

      {type === 'text' && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Contenido</label>
            <textarea
              value={config.content ?? ''}
              onChange={e => onChange({ ...config, content: e.target.value })}
              rows={3}
              placeholder="Escribe el texto a mostrar..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Alineación</label>
              <select
                value={config.textAlign ?? 'left'}
                onChange={e => onChange({ ...config, textAlign: e.target.value as Widget['config']['textAlign'] })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tamaño</label>
              <select
                value={config.fontSize ?? 'md'}
                onChange={e => onChange({ ...config, fontSize: e.target.value as Widget['config']['fontSize'] })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="sm">Pequeño</option>
                <option value="md">Normal</option>
                <option value="lg">Grande</option>
                <option value="xl">Muy grande</option>
              </select>
            </div>
          </div>
        </>
      )}

      {type === 'youtube' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">URL de embed</label>
          <Input
            value={config.youtubeUrl ?? ''}
            onChange={e => onChange({ ...config, youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
            className="h-8 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Usa el link de embed de YouTube: https://www.youtube.com/embed/VIDEO_ID
          </p>
        </div>
      )}

      {type === 'image' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">URL de imagen</label>
          <Input
            value={config.imageUrl ?? ''}
            onChange={e => onChange({ ...config, imageUrl: e.target.value })}
            placeholder="https://..."
            className="h-8 text-sm"
          />
        </div>
      )}
    </div>
  )
}

function WidgetRow({
  widget,
  isDragOver,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  onUpdate,
  onDelete,
}: {
  widget: Widget
  isDragOver: boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  onDrop: () => void
  onUpdate: (w: Widget) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = WIDGET_META[widget.type]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      className={`rounded-lg border bg-white transition-colors ${isDragOver ? 'border-indigo-400 shadow-md' : 'border-gray-200'}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        <span className="text-gray-500">{meta.icon}</span>
        <span className="text-sm font-medium text-gray-800 flex-1">{meta.label}</span>

        {/* Col pills */}
        <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
          {(['main', 'side'] as const).map(col => (
            <button
              key={col}
              onClick={() => onUpdate({ ...widget, col })}
              className={`px-2 py-1 font-medium transition-colors ${widget.col === col ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              {col === 'main' ? 'Principal' : 'Lateral'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setExpanded(x => !x)}
          className="text-gray-400 hover:text-gray-600 p-0.5"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-500 p-0.5"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <WidgetConfigFields
            widget={widget}
            onChange={cfg => onUpdate({ ...widget, config: cfg })}
          />
        </div>
      )}
    </div>
  )
}

export function DisplayConfig({ brands, establishments, displayConfigs, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrand, setSelectedBrand] = useState(() => storeBrandId || defaultBrandId || brands[0]?.id || '')

  useEffect(() => {
    if (storeBrandId) { setSelectedBrand(storeBrandId); setSelectedEstId('') }
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedEstId, setSelectedEstId] = useState('')
  const [bgColor, setBgColor] = useState(DEFAULT_CONFIG.bg_color)
  const [accentColor, setAccentColor] = useState(DEFAULT_CONFIG.accent_color)
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_CONFIG.widgets)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const brandEstablishments = selectedBrand
    ? establishments.filter(e => e.brand_id === selectedBrand)
    : establishments

  useEffect(() => {
    if (brandEstablishments.length > 0 && !selectedEstId) {
      setSelectedEstId(brandEstablishments[0].id)
    }
  }, [selectedBrand]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedEstId) return
    const existing = displayConfigs.find(c => c.establishment_id === selectedEstId)
    if (existing) {
      setBgColor(existing.bg_color)
      setAccentColor(existing.accent_color)
      setWidgets(Array.isArray(existing.widgets) && existing.widgets.length > 0 ? existing.widgets : DEFAULT_WIDGETS)
    } else {
      setBgColor(DEFAULT_CONFIG.bg_color)
      setAccentColor(DEFAULT_CONFIG.accent_color)
      setWidgets(DEFAULT_CONFIG.widgets)
    }
  }, [selectedEstId, displayConfigs])

  const selectedEst = establishments.find(e => e.id === selectedEstId)

  function addWidget(type: WidgetType) {
    const newWidget: Widget = {
      id: genId(),
      type,
      col: 'main',
      config: type === 'queue_waiting' ? { maxItems: 6 } : {},
    }
    setWidgets(ws => [...ws, newWidget])
  }

  function updateWidget(id: string, updated: Widget) {
    setWidgets(ws => ws.map(w => w.id === id ? updated : w))
  }

  function deleteWidget(id: string) {
    setWidgets(ws => ws.filter(w => w.id !== id))
  }

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragEnter(index: number) {
    setDragOverIndex(index)
  }

  function handleDragEnd() {
    dragIndex.current = null
    setDragOverIndex(null)
  }

  function handleDrop(dropIndex: number) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) {
      handleDragEnd()
      return
    }
    setWidgets(ws => {
      const next = [...ws]
      const [moved] = next.splice(dragIndex.current!, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })
    handleDragEnd()
  }

  const hasQueueNow = widgets.some(w => w.type === 'queue_now')

  async function handleSave() {
    if (!selectedEstId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('display_configs').upsert({
      establishment_id: selectedEstId,
      bg_color: bgColor,
      accent_color: accentColor,
      show_clock: true,
      widgets,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'establishment_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const mainWidgets = widgets.filter(w => w.col === 'main')
  const sideWidgets = widgets.filter(w => w.col === 'side')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left panel */}
      <div className="md:col-span-1 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">Sucursal</label>
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

      {/* Right panel */}
      <div className="md:col-span-2 flex flex-col gap-6">

        {/* Widget palette */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Widgets disponibles</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ALL_WIDGET_TYPES.map(type => {
              const meta = WIDGET_META[type]
              const disabled = type === 'queue_now' && hasQueueNow
              return (
                <button
                  key={type}
                  onClick={() => !disabled && addWidget(type)}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors
                    ${disabled
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                    }`}
                >
                  <span className={disabled ? 'opacity-30' : ''}>{meta.icon}</span>
                  <span className="leading-tight text-center">{meta.label}</span>
                  {!disabled && <Plus size={12} className="text-indigo-400" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Widget list */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Diseño de pantalla</h2>
          {widgets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
              Agrega widgets desde la paleta de arriba.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {widgets.map((widget, i) => (
                <WidgetRow
                  key={widget.id}
                  widget={widget}
                  isDragOver={dragOverIndex === i}
                  onDragStart={() => handleDragStart(i)}
                  onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd}
                  onDrop={() => handleDrop(i)}
                  onUpdate={updated => updateWidget(widget.id, updated)}
                  onDelete={() => deleteWidget(widget.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Colors */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Colores</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Color de fondo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Color de acento</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="h-9 w-14 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={e => setAccentColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
          </Button>
        </div>

        {/* Mini preview */}
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: '16/9' }}>
          <div className="h-full flex flex-col text-white text-[8px]" style={{ backgroundColor: bgColor }}>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
              <div>
                <div className="font-black text-xs">Marca</div>
                <div className="opacity-60 text-[7px]">Sucursal</div>
              </div>
              <div className="font-mono font-bold text-sm opacity-80">12:00:00</div>
            </div>
            <div className="flex-1 flex p-2 gap-2 overflow-hidden">
              {/* Main column */}
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                {mainWidgets.length === 0 && (
                  <div className="opacity-30 text-[7px] text-center mt-4">Sin widgets</div>
                )}
                {mainWidgets.map(w => {
                  const meta = WIDGET_META[w.type]
                  if (w.type === 'queue_now') {
                    return (
                      <div key={w.id}>
                        {w.config.title && <div className="opacity-40 uppercase tracking-widest text-[6px] mb-1">{w.config.title}</div>}
                        <div className="rounded p-1.5 flex items-center gap-1.5" style={{ backgroundColor: accentColor }}>
                          <div className="text-sm font-black">001</div>
                          <div className="text-[7px] font-bold">Cliente demo</div>
                        </div>
                      </div>
                    )
                  }
                  if (w.type === 'queue_waiting') {
                    return (
                      <div key={w.id}>
                        {w.config.title && <div className="opacity-40 uppercase tracking-widest text-[6px] mb-1">{w.config.title}</div>}
                        <div className="grid grid-cols-3 gap-0.5">
                          {[2,3,4].map(n => (
                            <div key={n} className="rounded text-center p-0.5 opacity-60" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                              <div className="font-black text-[7px]">00{n}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={w.id} className="rounded p-1 opacity-60 text-[7px]" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="inline-flex items-center gap-0.5">{meta.icon} {meta.label}</span>
                    </div>
                  )
                })}
              </div>
              {/* Side column */}
              {sideWidgets.length > 0 && (
                <div className="w-14 flex flex-col gap-2 border-l border-white/10 pl-2 overflow-hidden">
                  {sideWidgets.map(w => {
                    const meta = WIDGET_META[w.type]
                    if (w.type === 'clock') {
                      return (
                        <div key={w.id} className="text-center">
                          <div className="font-mono font-bold text-xs">12:00</div>
                          <div className="opacity-40 text-[6px]">lunes 31</div>
                        </div>
                      )
                    }
                    return (
                      <div key={w.id} className="rounded p-1 opacity-60 text-[7px]" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <span className="inline-flex items-center gap-0.5">{meta.icon} {meta.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-3 py-1 border-t border-white/10 opacity-30 text-[6px]">TurnApp</div>
          </div>
        </div>

      </div>
    </div>
  )
}
