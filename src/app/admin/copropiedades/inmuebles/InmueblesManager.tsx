'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Home, Plus, Upload, Search, X, Check, Save, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Unit {
  id: string; unit_number: string; unit_type: string; tower: string | null; floor: number | null
  area_m2: number | null; coeficiente: number; owner_name: string | null; owner_email: string | null
  owner_phone: string | null; owner_id_number: string | null; tenant_name: string | null; is_active: boolean
}

interface Props { brandId: string; units: Unit[]; config: any | null }

const UNIT_TYPES = ['apartamento', 'casa', 'local', 'oficina', 'parqueadero', 'bodega']

export default function InmueblesManager({ brandId, units: initial, config }: Props) {
  const [units, setUnits] = useState(initial)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form state
  const [unitNumber, setUnitNumber] = useState('')
  const [unitType, setUnitType] = useState('apartamento')
  const [tower, setTower] = useState('')
  const [floor, setFloor] = useState('')
  const [area, setArea] = useState('')
  const [coef, setCoef] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [ownerId, setOwnerId] = useState('')

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  const totalCoef = units.reduce((s, u) => s + u.coeficiente, 0)
  const filtered = search.trim() ? units.filter(u => u.unit_number.toLowerCase().includes(search.toLowerCase()) || u.owner_name?.toLowerCase().includes(search.toLowerCase())) : units

  function resetForm() {
    setUnitNumber(''); setUnitType('apartamento'); setTower(''); setFloor(''); setArea('')
    setCoef(''); setOwnerName(''); setOwnerEmail(''); setOwnerPhone(''); setOwnerId('')
  }

  async function handleSave() {
    if (!unitNumber || !coef) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('copropiedad_units').insert({
      brand_id: brandId, unit_number: unitNumber.trim(), unit_type: unitType,
      tower: tower || null, floor: floor ? parseInt(floor) : null,
      area_m2: area ? parseFloat(area) : null, coeficiente: parseFloat(coef),
      owner_name: ownerName || null, owner_email: ownerEmail || null,
      owner_phone: ownerPhone || null, owner_id_number: ownerId || null,
    }).select().single()

    if (data) {
      setUnits(prev => [...prev, data as Unit])
      setCreating(false); resetForm()
    }
    setSaving(false)
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return
    setBulkLoading(true)
    const supabase = createClient()

    // Parse CSV: unit_number,type,tower,floor,area,coeficiente,owner_name,owner_email,owner_phone,owner_id
    const lines = bulkText.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const inserts = lines.map(line => {
      const [num, type, tw, fl, ar, co, name, email, phone, id] = line.split(',').map(s => s.trim())
      return {
        brand_id: brandId, unit_number: num, unit_type: type || 'apartamento',
        tower: tw || null, floor: fl ? parseInt(fl) : null,
        area_m2: ar ? parseFloat(ar) : null, coeficiente: parseFloat(co) || 0,
        owner_name: name || null, owner_email: email || null,
        owner_phone: phone || null, owner_id_number: id || null,
      }
    }).filter(u => u.unit_number && u.coeficiente > 0)

    if (inserts.length > 0) {
      const { data } = await supabase.from('copropiedad_units').upsert(inserts, { onConflict: 'brand_id,unit_number' }).select()
      if (data) {
        setUnits(prev => {
          const map = new Map(prev.map(u => [u.unit_number, u]))
          data.forEach((u: any) => map.set(u.unit_number, u))
          return Array.from(map.values())
        })
      }
    }

    // Update config
    await supabase.from('copropiedad_configs').upsert({
      brand_id: brandId, total_units: units.length + inserts.length,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'brand_id' })

    setBulkMode(false); setBulkText(''); setBulkLoading(false)
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setBulkText(ev.target?.result as string || '')
      setBulkMode(true)
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const csv = "# inmueble,tipo,torre,piso,area_m2,coeficiente,propietario,email,telefono,documento\nApto 101,apartamento,Torre A,1,65.5,1.234567,Juan Pérez,juan@email.com,3001234567,1234567890\nApto 102,apartamento,Torre A,1,72.0,1.345678,María López,maria@email.com,3009876543,9876543210"
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_inmuebles.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/copropiedades" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Home size={20} className="text-blue-600" /> Inmuebles</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{units.length} unidades · Coeficiente total: {totalCoef.toFixed(4)}%</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50">
            <Download size={13} /> Plantilla
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 cursor-pointer">
            <Upload size={13} /> Importar CSV
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
            <Plus size={15} /> Agregar
          </button>
        </div>
      </div>

      {/* Bulk import */}
      {bulkMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Importación masiva</p>
            <button onClick={() => setBulkMode(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <p className="text-xs text-gray-500">Formato CSV: inmueble,tipo,torre,piso,area,coeficiente,propietario,email,telefono,documento</p>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
            className={`${inputClass} font-mono text-xs resize-none`} placeholder="Apto 101,apartamento,Torre A,1,65.5,1.234567,Juan Pérez,..." />
          <button onClick={handleBulkImport} disabled={bulkLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            <Upload size={14} /> {bulkLoading ? 'Importando...' : `Importar ${bulkText.trim().split('\n').filter(l => l.trim() && !l.startsWith('#')).length} inmuebles`}
          </button>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nuevo inmueble</p>
            <button onClick={() => { setCreating(false); resetForm() }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className={labelClass}>Inmueble *</label><input type="text" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} placeholder="Apto 101" className={inputClass} /></div>
            <div><label className={labelClass}>Tipo</label><select value={unitType} onChange={e => setUnitType(e.target.value)} className={inputClass}>{UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className={labelClass}>Torre</label><input type="text" value={tower} onChange={e => setTower(e.target.value)} placeholder="Torre A" className={inputClass} /></div>
            <div><label className={labelClass}>Piso</label><input type="number" value={floor} onChange={e => setFloor(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Área (m²)</label><input type="number" value={area} onChange={e => setArea(e.target.value)} step="0.01" className={inputClass} /></div>
            <div><label className={labelClass}>Coeficiente % *</label><input type="number" value={coef} onChange={e => setCoef(e.target.value)} step="0.000001" placeholder="1.234567" className={inputClass} /></div>
            <div><label className={labelClass}>Propietario</label><input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Email</label><input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Teléfono</label><input type="text" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Documento</label><input type="text" value={ownerId} onChange={e => setOwnerId(e.target.value)} className={inputClass} /></div>
          </div>
          <button onClick={handleSave} disabled={saving || !unitNumber || !coef}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar inmueble o propietario..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>

      {/* Units table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Home size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay inmuebles registrados</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Inmueble</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Torre</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Coef. %</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Propietario</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{u.unit_number}</td>
                  <td className="py-2 px-3 text-gray-500 capitalize">{u.unit_type}</td>
                  <td className="py-2 px-3 text-gray-500">{u.tower || '—'}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">{u.coeficiente.toFixed(4)}</td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{u.owner_name || '—'}</td>
                  <td className="py-2 px-3 text-gray-400 text-xs">{u.owner_email || u.owner_phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
