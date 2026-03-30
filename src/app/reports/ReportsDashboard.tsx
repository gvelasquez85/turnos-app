'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatDate } from '@/lib/utils'
import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

interface Props {
  establishments: { id: string; name: string }[]
}

type Period = 'day' | 'week' | 'month'

interface TicketStat {
  date: string
  total: number
  done: number
  cancelled: number
}

export function ReportsDashboard({ establishments }: Props) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?.id || '')
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<TicketStat[]>([])
  const [reasonStats, setReasonStats] = useState<{ name: string; count: number }[]>([])
  const [hourStats, setHourStats] = useState<{ hour: string; count: number }[]>([])
  const [totals, setTotals] = useState({ total: 0, done: 0, avg_wait: 0, today: 0 })
  const [loading, setLoading] = useState(false)

  const loadStats = useCallback(async () => {
    if (!selectedEst) return
    setLoading(true)
    const supabase = createClient()
    const now = new Date()
    let startDate: Date

    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
      startDate = new Date(now); startDate.setDate(now.getDate() - 7)
    } else {
      startDate = new Date(now); startDate.setMonth(now.getMonth() - 1)
    }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, created_at, attended_at, completed_at, visit_reason_id, visit_reasons(name)')
      .eq('establishment_id', selectedEst)
      .gte('created_at', startDate.toISOString())
      .order('created_at')

    if (!tickets) { setLoading(false); return }

    // Group by date
    const byDate: Record<string, TicketStat> = {}
    tickets.forEach(t => {
      const date = t.created_at.slice(0, 10)
      if (!byDate[date]) byDate[date] = { date, total: 0, done: 0, cancelled: 0 }
      byDate[date].total++
      if (t.status === 'done') byDate[date].done++
      if (t.status === 'cancelled') byDate[date].cancelled++
    })
    setStats(Object.values(byDate).map(s => ({ ...s, date: formatDate(s.date) })))

    // Group by reason
    const byReason: Record<string, number> = {}
    tickets.forEach(t => {
      const name = (t.visit_reasons as any)?.name || 'Sin motivo'
      byReason[name] = (byReason[name] || 0) + 1
    })
    setReasonStats(Object.entries(byReason).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))

    // Group by hour
    const byHour: Record<number, number> = {}
    tickets.forEach(t => {
      const hour = new Date(t.created_at).getHours()
      byHour[hour] = (byHour[hour] || 0) + 1
    })
    setHourStats(Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}h`, count: byHour[i] || 0 })).filter(h => h.count > 0))

    // Totals
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = tickets.filter(t => t.created_at.startsWith(today)).length
    const doneTickets = tickets.filter(t => t.status === 'done' && t.attended_at)
    const avgWait = doneTickets.length > 0
      ? Math.round(doneTickets.reduce((acc, t) => acc + (new Date(t.attended_at!).getTime() - new Date(t.created_at).getTime()), 0) / doneTickets.length / 60000)
      : 0
    setTotals({ total: tickets.length, done: tickets.filter(t => t.status === 'done').length, avg_wait: avgWait, today: todayCount })
    setLoading(false)
  }, [selectedEst, period])

  useEffect(() => { loadStats() }, [loadStats])

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {establishments.length > 1 && (
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {(['day', 'week', 'month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 text-sm font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {p === 'day' ? 'Hoy' : p === 'week' ? '7 días' : '30 días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Tickets por día */}
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
        {/* Por motivo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Por motivo de visita</h3>
          {reasonStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={reasonStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {reasonStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por hora */}
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
