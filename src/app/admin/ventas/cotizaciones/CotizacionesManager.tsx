'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileCheck, Plus, Search, Clock, CheckCircle, XCircle,
  Send, RotateCcw, ChevronRight, ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'

interface Quote {
  id: string
  status: string
  total: number
  created_at: string
  establishment_id: string | null
  customer_id: string | null
  notes: string | null
  customers: { name: string } | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-500',    icon: Clock },
  sent:      { label: 'Enviada',    color: 'bg-blue-100 text-blue-700',    icon: Send },
  accepted:  { label: 'Aceptada',   color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected:  { label: 'Rechazada',  color: 'bg-red-100 text-red-600',      icon: XCircle },
  converted: { label: 'Convertida', color: 'bg-purple-100 text-purple-700', icon: ShoppingCart },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function CotizacionesManager({ brandId, quotes: initial, establishments }: {
  brandId: string; quotes: Quote[]; establishments: { id: string; name: string }[]
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const filtered = useMemo(() => {
    let list = [...quotes]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(x => x.customers?.name?.toLowerCase().includes(q) || x.notes?.toLowerCase().includes(q))
    }
    if (filterStatus) list = list.filter(x => x.status === filterStatus)
    return list
  }, [quotes, search, filterStatus])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    const supabase = createClient()
    const patch: Record<string, unknown> = { status }
    // Convert to sale if accepted → converted
    if (status === 'converted') {
      // Create a new sale record from this quote
      const quote = quotes.find(q => q.id === id)
      if (quote) {
        await supabase.from('sales').insert({
          brand_id: brandId,
          establishment_id: quote.establishment_id,
          customer_id: quote.customer_id,
          type: 'sale',
          status: 'completed',
          total: quote.total,
          subtotal: quote.total,
          notes: `Convertida de cotización #${id.slice(-6).toUpperCase()}`,
        })
      }
    }
    const { data } = await supabase.from('sales').update(patch).eq('id', id).select().single()
    if (data) setQuotes(qs => qs.map(q => q.id === id ? { ...q, ...data } : q))
    setUpdating(null)
  }

  // KPIs
  const total = quotes.length
  const pending = quotes.filter(q => q.status === 'sent').length
  const accepted = quotes.filter(q => q.status === 'accepted').length
  const totalValue = quotes.filter(q => ['accepted', 'converted'].includes(q.status)).reduce((s, q) => s + q.total, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">{total} cotizaciones en total</p>
        </div>
        <Link
          href="/admin/ventas/nueva-venta?type=quote"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} /> Nueva cotización
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: total, color: 'bg-gray-100 text-gray-600' },
          { label: 'Enviadas', value: pending, color: 'bg-blue-100 text-blue-700' },
          { label: 'Aceptadas', value: accepted, color: 'bg-green-100 text-green-700' },
          { label: 'Valor aceptado', value: fmt(totalValue), color: 'bg-purple-100 text-purple-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Buscar por cliente o notas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
          <FileCheck size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Sin cotizaciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
          {filtered.map(q => {
            const s = STATUS_MAP[q.status] ?? STATUS_MAP.draft
            const Icon = s.icon
            return (
              <div key={q.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{q.customers?.name ?? 'Sin cliente'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                    {q.establishment_id && (
                      <span className="text-[10px] text-gray-400">{estMap[q.establishment_id]}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{fmt(q.total)}</p>
                  <p className="text-[10px] text-gray-400">{fmtDate(q.created_at)}</p>
                </div>
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {q.status === 'draft' && (
                    <button
                      onClick={() => updateStatus(q.id, 'sent')}
                      disabled={updating === q.id}
                      className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                    >
                      Enviar
                    </button>
                  )}
                  {q.status === 'sent' && (
                    <>
                      <button
                        onClick={() => updateStatus(q.id, 'accepted')}
                        disabled={updating === q.id}
                        className="px-2 py-1 rounded-lg text-xs bg-green-50 text-green-700 hover:bg-green-100 font-medium"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => updateStatus(q.id, 'rejected')}
                        disabled={updating === q.id}
                        className="px-2 py-1 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {q.status === 'accepted' && (
                    <button
                      onClick={() => updateStatus(q.id, 'converted')}
                      disabled={updating === q.id}
                      className="px-2 py-1 rounded-lg text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
                    >
                      → Venta
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
