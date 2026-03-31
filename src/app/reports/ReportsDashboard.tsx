'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { formatDate } from '@/lib/utils'
import { Users, Clock, CheckCircle, TrendingUp, Star, BarChart2 } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

interface Props {
  establishments: { id: string; name: string }[]
}

type Period = 'day' | 'week' | 'month'
type Tab = 'general' | 'establishment' | 'advisor' | 'reason' | 'surveys'

interface TicketStat {
  date: string
  total: number
  done: number
  cancelled: number
}

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
      {(['day', 'week', 'month'] as Period[]).map(p => (
        <button key={p} onClick={() => onChange(p)} className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
          {p === 'day' ? 'Hoy' : p === 'week' ? '7 días' : '30 días'}
        </button>
      ))}
    </div>
  )
}

// ─── TAB: General ─────────────────────────────────────────────────────────────
function GeneralTab({ establishments }: { establishments: { id: string; name: string }[] }) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?.id || '')
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<TicketStat[]>([])
  const [reasonStats, setReasonStats] = useState<{ name: string; count: number }[]>([])
  const [hourStats, setHourStats] = useState<{ hour: string; count: number }[]>([])
  const [totals, setTotals] = useState({ total: 0, done: 0, avg_wait: 0, today: 0 })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!selectedEst) return
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7) }
    else { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1) }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, created_at, attended_at, visit_reason_id, visit_reasons(name)')
      .eq('establishment_id', selectedEst)
      .gte('created_at', startDate.toISOString())
      .order('created_at')

    if (!tickets) { setLoading(false); return }

    const byDate: Record<string, TicketStat> = {}
    tickets.forEach(t => {
      const date = t.created_at.slice(0, 10)
      if (!byDate[date]) byDate[date] = { date, total: 0, done: 0, cancelled: 0 }
      byDate[date].total++
      if (t.status === 'done') byDate[date].done++
      if (t.status === 'cancelled') byDate[date].cancelled++
    })
    setStats(Object.values(byDate).map(s => ({ ...s, date: formatDate(s.date) })))

    const byReason: Record<string, number> = {}
    tickets.forEach(t => {
      const name = (t.visit_reasons as any)?.name || 'Sin motivo'
      byReason[name] = (byReason[name] || 0) + 1
    })
    setReasonStats(Object.entries(byReason).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))

    const byHour: Record<number, number> = {}
    tickets.forEach(t => { const h = new Date(t.created_at).getHours(); byHour[h] = (byHour[h] || 0) + 1 })
    setHourStats(Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}h`, count: byHour[i] || 0 })).filter(h => h.count > 0))

    const today = new Date().toISOString().slice(0, 10)
    const todayCount = tickets.filter(t => t.created_at.startsWith(today)).length
    const doneTickets = tickets.filter(t => t.status === 'done' && t.attended_at)
    const avgWait = doneTickets.length > 0
      ? Math.round(doneTickets.reduce((acc, t) => acc + (new Date(t.attended_at!).getTime() - new Date(t.created_at).getTime()), 0) / doneTickets.length / 60000)
      : 0
    setTotals({ total: tickets.length, done: tickets.filter(t => t.status === 'done').length, avg_wait: avgWait, today: todayCount })
    setLoading(false)
  }, [selectedEst, period])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        {establishments.length > 1 && (
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total período', value: totals.total, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Atendidos', value: totals.done, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hoy', value: totals.today, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Espera prom. (min)', value: totals.avg_wait, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tickets por día</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
            <Bar dataKey="done" fill="#10b981" radius={[4, 4, 0, 0]} name="Atendidos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Por motivo de visita</h3>
          {reasonStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={reasonStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {reasonStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets por hora del día</h3>
          {hourStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: Por Establecimiento ─────────────────────────────────────────────────
function EstablishmentTab({ establishments }: { establishments: { id: string; name: string }[] }) {
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<{ name: string; total: number; done: number; avg_wait: number }[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7) }
    else { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1) }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('establishment_id, status, created_at, attended_at')
      .in('establishment_id', establishments.map(e => e.id))
      .gte('created_at', startDate.toISOString())

    if (!tickets) { setLoading(false); return }

    const byEst: Record<string, { total: number; done: number; wait_sum: number; wait_count: number }> = {}
    tickets.forEach(t => {
      if (!byEst[t.establishment_id]) byEst[t.establishment_id] = { total: 0, done: 0, wait_sum: 0, wait_count: 0 }
      byEst[t.establishment_id].total++
      if (t.status === 'done') {
        byEst[t.establishment_id].done++
        if (t.attended_at) {
          byEst[t.establishment_id].wait_sum += (new Date(t.attended_at).getTime() - new Date(t.created_at).getTime()) / 60000
          byEst[t.establishment_id].wait_count++
        }
      }
    })

    setData(establishments.map(e => {
      const s = byEst[e.id] || { total: 0, done: 0, wait_sum: 0, wait_count: 0 }
      return {
        name: e.name.length > 16 ? e.name.slice(0, 14) + '…' : e.name,
        total: s.total,
        done: s.done,
        avg_wait: s.wait_count > 0 ? Math.round(s.wait_sum / s.wait_count) : 0,
      }
    }))
    setLoading(false)
  }, [establishments, period])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex justify-end mb-6">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tickets por establecimiento</h3>
        {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="done" fill="#10b981" radius={[4, 4, 0, 0]} name="Atendidos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Establecimiento</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Atendidos</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">% Atención</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Espera prom.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(row => (
              <tr key={row.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-right text-gray-700">{row.total}</td>
                <td className="px-4 py-3 text-right text-green-700 font-medium">{row.done}</td>
                <td className="px-4 py-3 text-right text-gray-500">{row.total > 0 ? `${Math.round(row.done / row.total * 100)}%` : '—'}</td>
                <td className="px-4 py-3 text-right text-amber-700">{row.avg_wait > 0 ? `${row.avg_wait} min` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── TAB: Por Asesor ──────────────────────────────────────────────────────────
function AdvisorTab({ establishments }: { establishments: { id: string; name: string }[] }) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?.id || '')
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<{ name: string; done: number; avg_wait: number }[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!selectedEst) return
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7) }
    else { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1) }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('status, created_at, attended_at, advisor_id, profiles(full_name)')
      .eq('establishment_id', selectedEst)
      .eq('status', 'done')
      .gte('created_at', startDate.toISOString())

    if (!tickets) { setLoading(false); return }

    const byAdvisor: Record<string, { name: string; done: number; wait_sum: number; wait_count: number }> = {}
    tickets.forEach(t => {
      const advisorId = t.advisor_id || 'unknown'
      const name = (t.profiles as any)?.full_name || 'Sin asesor'
      if (!byAdvisor[advisorId]) byAdvisor[advisorId] = { name, done: 0, wait_sum: 0, wait_count: 0 }
      byAdvisor[advisorId].done++
      if (t.attended_at) {
        byAdvisor[advisorId].wait_sum += (new Date(t.attended_at).getTime() - new Date(t.created_at).getTime()) / 60000
        byAdvisor[advisorId].wait_count++
      }
    })

    setData(
      Object.values(byAdvisor)
        .map(a => ({ name: a.name, done: a.done, avg_wait: a.wait_count > 0 ? Math.round(a.wait_sum / a.wait_count) : 0 }))
        .sort((a, b) => b.done - a.done)
    )
    setLoading(false)
  }, [selectedEst, period])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        {establishments.length > 1 && (
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Atenciones por asesor</h3>
        {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : data.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Sin datos para el período</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="done" fill="#6366f1" radius={[0, 4, 4, 0]} name="Atendidos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Asesor</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Atendidos</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Espera prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-right text-indigo-700 font-bold">{row.done}</td>
                  <td className="px-4 py-3 text-right text-amber-700">{row.avg_wait > 0 ? `${row.avg_wait} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TAB: Por Motivo ──────────────────────────────────────────────────────────
