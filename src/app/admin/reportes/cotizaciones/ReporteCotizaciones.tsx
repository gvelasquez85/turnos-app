'use client'
import { useMemo } from 'react'
import { FileCheck, CheckCircle, XCircle, Clock, ShoppingCart, TrendingUp } from 'lucide-react'

interface Quote { id: string; status: string; total: number; created_at: string }
interface QuoteItem { product_name: string; qty: number; line_total: number }

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function ReporteCotizaciones({ quotes, quoteItems }: { quotes: Quote[]; quoteItems: QuoteItem[] }) {
  const total = quotes.length
  const byStatus = useMemo(() => {
    const m: Record<string, number> = {}
    quotes.forEach(q => { m[q.status] = (m[q.status] ?? 0) + 1 })
    return m
  }, [quotes])

  const conversionRate = total > 0 ? ((byStatus.converted ?? 0) / total * 100).toFixed(1) : '0'
  const acceptanceRate = total > 0 ? (((byStatus.accepted ?? 0) + (byStatus.converted ?? 0)) / total * 100).toFixed(1) : '0'
  const totalAcceptedValue = quotes
    .filter(q => ['accepted', 'converted'].includes(q.status))
    .reduce((s, q) => s + q.total, 0)

  // Most quoted products
  const productStats = useMemo(() => {
    const map: Record<string, { qty: number; revenue: number; count: number }> = {}
    quoteItems.forEach(item => {
      if (!map[item.product_name]) map[item.product_name] = { qty: 0, revenue: 0, count: 0 }
      map[item.product_name].qty += item.qty
      map[item.product_name].revenue += item.line_total
      map[item.product_name].count++
    })
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.count - a.count)
  }, [quoteItems])

  const STATUS_CFG = [
    { key: 'draft', label: 'Borrador', icon: Clock, color: 'text-gray-500' },
    { key: 'sent', label: 'Enviadas', icon: FileCheck, color: 'text-blue-600' },
    { key: 'accepted', label: 'Aceptadas', icon: CheckCircle, color: 'text-green-600' },
    { key: 'rejected', label: 'Rechazadas', icon: XCircle, color: 'text-red-500' },
    { key: 'converted', label: 'Convertidas', icon: ShoppingCart, color: 'text-purple-600' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Cotizaciones</h1>
        <p className="text-gray-500 text-sm mt-1">{total} cotizaciones en total</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total cotizaciones', value: total, icon: FileCheck, color: 'bg-blue-100 text-blue-700' },
          { label: 'Tasa de aceptación', value: `${acceptanceRate}%`, icon: CheckCircle, color: 'bg-green-100 text-green-700' },
          { label: 'Tasa de conversión', value: `${conversionRate}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
          { label: 'Valor aceptado', value: fmt(totalAcceptedValue), icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}><Icon size={13} /></div>
              <p className="text-xs font-semibold text-gray-500">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Por estado</h3>
          <div className="space-y-3">
            {STATUS_CFG.map(({ key, label, icon: Icon, color }) => {
              const count = byStatus[key] ?? 0
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <Icon size={14} className={color} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-xs font-bold text-gray-900">{count} <span className="font-normal text-gray-400">({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Most quoted products */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Productos más cotizados</h3>
          {productStats.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {productStats.slice(0, 8).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.count} cotizaciones</p>
                  </div>
                  <p className="text-xs font-bold text-gray-700 shrink-0">{fmt(p.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
