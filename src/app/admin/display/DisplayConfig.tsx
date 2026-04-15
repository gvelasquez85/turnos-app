'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Monitor, GripVertical, Trash2, ChevronDown, ChevronUp,
  Play, Image, Type, List, Clock, Plus, ExternalLink, Copy, Check, LayoutTemplate,
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
  font_color: string
  show_clock: boolean
  widgets: Widget[]
}

// ── Layout presets ──────────────────────────────────────────────────────────────
const LAYOUT_PRESETS = [
  {
    id: 'simple',
    label: 'Cola simple',
    description: 'Turno actual + lista de espera',
    widgets: [
      { id: 'w1', type: 'queue_now' as WidgetType, col: 'main' as const, config: { title: 'Atendiendo ahora' } },
      { id: 'w2', type: 'queue_waiting' as WidgetType, col: 'main' as const, config: { title: 'Próximos en cola', maxItems: 6 } },
    ],
  },
  {
    id: 'with_side',
    label: 'Cola + lateral',
    description: 'Cola principal con reloj y texto lateral',
    widgets: [
      { id: 'w1', type: 'queue_now' as WidgetType, col: 'main' as const, config: { title: 'Atendiendo ahora' } },
      { id: 'w2', type: 'queue_waiting' as WidgetType, col: 'main' as const, config: { title: 'Próximos en cola', maxItems: 5 } },
      { id: 'w3', type: 'clock' as WidgetType, col: 'side' as const, config: {} },
    ],
  },
  {
    id: 'with_video',
    label: 'Cola + contenido',
    description: 'Cola principal con video/imagen lateral',
    widgets: [
      { id: 'w1', type: 'queue_now' as WidgetType, col: 'main' as const, config: { title: 'Atendiendo ahora' } },
      { id: 'w2', type: 'queue_waiting' as WidgetType, col: 'main' as const, config: { title: 'Próximos en cola', maxItems: 4 } },
      { id: 'w3', type: 'clock' as WidgetType, col: 'side' as const, config: {} },
      { id: 'w4', type: 'youtube' as WidgetType, col: 'side' as const, config: { title: '' } },
    ],
  },
]

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
  font_color: '#ffffff',
  show_clock: true,
  widgets: DEFAULT_WIDGETS,
}

// Approximate pixel height of each widget type on a 1080px screen
const WIDGET_HEIGHT_PX: Record<WidgetType, number> = {
  queue_now: 120,
  queue_waiting: 200,
  clock: 90,
  text: 100,
  youtube: 300,
  image: 250,
}
const HEADER_HEIGHT = 80
const FOOTER_HEIGHT = 48
const PADDING = 64 // 2×32px vertical padding in body

