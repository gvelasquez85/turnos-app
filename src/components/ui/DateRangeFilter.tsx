'use client'
import { useState } from 'react'
import { CalendarDays } from 'lucide-react'

export type DateRange = { from: Date; to: Date }

export type Preset = 'today' | 'week' | 'month' | 'year' | 'custom'

const PRESET_LABELS: Record<Preset, string> = {
  today:  'Hoy',
  week:   'Esta semana',
  month:  'Este mes',
  year:   'Este año',
  custom: 'Personalizado',
}

export function presetRange(p: Preset): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  if (p === 'today')  return { from: today, to: end }
  if (p === 'week')   {
    const from = new Date(today)
    from.setDate(today.getDate() - today.getDay())
    return { from, to: end }
  }
  if (p === 'month')  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: end }
  if (p === 'year')   return { from: new Date(now.getFullYear(), 0, 1), to: end }
  // 'custom' — caller manages from/to
  return { from: new Date(0), to: end }
}

interface Props {
  value: DateRange
  preset: Preset
  onChange: (range: DateRange, preset: Preset) => void
  /** Show establishment dropdown alongside? */
  estOptions?: { id: string; name: string }[]
  estValue?: string
  onEstChange?: (id: string) => void
}

export function DateRangeFilter({ value, preset, onChange, estOptions, estValue, onEstChange }: Props) {
  const [showCustom, setShowCustom] = useState(preset === 'custom')

  function toInputVal(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  function handlePreset(p: Preset) {
    if (p === 'custom') {
      setShowCustom(true)
      onChange(value, 'custom')
    } else {
      setShowCustom(false)
      onChange(presetRange(p), p)
    }
  }

  function handleCustomFrom(e: React.ChangeEvent<HTMLInputElement>) {
    const from = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date(0)
    onChange({ from, to: value.to }, 'custom')
  }

  function handleCustomTo(e: React.ChangeEvent<HTMLInputElement>) {
    const to = e.target.value ? new Date(e.target.value + 'T23:59:59') : new Date()
    onChange({ from: value.from, to }, 'custom')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset pills */}
      <div className="flex gap-1 flex-wrap">
        {(['today', 'week', 'month', 'year'] as Preset[]).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => handlePreset(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              preset === p
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {PRESET_LABELS[p]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePreset('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
            preset === 'custom'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <CalendarDays size={11} />
          Rango
        </button>
      </div>

      {/* Custom range inputs */}
      {showCustom && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={toInputVal(value.from)}
            onChange={handleCustomFrom}
            className="h-8 rounded-lg border border-gray-200 px-2 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
          />
          <span className="text-xs text-gray-400">—</span>
          <input
            type="date"
            value={toInputVal(value.to)}
            onChange={handleCustomTo}
            className="h-8 rounded-lg border border-gray-200 px-2 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
          />
        </div>
      )}

      {/* Establishment filter */}
      {estOptions && estOptions.length > 1 && onEstChange && (
        <select
          value={estValue ?? ''}
          onChange={e => onEstChange(e.target.value)}
          className="h-8 rounded-lg border border-gray-200 px-2 text-xs text-gray-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Todas las sucursales</option>
          {estOptions.map(e => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      )}
    </div>
  )
}
