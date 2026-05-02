'use client'
import { useState, useMemo } from 'react'
import { DollarSign, ShoppingCart, TrendingUp, Users, AlertTriangle } from 'lucide-react'
import { DateRangeFilter, presetRange, type DateRange, type Preset } from '@/components/ui/DateRangeFilter'
import { SALE_COMPLETED_SET } from '@/lib/saleStatus'

interface Sale {
  id: string; status: string; total: number; subtotal: number; discount: number
  created_at: string; establishment_id: string | null; customer_id: string | null
  customers: { name: string } | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function groupByDay(sales: Sale[]) {
  const map: Record<string, number> = {}
  sales.forEach(s => {
    const day = s.created_at.slice(0, 10)
    map[day] = (map[day] ?? 0) + s.total
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
}

export function ReporteVentas({ sales: allSales, establishments }: {
  sales: Sale[]; establishments: { id: string; name: string }[]
}) {
  const [preset, setPreset] = useState<Preset>('month')
  const [range, setRange] = useState<DateRange>(presetRange('month'))
  const [filterEst, setFilterEst] = useState('')

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  // All non-cancelled in period — this is THE canonical count users see everywhere
  const allInPeriod = useMemo(() => {
    let list = allSales.filter(s =>
      s.status !== 'cancelled' &&
      new Date(s.created_at) >= range.from &&
      new Date(s.created_at) <= range.to
    )
    if (filterEst) list = list.filter(s => s.establishment_id === filterEst)
    return list
  }, [allSales, range, filterEst])

  // Subset: completed (facturado+) — for revenue
  const filtered = useMemo(() =>
    allInPeriod.filter(s => SALE_COMPLETED_SET.has(s.status)),
    [allInPeriod])

  // Subset: pending — shown as separate indicator
  const pendingInPeriod = useMemo(() =>
    allInPeriod.filter(s => s.status === 'pending'),
    [allInPeriod])

  const totalCount   = allInPeriod.length          // canonical count
  const totalRev     = filtered.reduce((s, x) => s + x.total, 0)
  const totalDiscount = filtered.reduce((s, x) => s + (x.discount ?? 0), 0)
  const avgTicket    = filtered.length > 0 ? totalRev / filtered.length : 0
  const uniqueCustomers = new Set(filtered.map(s => s.customer_id).filter(Boolean)).size
  const pendingRevenue  = pendingInPeriod.reduce((s, x) => s + x.total, 0)

  const byEst = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    filtered.forEach(s => {
      const k = s.establishment_id ?? '__none__'
      if (!map[k]) map[k] = { count: 0, total: 0 }
      map[k].count++; map[k].total += s.total
    })
    return Object.entries(map)
      .map(([id, v]) => ({ name: id === '__none__' ? 'Sin sucursal' : (estMap[id] ?? id), ...v }))
      .sort((a, b) => b.total - a.total)
  }, [filtered, estMap])

  const dailyData = groupByDay(filtered)
  const maxDaily = Math.max(...dailyData.map(([, v]) => v), 1)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">{totalCount} venta{totalCount !== 1 ? 's' : ''} en el período{pendingInPeriod.length > 0 ? ` · ${pendingInPeriod.length} pendiente${pendingInPeriod.length > 1 ? 's' : ''}` : ''}</p>
        </div>
        <DateRangeFilter
          value={range}
          preset={preset}
          onChange={(r, p) => { setRange(r); setPreset(p) }}
          estOptions={establishments}
          estValue={filterEst}
          onEstChange={setFilterEst}
        />
      </div>

      {/* Pending indicator */}
      {pendingInPeriod.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800">
            {pendingInPeriod.length} venta{pendingInPeriod.length > 1 ? 's' : ''} pendiente{pendingInPeriod.length > 1 ? 's' : ''} ({fmt(pendingRevenue)}) no incluidas en los ingresos
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Ingresos facturados', value: fmt(totalRev), icon: DollarSign, color: 'bg-emerald-100 text-emerald-700' },
          { label: 'Ventas', value: totalCount, icon: ShoppingCart, color: 'bg-blue-100 text-blue-700' },
          { label: 'Ticket promedio', value: fmt(avgTicket), icon: TrendingUp, color: 'bg-indigo-100 text-indigo-700' },
          { label: 'Clientes únicos', value: uniqueCustomers, icon: Users, color: 'bg-purple-100 text-purple-700' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ventas por día</h3>
          {dailyData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos en el período</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {dailyData.map(([day, val]) => {
                const h = Math.max(4, (val / maxDaily) * 100)
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {fmt(val)}
                    </div>
                    <div className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-600 transition-colors cursor-default" style={{ height: `${h}%` }} />
                    <span className="text-[8px] text-gray-400 rotate-45 origin-left mt-1 hidden sm:block">
                      {new Date(day + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {totalDiscount > 0 && (
            <p className="text-xs text-gray-400 mt-3">Descuentos aplicados: <strong>{fmt(totalDiscount)}</strong></p>
          )}
        </div>

        {/* By establishment */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Por sucursal</h3>
          {byEst.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {byEst.map(({ name, count, total }) => (
                <div key={name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                    <span className="text-xs font-bold text-gray-900 ml-2">{fmt(total)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(total / totalRev) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{count} ventas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