const WIDGET_META: Record<WidgetType, { label: string; icon: React.ReactNode; color: string }> = {
  queue_now:     { label: 'Cola activa',     icon: <Monitor size={16} />,  color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  queue_waiting: { label: 'Lista de espera', icon: <List size={16} />,     color: 'bg-blue-50 text-blue-600 border-blue-200' },
  clock:         { label: 'Reloj',           icon: <Clock size={16} />,    color: 'bg-purple-50 text-purple-600 border-purple-200' },
  text:          { label: 'Texto libre',     icon: <Type size={16} />,     color: 'bg-amber-50 text-amber-600 border-amber-200' },
  youtube:       { label: 'Video YouTube',   icon: <Play size={16} />,     color: 'bg-red-50 text-red-600 border-red-200' },
  image:         { label: 'Imagen',          icon: <Image size={16} />,    color: 'bg-green-50 text-green-600 border-green-200' },
}

const ALL_WIDGET_TYPES: WidgetType[] = ['queue_now', 'queue_waiting', 'clock', 'text', 'youtube', 'image']

function genId() { return Math.random().toString(36).slice(2, 9) }

// ── Widget config fields (expanded) ────────────────────────────────────────────
function WidgetConfigFields({ widget, onChange }: { widget: Widget; onChange: (cfg: Widget['config']) => void }) {
  const { type, config } = widget
  if (type === 'clock') return <p className="text-xs text-gray-400 italic">Sin opciones adicionales.</p>
  return (
    <div className="flex flex-col gap-3 mt-2">
      {(type === 'queue_now' || type === 'queue_waiting' || type === 'youtube' || type === 'image') && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Título de sección (opcional)</label>
          <Input value={config.title ?? ''} onChange={e => onChange({ ...config, title: e.target.value })}
            placeholder="Ej: Atendiendo ahora" className="h-8 text-sm" />
        </div>
      )}
      {type === 'queue_waiting' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Máximo de elementos</label>
          <Input type="number" min={1} max={20} value={config.maxItems ?? 6}
            onChange={e => onChange({ ...config, maxItems: parseInt(e.target.value) || 6 })}
            className="h-8 text-sm w-24" />
        </div>
      )}
      {type === 'text' && (
        <>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Contenido</label>
            <textarea value={config.content ?? ''} onChange={e => onChange({ ...config, content: e.target.value })}
              rows={3} placeholder="Escribe el texto a mostrar..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Alineación</label>
              <select value={config.textAlign ?? 'left'}
                onChange={e => onChange({ ...config, textAlign: e.target.value as Widget['config']['textAlign'] })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Tamaño de texto</label>
              <select value={config.fontSize ?? 'md'}
                onChange={e => onChange({ ...config, fontSize: e.target.value as Widget['config']['fontSize'] })}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
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
          <Input value={config.youtubeUrl ?? ''} onChange={e => onChange({ ...config, youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/embed/VIDEO_ID" className="h-8 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Usa el link de embed: .../embed/VIDEO_ID</p>
        </div>
      )}
      {type === 'image' && (
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">URL de imagen</label>
          <Input value={config.imageUrl ?? ''} onChange={e => onChange({ ...config, imageUrl: e.target.value })}
            placeholder="https://..." className="h-8 text-sm" />
        </div>
      )}
    </div>
  )
}

// ── Widget row (drag reorder) ───────────────────────────────────────────────────
function WidgetRow({ widget, isDragOver, onDragStart, onDragEnter, onDragEnd, onDrop, onUpdate, onDelete }: {
  widget: Widget; isDragOver: boolean
  onDragStart: () => void; onDragEnter: () => void; onDragEnd: () => void; onDrop: () => void
  onUpdate: (w: Widget) => void; onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = WIDGET_META[widget.type]
  return (
    <div draggable onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()} onDrop={onDrop}
      className={`rounded-xl border bg-white transition-all ${isDragOver ? 'border-indigo-400 shadow-md scale-[1.01]' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0">
          <GripVertical size={15} />
        </div>
        <span className={`p-1 rounded-lg border ${meta.color}`}>{meta.icon}</span>
        <span className="text-sm font-medium text-gray-800 flex-1">{meta.label}</span>
        <div className="flex rounded-lg overflow-hidden border border-gray-200 text-xs shrink-0">
          {(['main', 'side'] as const).map(col => (
            <button key={col} onClick={() => onUpdate({ ...widget, col })}
              className={`px-2.5 py-1 font-medium transition-colors ${widget.col === col ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              {col === 'main' ? 'Principal' : 'Lateral'}
            </button>
          ))}
        </div>
        <button onClick={() => setExpanded(x => !x)} className="text-gray-400 hover:text-gray-600 p-0.5 shrink-0">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={onDelete} className="text-gray-300 hover:text-red-500 p-0.5 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-3">
          <WidgetConfigFields widget={widget} onChange={cfg => onUpdate({ ...widget, config: cfg })} />
        </div>
      )}
    </div>
  )
}

