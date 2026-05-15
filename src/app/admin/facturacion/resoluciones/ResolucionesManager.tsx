'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, FolderKey, Check, X, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Resolution {
  id: string
  document_type: string
  resolution_number: string
  resolution_date: string
  prefix: string
  range_from: number
  range_to: number
  current_number: number
  technical_key: string | null
  valid_from: string
  valid_to: string
  is_active: boolean
}

interface Props {
  brandId: string
  resolutions: Resolution[]
}

const DOC_TYPES = [
  { value: 'invoice', label: 'Factura de venta' },
  { value: 'credit_note', label: 'Nota crédito' },
  { value: 'debit_note', label: 'Nota débito' },
]

export default function ResolucionesManager({ brandId, resolutions: initial }: Props) {
  const [resolutions, setResolutions] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [docType, setDocType] = useState('invoice')
  const [resNumber, setResNumber] = useState('')
  const [resDate, setResDate] = useState('')
  const [prefix, setPrefix] = useState('')
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')
  const [techKey, setTechKey] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  function resetForm() {
    setDocType('invoice')
    setResNumber('')
    setResDate('')
    setPrefix('')
    setRangeFrom('')
    setRangeTo('')
    setTechKey('')
    setValidFrom('')
    setValidTo('')
    setError('')
  }

  async function handleSave() {
    if (!resNumber || !prefix || !rangeFrom || !rangeTo || !validFrom || !validTo) {
      setError('Completa todos los campos obligatorios')
      return
    }

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { data, error: err } = await supabase.from('invoice_resolutions').insert({
      brand_id: brandId,
      document_type: docType,
      resolution_number: resNumber,
      resolution_date: resDate || null,
      prefix,
      range_from: parseInt(rangeFrom),
      range_to: parseInt(rangeTo),
      current_number: parseInt(rangeFrom),
      technical_key: techKey || null,
      valid_from: validFrom,
      valid_to: validTo,
      is_active: true,
    }).select().single()

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setResolutions(prev => [data as Resolution, ...prev])
    setCreating(false)
    resetForm()
    setSaving(false)
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const supabase = createClient()
    await supabase.from('invoice_resolutions').update({ is_active: !currentActive }).eq('id', id)
    setResolutions(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentActive } : r))
  }

  const remaining = (r: Resolution) => r.range_to - r.current_number + 1
  const usagePercent = (r: Resolution) => Math.round(((r.current_number - r.range_from) / (r.range_to - r.range_from + 1)) * 100)

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/facturacion" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FolderKey size={20} className="text-purple-600" /> Resoluciones
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rangos de numeración autorizados por DIAN</p>
          </div>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">
            <Plus size={15} /> Nueva
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nueva resolución</p>
            <button onClick={() => { setCreating(false); resetForm() }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo de documento</label>
              <select value={docType} onChange={e => setDocType(e.target.value)} className={inputClass}>
                {DOC_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Número de resolución</label>
              <input type="text" value={resNumber} onChange={e => setResNumber(e.target.value)}
                placeholder="18764009890123" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha de resolución</label>
              <input type="date" value={resDate} onChange={e => setResDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prefijo</label>
              <input type="text" value={prefix} onChange={e => setPrefix(e.target.value.toUpperCase())}
                placeholder="SETP" className={inputClass} maxLength={10} />
            </div>
            <div>
              <label className={labelClass}>Rango desde</label>
              <input type="number" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)}
                placeholder="990000000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rango hasta</label>
              <input type="number" value={rangeTo} onChange={e => setRangeTo(e.target.value)}
                placeholder="995000000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Vigencia desde</label>
              <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Vigencia hasta</label>
              <input type="date" value={validTo} onChange={e => setValidTo(e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Clave técnica (para facturas)</label>
              <input type="text" value={techKey} onChange={e => setTechKey(e.target.value)}
                placeholder="UUID clave técnica de DIAN" className={inputClass} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            <Check size={14} /> {saving ? 'Guardando...' : 'Guardar resolución'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {resolutions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-12 text-gray-400">
            <FolderKey size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay resoluciones registradas</p>
          </div>
        ) : (
          resolutions.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.is_active ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {DOC_TYPES.find(d => d.value === r.document_type)?.label ?? r.document_type}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full font-medium">
                    {r.prefix}
                  </span>
                </div>
                <button
                  onClick={() => toggleActive(r.id, r.is_active)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium ${
                    r.is_active
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {r.is_active ? 'Activa' : 'Inactiva'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Resolución</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{r.resolution_number}</p>
                </div>
                <div>
                  <span className="text-gray-400">Rango</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{r.range_from} — {r.range_to}</p>
                </div>
                <div>
                  <span className="text-gray-400">Actual</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{r.current_number}</p>
                </div>
                <div>
                  <span className="text-gray-400">Disponibles</span>
                  <p className={`font-medium ${remaining(r) < 100 ? 'text-red-500' : 'text-green-600'}`}>{remaining(r)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent(r) > 90 ? 'bg-red-500' : usagePercent(r) > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(usagePercent(r), 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {usagePercent(r)}% utilizado · Vigencia: {new Date(r.valid_from).toLocaleDateString('es')} — {new Date(r.valid_to).toLocaleDateString('es')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
