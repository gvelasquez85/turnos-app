'use client'

import { useState } from 'react'
import { ArrowLeft, DollarSign, Plus, Check, X, Filter, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Unit { id: string; unit_number: string; coeficiente: number; owner_name: string | null; owner_email: string | null }
interface Fee {
  id: string; unit_id: string; unit_number: string; period: string; concept: string
  total_amount: number; paid_amount: number; status: string; due_date: string
  paid_at: string | null; payment_ref: string | null
}
interface Props { brandId: string; units: Unit[]; fees: Fee[]; currentPeriod: string }

export default function CuotasManager({ brandId, units, fees: initial, currentPeriod }: Props) {
  const [fees, setFees] = useState(initial)
  const [generating, setGenerating] = useState(false)
  const [genPeriod, setGenPeriod] = useState(currentPeriod)
  const [genConcept, setGenConcept] = useState('Cuota de administración')
  const [genBase, setGenBase] = useState('')
  const [genDueDay, setGenDueDay] = useState('10')
  const [genLoading, setGenLoading] = useState(false)
  const [filterPeriod, setFilterPeriod] = useState(currentPeriod)
  const [filterStatus, setFilterStatus] = useState('all')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payRef, setPayRef] = useState('')

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-green-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const periodFees = fees.filter(f => f.period === filterPeriod)
  const filtered = filterStatus === 'all' ? periodFees : periodFees.filter(f => f.status === filterStatus)
  const totalGenerated = periodFees.reduce((s, f) => s + f.total_amount, 0)
  const totalPaid = periodFees.reduce((s, f) => s + f.paid_amount, 0)
  const paidCount = periodFees.filter(f => f.status === 'paid').length
  const overdueCount = periodFees.filter(f => f.status === 'overdue').length

  const periods = [...new Set(fees.map(f => f.period))].sort().reverse()
  if (!periods.includes(filterPeriod)) periods.unshift(filterPeriod)

  async function handleGenerate() {
    if (!genBase || units.length === 0) return
    setGenLoading(true)
    const supabase = createClient()
    const baseAmount = parseFloat(genBase)
    const dueDate = `${genPeriod}-${genDueDay.padStart(2, '0')}`

    const inserts = units.map(u => ({
      brand_id: brandId, unit_id: u.id, unit_number: u.unit_number,
      period: genPeriod, concept: genConcept,
      total_amount: Math.round(baseAmount * u.coeficiente / 100),
      paid_amount: 0, status: 'pending', due_date: dueDate,
    }))

    const { data } = await supabase.from('copropiedad_fees')
      .upsert(inserts, { onConflict: 'brand_id,unit_id,period' }).select()

    if (data) {
      setFees(prev => {
        const map = new Map(prev.map(f => [`${f.unit_id}-${f.period}`, f]))
        data.forEach((f: any) => map.set(`${f.unit_id}-${f.period}`, f))
        return Array.from(map.values())
      })
    }
    setGenerating(false); setGenLoading(false)
  }

  async function markPaid(fee: Fee) {
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_fees').update({
      status: 'paid', paid_amount: fee.total_amount,
      paid_at: new Date().toISOString(), payment_ref: payRef || null,
    }).eq('id', fee.id).select().single()

    if (data) {
      setFees(prev => prev.map(f => f.id === fee.id ? data as Fee : f))
    }
    setPayingId(null); setPayRef('')
  }

  function downloadReport() {
    const rows = ['Inmueble,Periodo,Concepto,Total,Pagado,Estado,Fecha pago,Referencia']
    periodFees.forEach(f => {
      rows.push(`${f.unit_number},${f.period},${f.concept},${f.total_amount},${f.paid_amount},${f.status},${f.paid_at || ''},${f.payment_ref || ''}`)
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cuotas_${filterPeriod}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    }
    const labels: Record<string, string> = { pending: 'Pendiente', paid: 'Pagada', overdue: 'Vencida', partial: 'Parcial' }
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] || map.pending}`}>{labels[s] || s}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/copropiedades" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><DollarSign size={20} className="text-green-600" /> Cuotas de Administración</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{units.length} unidades activas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50">
            <Download size={13} /> Exportar
          </button>
          <button onClick={() => setGenerating(true)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700">
            <Plus size={15} /> Generar cuotas
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Total facturado</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1">{fmt(totalGenerated)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Recaudado</p>
          <p className="text-lg font-bold text-green-600 mt-1">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Pagadas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}<span className="text-sm text-gray-400">/{periodFees.length}</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 font-medium">Vencidas</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{overdueCount}</p>
        </div>
      </div>

      {/* Generate form */}
      {generating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Generar cuotas del periodo</p>
            <button onClick={() => setGenerating(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <p className="text-xs text-gray-500">Se genera una cuota por unidad, proporcional a su coeficiente de copropiedad.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className={labelClass}>Periodo</label><input type="month" value={genPeriod} onChange={e => setGenPeriod(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Presupuesto total *</label><input type="number" value={genBase} onChange={e => setGenBase(e.target.value)} placeholder="5000000" className={inputClass} /></div>
            <div><label className={labelClass}>Día de vencimiento</label><input type="number" value={genDueDay} onChange={e => setGenDueDay(e.target.value)} min={1} max={28} className={inputClass} /></div>
            <div><label className={labelClass}>Concepto</label><input type="text" value={genConcept} onChange={e => setGenConcept(e.target.value)} className={inputClass} /></div>
          </div>
          {genBase && units.length > 0 && (
            <p className="text-xs text-gray-500">Vista previa: {units[0].unit_number} ({units[0].coeficiente.toFixed(4)}%) → {fmt(Math.round(parseFloat(genBase) * units[0].coeficiente / 100))}</p>
          )}
          <button onClick={handleGenerate} disabled={genLoading || !genBase}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50">
            <Check size={14} /> {genLoading ? 'Generando...' : `Generar ${units.length} cuotas`}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-gray-400" />
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <option value="all">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagada</option>
          <option value="overdue">Vencida</option>
          <option value="partial">Parcial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><DollarSign size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay cuotas para este periodo</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Inmueble</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Concepto</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Pagado</th>
              <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Vencimiento</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{f.unit_number}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{f.concept}</td>
                  <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">{fmt(f.total_amount)}</td>
                  <td className="py-2 px-3 text-right font-mono text-green-600">{fmt(f.paid_amount)}</td>
                  <td className="py-2 px-3 text-center">{statusBadge(f.status)}</td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{f.due_date}</td>
                  <td className="py-2 px-3 text-right">
                    {f.status !== 'paid' && (
                      payingId === f.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Ref. pago" className="border border-gray-200 rounded px-2 py-1 text-xs w-24" />
                          <button onClick={() => markPaid(f)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                          <button onClick={() => setPayingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setPayingId(f.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Registrar pago</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