function ReasonTab({ establishments }: { establishments: { id: string; name: string }[] }) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?.id || '')
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<{ name: string; count: number; done: number }[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!selectedEst) return
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7) }
    else { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1) }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('status, visit_reason_id, visit_reasons(name)')
      .eq('establishment_id', selectedEst)
      .gte('created_at', startDate.toISOString())

    if (!tickets) { setLoading(false); return }

    const byReason: Record<string, { name: string; count: number; done: number }> = {}
    tickets.forEach(t => {
      const key = t.visit_reason_id || 'none'
      const name = (t.visit_reasons as any)?.name || 'Sin motivo'
      if (!byReason[key]) byReason[key] = { name, count: 0, done: 0 }
      byReason[key].count++
      if (t.status === 'done') byReason[key].done++
    })
    setData(Object.values(byReason).sort((a, b) => b.count - a.count))
    setLoading(false)
  }, [selectedEst, period])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        {establishments.length > 1 && (
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Distribución por motivo</h3>
          {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : data.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`} fontSize={11}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Volumen por motivo</h3>
          {loading ? <p className="text-center text-gray-400 py-10">Cargando...</p> : data.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Total" />
                <Bar dataKey="done" fill="#10b981" radius={[0, 4, 4, 0]} name="Atendidos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Motivo</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Atendidos</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">% Resolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{row.count}</td>
                  <td className="px-4 py-3 text-right text-green-700 font-medium">{row.done}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{row.count > 0 ? `${Math.round(row.done / row.count * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── TAB: Encuestas ───────────────────────────────────────────────────────────
function SurveysTab({ establishments }: { establishments: { id: string; name: string }[] }) {
  const [period, setPeriod] = useState<Period>('month')
  const [responses, setResponses] = useState<any[]>([])
  const [npsData, setNpsData] = useState<{ label: string; count: number }[]>([])
  const [avgScores, setAvgScores] = useState<{ nps: number | null; csat: number | null; ces: number | null; count: number }>({ nps: null, csat: null, ces: null, count: 0 })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date
    if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - 7) }
    else { startDate = new Date(now); startDate.setMonth(now.getMonth() - 1) }

    const { data } = await supabase
      .from('survey_responses')
      .select('*, tickets(establishment_id, customer_name)')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Filter by allowed establishments
    const estIds = new Set(establishments.map(e => e.id))
    const filtered = data.filter(r => estIds.has((r.tickets as any)?.establishment_id))
    setResponses(filtered)

    // NPS distribution (1–10)
    const npsDist: Record<number, number> = {}
    let npsSum = 0, npsCount = 0
    let csatSum = 0, csatCount = 0
    let cesSum = 0, cesCount = 0

    filtered.forEach(r => {
      const answers = r.answers as Record<string, any> | null
      if (!answers) return
      Object.entries(answers).forEach(([, val]: [string, any]) => {
        if (val?.type === 'nps' && val.score != null) {
          npsDist[val.score] = (npsDist[val.score] || 0) + 1
          npsSum += val.score; npsCount++
        }
        if (val?.type === 'csat' && val.score != null) { csatSum += val.score; csatCount++ }
        if (val?.type === 'ces' && val.score != null) { cesSum += val.score; cesCount++ }
      })
    })

    setNpsData(Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), count: npsDist[i + 1] || 0 })))
    setAvgScores({
      nps: npsCount > 0 ? Math.round(npsSum / npsCount * 10) / 10 : null,
      csat: csatCount > 0 ? Math.round(csatSum / csatCount * 10) / 10 : null,
      ces: cesCount > 0 ? Math.round(cesSum / cesCount * 10) / 10 : null,
      count: filtered.length,
    })
    setLoading(false)
  }, [establishments, period])

  useEffect(() => { load() }, [load])

  const npsColor = (score: number | null) => {
    if (score == null) return 'text-gray-400'
    if (score >= 9) return 'text-green-600'
    if (score >= 7) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* KPI scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Respuestas', value: avgScores.count, suffix: '', icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'NPS prom.', value: avgScores.nps, suffix: '/10', icon: Star, color: npsColor(avgScores.nps), bg: 'bg-green-50' },
          { label: 'CSAT prom.', value: avgScores.csat, suffix: '/5', icon: Star, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'CES prom.', value: avgScores.ces, suffix: '/5', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, suffix, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${loading ? 'text-gray-300' : color}`}>
                {loading ? '—' : value == null ? '—' : `${value}${suffix}`}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* NPS distribution */}
      {npsData.some(d => d.count > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribución NPS (1–10)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={npsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Respuestas" radius={[4, 4, 0, 0]}>
                {npsData.map((d, i) => (
                  <Cell key={i} fill={Number(d.label) >= 9 ? '#10b981' : Number(d.label) >= 7 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Detractores (1–6)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />Pasivos (7–8)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />Promotores (9–10)</span>
          </div>
        </div>
      )}

      {/* Recent responses */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Respuestas recientes</h3>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-10">Cargando...</p>
        ) : responses.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Sin respuestas en el período</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {responses.map(r => {
              const answers = r.answers as Record<string, any> | null
              const scores: string[] = []
              if (answers) {
                Object.entries(answers).forEach(([, val]: [string, any]) => {
                  if (val?.type && val.score != null) scores.push(`${val.type.toUpperCase()}: ${val.score}`)
                  if (val?.type === 'open' && val.text) scores.push(`"${val.text.slice(0, 60)}${val.text.length > 60 ? '…' : ''}"`)
                })
              }
              return (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{(r.tickets as any)?.customer_name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{scores.join(' · ')}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{new Date(r.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'establishment', label: 'Por Establecimiento' },
  { id: 'advisor', label: 'Por Asesor' },
  { id: 'reason', label: 'Por Motivo' },
  { id: 'surveys', label: 'Encuestas' },
]

export function ReportsDashboard({ establishments }: Props) {
  const [tab, setTab] = useState<Tab>('general')

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralTab establishments={establishments} />}
      {tab === 'establishment' && <EstablishmentTab establishments={establishments} />}
      {tab === 'advisor' && <AdvisorTab establishments={establishments} />}
      {tab === 'reason' && <ReasonTab establishments={establishments} />}
      {tab === 'surveys' && <SurveysTab establishments={establishments} />}
    </div>
  )
}
