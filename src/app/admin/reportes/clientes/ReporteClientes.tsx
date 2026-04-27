'use client'
import { useState, useMemo } from 'react'
import {
  Users, UserPlus, RotateCcw, Star, TrendingUp,
  Calendar, Building2, AlertTriangle, ArrowUpRight,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  total_visits: number
  first_visit_at: string
  last_visit_at: string
  establishment_ids: string[]
}

type Period = 'today' | 'week' | 'month' | 'year' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy', week: 'Esta semana', month: 'Este mes', year: 'Este año', all: 'Todo el tiempo',
}

function periodStart(p: Period): Date {
  const now = new Date()
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (p === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d }
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (p === 'year') return new Date(now.getFullYear(), 0, 1)
  return new Date(0)
}

export function ReporteClientes({ customers, establishments }: {
  customers: Customer[]
  establishments: { id: string; name: string }[]
}) {
  const [period, setPeriod] = useState<Period>('month')
  const [filterEst, setFilterEst] = useState('')

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])
  const start = periodStart(period)

  const base = useMemo(() => {
    let list = customers
    if (filterEst) list = list.filter(c => c.establishment_ids.includes(filterEst))
    return list
  }, [customers, filterEst])

  // New customers in period (first_visit_at within period)
  const newInPeriod = useMemo(() =>
    base.filter(c => new Date(c.first_visit_at) >= start), [base, start])

  // Returning in period (last_visit_at in period, but not new)
  const returningInPeriod = useMemo(() =>
    base.filter(c => new Date(c.last_visit_at) >= start && new Date(c.first_visit_at) < start),
    [base, start])

  // Frequent (4+ visits)
  const frequent = useMemo(() => base.filter(c => c.total_visits >= 4), [base])

  // Loyal (10+ visits)
  const loyal = useMemo(() => base.filter(c => c.total_visits >= 10), [base])

  // At risk: last visit > 60 days ago
  const atRisk = useMemo(() =>
    base.filter(c => {
      const days = Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000)
      return days > 60 && c.total_visits >= 2
    }), [base])

  // Lost: last visit > 90 days
  const lost = useMemo(() =>
    base.filter(c => {
      const days = Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000)
      return days > 90
    }), [base])

  // By establishment
  const byEst = useMemo(() => {
    const map: Record<string, number> = {}
    base.forEach(c => {
      c.establishment_ids.forEach(eid => {
        map[eid] = (map[eid] ?? 0) + 1
      })
    })
    return Object.entries(map)
      .map(([id, count]) => ({ id, name: estMap[id] ?? id, count }))
      .sort((a, b) => b.count - a.count)
  }, [base, estMap])

  // Visit distribution
  const visitDist = useMemo(() => [
    { label: 'Nuevos (1 visita)', count: base.filter(c => c.total_visits === 1).length, color: 'bg-blue-500' },
    { label: 'Ocasionales (2–3)', count: base.filter(c => c.total_visits >= 2 && c.total_visits <= 3).length, color: 'bg-amber-500' },
    { label: 'Frecuentes (4–9)', count: base.filter(c => c.total_visits >= 4 && c.total_visits <= 9).length, color: 'bg-green-500' },
    { label: 'Fieles (10+)', count: base.filter(c => c.total_visits >= 10).length, color: 'bg-purple-500' },
  ], [base])

  const totalBase = base.length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte de Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{totalBase} clientes totales</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {establishments.length > 1 && (
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={filterEst}
              onChange={e => setFilterEst(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          )}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: `Nuevos (${PERIOD_LABELS[period].toLowerCase()})`, value: newInPeriod.length, icon: UserPlus, color: 'bg-blue-100 text-blue-700', sub: 'primera visita' },
          { label: `Recurrentes (${PERIOD_LABELS[period].toLowerCase()})`, value: returningInPeriod.length, icon: RotateCcw, color: 'bg-green-100 text-green-700', sub: 'volvieron a visitar' },
          { label: 'Frecuentes', value: frequent.length, icon: TrendingUp, color: 'bg-amber-100 text-amber-700', sub: '4+ visitas' },
          { label: 'Fieles', value: loyal.length, icon: Star, color: 'bg-purple-100 text-purple-700', sub: '10+ visitas' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={13} />
              </div>
              <p className="text-xs font-semibold text-gray-500 leading-tight">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-[11px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Visit distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Distribución por frecuencia</h3>
          <div className="space-y-3">
            {visitDist.map(({ label, count, color }) => {
              const pct = totalBase > 0 ? (count / totalBase) * 100 : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-bold text-gray-900">{count} <span className="font-normal text-gray-400">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By establishment */}
        {establishments.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Por sucursal</h3>
            <div className="space-y-2">
              {byEst.map(({ name, count }) => {
                const pct = totalBase > 0 ? (count / totalBase) * 100 : 0
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Building2 size={11} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700 truncate">{name}</span>
                        <span className="text-xs font-bold text-gray-900 ml-2">{count}</span>
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
        )}
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* At risk */}
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">En riesgo</p>
              <p className="text-xs text-gray-400">Sin visitar en 60–90 días</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-amber-600">{atRisk.length}</span>
          </div>
          {atRisk.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-1.5 border-t border-gray-50 first:border-0">
              <p className="text-xs font-medium text-gray-700 truncate">{c.name}</p>
              <p className="text-xs text-gray-400 shrink-0 ml-2">
                {Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000)}d sin visitar
              </p>
            </div>
          ))}
          {atRisk.length > 5 && (
            <p className="text-xs text-amber-600 mt-2">+{atRisk.length - 5} más</p>
          )}
        </div>

        {/* Lost */}
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Perdidos</p>
              <p className="text-xs text-gray-400">Más de 90 días sin visitar</p>
            </div>
            <span className="ml-auto text-2xl font-bold text-red-500">{lost.length}</span>
          </div>
          {lost.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-1.5 border-t border-gray-50 first:border-0">
              <p className="text-xs font-medium text-gray-700 truncate">{c.name}</p>
              <p className="text-xs text-gray-400 shrink-0 ml-2">
                {Math.floor((Date.now() - new Date(c.last_visit_at).getTime()) / 86400000)}d
              </p>
            </div>
          ))}
          {lost.length > 5 && (
            <p className="text-xs text-red-500 mt-2">+{lost.length - 5} más</p>
          )}
        </div>
      </div>
    </div>
  )
}