// ── TV preview (mini 16:9) ──────────────────────────────────────────────────────
function TvPreview({ widgets, bgColor, accentColor, fontColor }: { widgets: Widget[]; bgColor: string; accentColor: string; fontColor: string }) {
  const mainWidgets = widgets.filter(w => w.col === 'main')
  const sideWidgets = widgets.filter(w => w.col === 'side')

  // Calculate approximate height usage as % of 1080px
  const bodyAvailable = 1080 - HEADER_HEIGHT - FOOTER_HEIGHT - PADDING
  const mainH = mainWidgets.reduce((s, w) => s + WIDGET_HEIGHT_PX[w.type], 0)
  const sideH = sideWidgets.reduce((s, w) => s + WIDGET_HEIGHT_PX[w.type], 0)
  const maxH = Math.max(mainH, sideH)
  const usagePct = Math.min(Math.round((maxH / bodyAvailable) * 100), 120)
  const overflowing = usagePct > 100

  return (
    <div className="flex flex-col gap-2">
      {/* Height indicator */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">Vista previa (1920×1080)</span>
        <span className={`font-semibold px-2 py-0.5 rounded-full ${overflowing ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
          {overflowing ? `⚠ ${usagePct}% — desborda 1080px` : `${usagePct}% de 1080px`}
        </span>
      </div>

      {/* The TV screen */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-300 shadow-lg" style={{ aspectRatio: '16/9' }}>
        <div className="h-full flex flex-col text-[8px]" style={{ backgroundColor: bgColor, color: fontColor }}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10" style={{ minHeight: '14%' }}>
            <div>
              <div className="font-black text-[11px]">Marca</div>
              <div className="opacity-60 text-[8px]">Sucursal</div>
            </div>
            {sideWidgets.some(w => w.type === 'clock') && (
              <div className="font-mono font-bold text-sm opacity-80">12:00:00</div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 flex gap-0 overflow-hidden">
            {/* Main col */}
            <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-hidden">
              {mainWidgets.length === 0 && (
                <div className="opacity-20 text-[7px] text-center mt-4 border-2 border-dashed border-white/20 rounded p-3">
                  Sin widgets en columna principal
                </div>
              )}
              {mainWidgets.map(w => {
                if (w.type === 'queue_now') return (
                  <div key={w.id} className="shrink-0">
                    {w.config.title && <div className="opacity-40 uppercase tracking-widest text-[5px] mb-0.5">{w.config.title}</div>}
                    <div className="rounded-lg p-1.5 flex items-center gap-1.5" style={{ backgroundColor: accentColor }}>
                      <div className="text-[13px] font-black">001</div>
                      <div className="text-[7px] font-bold leading-tight">Cliente de<br/>demostración</div>
                    </div>
                  </div>
                )
                if (w.type === 'queue_waiting') return (
                  <div key={w.id} className="shrink-0">
                    {w.config.title && <div className="opacity-40 uppercase tracking-widest text-[5px] mb-0.5">{w.config.title}</div>}
                    <div className="grid grid-cols-4 gap-0.5">
                      {[2,3,4,5].map(n => (
                        <div key={n} className="rounded p-1 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <div className="font-black text-[8px]">00{n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
                const meta = WIDGET_META[w.type]
                return (
                  <div key={w.id} className="rounded p-1.5 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-1 opacity-70 text-[7px]">{meta.icon} {meta.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Side col */}
            {sideWidgets.length > 0 && (
              <div className="w-16 border-l border-white/10 p-2 flex flex-col gap-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                {sideWidgets.map(w => {
                  if (w.type === 'clock') return (
                    <div key={w.id} className="text-center shrink-0">
                      <div className="font-mono font-bold text-[11px]">12:00</div>
                      <div className="opacity-40 text-[6px] capitalize">lunes 31 ene</div>
                    </div>
                  )
                  const meta = WIDGET_META[w.type]
                  return (
                    <div key={w.id} className="rounded p-1 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-0.5 opacity-70 text-[6px]">{meta.icon} {meta.label}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1 border-t border-white/10 opacity-30 text-[6px]">TurnFlow</div>
        </div>
      </div>

      {/* Height bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${overflowing ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(usagePct, 100)}%` }} />
        </div>
        <span className="text-[10px] text-gray-400 shrink-0">altura aprox.</span>
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────
export function DisplayConfig({ brands, establishments, displayConfigs, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrand, setSelectedBrand] = useState(() => storeBrandId || defaultBrandId || brands[0]?.id || '')

  useEffect(() => {
    if (storeBrandId) { setSelectedBrand(storeBrandId); setSelectedEstId('') }
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedEstId, setSelectedEstId] = useState('')
  const [bgColor, setBgColor] = useState(DEFAULT_CONFIG.bg_color)
  const [accentColor, setAccentColor] = useState(DEFAULT_CONFIG.accent_color)
  const [fontColor, setFontColor] = useState(DEFAULT_CONFIG.font_color)
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_CONFIG.widgets)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [applyScope, setApplyScope] = useState<'single' | 'all'>('single')
  const [copiedToAll, setCopiedToAll] = useState(false)

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
      setFontColor((existing as any).font_color || DEFAULT_CONFIG.font_color)
      setWidgets(Array.isArray(existing.widgets) && existing.widgets.length > 0 ? existing.widgets : DEFAULT_WIDGETS)
    } else {
      setBgColor(DEFAULT_CONFIG.bg_color)
      setAccentColor(DEFAULT_CONFIG.accent_color)
      setFontColor(DEFAULT_CONFIG.font_color)
      setWidgets(DEFAULT_CONFIG.widgets)
    }
  }, [selectedEstId, displayConfigs])

  const selectedEst = establishments.find(e => e.id === selectedEstId)

  function addWidget(type: WidgetType) {
    setWidgets(ws => [...ws, { id: genId(), type, col: 'main', config: type === 'queue_waiting' ? { maxItems: 6 } : {} }])
  }
  function updateWidget(id: string, updated: Widget) {
    setWidgets(ws => ws.map(w => w.id === id ? updated : w))
  }
  function deleteWidget(id: string) {
    setWidgets(ws => ws.filter(w => w.id !== id))
  }
  function handleDragStart(i: number) { dragIndex.current = i }
  function handleDragEnter(i: number) { setDragOverIndex(i) }
  function handleDragEnd() { dragIndex.current = null; setDragOverIndex(null) }
  function handleDrop(dropIndex: number) {
    if (dragIndex.current === null || dragIndex.current === dropIndex) { handleDragEnd(); return }
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
    const payload = { bg_color: bgColor, accent_color: accentColor, font_color: fontColor, show_clock: true, widgets, updated_at: new Date().toISOString() }

    // Save to selected establishment
    const estIds = applyScope === 'all'
      ? brandEstablishments.map(e => e.id)
      : [selectedEstId]

    for (const estId of estIds) {
      await supabase.from('display_configs').upsert(
        { establishment_id: estId, ...payload },
        { onConflict: 'establishment_id' }
      )
    }

    setSaving(false)
    setSaved(true)
    if (applyScope === 'all') { setCopiedToAll(true); setTimeout(() => setCopiedToAll(false), 3000) }
    setTimeout(() => setSaved(false), 2500)
  }

  const mainWidgets = widgets.filter(w => w.col === 'main')
  const sideWidgets = widgets.filter(w => w.col === 'side')

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">

      {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
      <div className="w-full lg:w-56 shrink-0 flex flex-col gap-4 lg:sticky lg:top-4">

        {/* Establishment selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          {selectedBrand && brands.find(b => b.id === selectedBrand) && (
            <div className="mb-3 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
              <Monitor size={12} className="text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-indigo-700 truncate">{brands.find(b => b.id === selectedBrand)?.name}</span>
            </div>
          )}
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Sucursal</label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            value={selectedEstId}
            onChange={e => setSelectedEstId(e.target.value)}
          >
            {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          {/* Apply scope */}
          <div className="mt-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Aplicar diseño a</label>
            <div className="flex flex-col gap-1.5">
              {(['single', 'all'] as const).map(scope => (
                <label key={scope} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="applyScope" value={scope}
                    checked={applyScope === scope} onChange={() => setApplyScope(scope)}
                    className="text-indigo-600" />
                  <span className={applyScope === scope ? 'text-indigo-700 font-medium' : 'text-gray-600'}>
                    {scope === 'single' ? 'Esta sucursal' : `Toda la marca (${brandEstablishments.length})`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-3">Colores</label>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Fondo</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5 shrink-0" />
                <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Acento</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5 shrink-0" />
                <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Fuente / texto</label>
              <div className="flex items-center gap-2">
                <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)}
                  className="h-8 w-10 rounded border border-gray-300 cursor-pointer p-0.5 shrink-0" />
                <input type="text" value={fontColor} onChange={e => setFontColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-mono text-gray-900 focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* TV link */}
        {selectedEst && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <a href={`/display/${selectedEst.slug}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              <Monitor size={14} /> Abrir Pantalla TV <ExternalLink size={11} />
            </a>
            <p className="text-[10px] text-gray-400 mt-1.5 break-all font-mono">/display/{selectedEst.slug}</p>
          </div>
        )}

        {/* Save */}
        <Button onClick={handleSave} disabled={saving || !selectedEstId} className="w-full">
          {saving ? 'Guardando...' : saved
            ? (copiedToAll ? <span className="flex items-center gap-1"><Check size={14} /> Aplicado a toda la marca</span> : <span className="flex items-center gap-1"><Check size={14} /> Guardado</span>)
            : applyScope === 'all' ? <span className="flex items-center gap-1"><Copy size={14} /> Guardar y aplicar a toda la marca</span> : 'Guardar configuración'
          }
        </Button>
      </div>

      {/* ── MAIN AREA ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">

        {/* TV Preview — prominente en la parte superior */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <TvPreview widgets={widgets} bgColor={bgColor} accentColor={accentColor} fontColor={fontColor} />
        </div>

        {/* Layout presets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <LayoutTemplate size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Distribuciones predefinidas</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">Aplica una distribución de pantalla con un clic. Reemplaza los widgets actuales.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LAYOUT_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => setWidgets(preset.widgets.map(w => ({ ...w, id: genId() })))}
                className="text-left rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 p-3 transition-all active:scale-95"
              >
                <p className="text-sm font-semibold text-gray-800">{preset.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                <p className="text-xs text-indigo-500 mt-1.5 font-medium">{preset.widgets.length} widget{preset.widgets.length !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Widget palette */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Agregar widgets</h2>
          <p className="text-xs text-gray-400 mb-4">Haz clic para agregar un widget al diseño</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ALL_WIDGET_TYPES.map(type => {
              const meta = WIDGET_META[type]
              const disabled = type === 'queue_now' && hasQueueNow
              return (
                <button key={type} onClick={() => !disabled && addWidget(type)} disabled={disabled}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all active:scale-95
                    ${disabled
                      ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                      : `${meta.color} border-current/30 hover:scale-105 cursor-pointer hover:shadow-sm`
                    }`}>
                  <span>{meta.icon}</span>
                  <span className="leading-tight text-center text-[10px]">{meta.label}</span>
                  {!disabled && <Plus size={10} className="opacity-60" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active widget list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Widgets activos</h2>
              <p className="text-xs text-gray-400 mt-0.5">Arrastra para reordenar · {widgets.length} widget{widgets.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-indigo-200" /> Principal ({mainWidgets.length})
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm bg-purple-200" /> Lateral ({sideWidgets.length})
              </span>
            </div>
          </div>
          {widgets.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
              <Monitor size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Agrega widgets desde la paleta de arriba</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {widgets.map((widget, i) => (
                <WidgetRow key={widget.id} widget={widget} isDragOver={dragOverIndex === i}
                  onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)}
                  onDragEnd={handleDragEnd} onDrop={() => handleDrop(i)}
                  onUpdate={updated => updateWidget(widget.id, updated)}
                  onDelete={() => deleteWidget(widget.id)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
