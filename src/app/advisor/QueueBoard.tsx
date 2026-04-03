'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatTime } from '@/lib/utils'
import type { Ticket, AdvisorField, TicketStatus } from '@/types/database'
import { Users, Clock, CheckCircle, TrendingUp, QrCode, BarChart2, ChevronDown } from 'lucide-react'
import QRCode from 'qrcode'

interface TicketRow extends Ticket {
  visit_reasons: { name: string } | null
}

interface DailyStat {
  done: number
  avgAttentionMin: number
  topReasons: { name: string; count: number }[]
}

interface Props {
  establishmentId: string
  establishmentSlug: string
  advisorId: string
  advisorFields: AdvisorField[]
}

// ─── Inline attention panel ────────────────────────────────────────────────────
function AttentionPanel({ ticket, advisorId, advisorFields, onComplete }: {
  ticket: TicketRow
  advisorId: string
  advisorFields: AdvisorField[]
  onComplete: () => void
}) {
  const [fieldsData, setFieldsData] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = ticket.attended_at ? new Date(ticket.attended_at).getTime() : Date.now()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [ticket.attended_at])

  function fmtElapsed(s: number) {
    const m = Math.floor(s / 60), sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  async function handleComplete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('attentions').insert({
      ticket_id: ticket.id,
      advisor_id: advisorId,
      establishment_id: ticket.establishment_id,
      fields_data: fieldsData,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    })
    await supabase.from('tickets').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', ticket.id)
    setLoading(false)
    onComplete()
  }

  function renderField(field: AdvisorField) {
    const value = fieldsData[field.id] || ''
    const onChange = (val: string) => setFieldsData(d => ({ ...d, [field.id]: val }))
    if (field.field_type === 'select' && field.options) {
      return (
        <Select key={field.id} label={`${field.label}${field.required ? ' *' : ''}`} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Seleccionar...</option>
          {(field.options as string[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </Select>
      )
    }
    if (field.field_type === 'textarea') {
      return (
        <div key={field.id} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{field.label}{field.required && ' *'}</label>
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      )
    }
    return (
      <Input key={field.id} label={`${field.label}${field.required ? ' *' : ''}`}
        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
        value={value} onChange={e => onChange(e.target.value)} />
    )
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 mb-6">
      {/* Header with live timer */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Cliente en atención
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            #{ticket.queue_number} — {ticket.customer_name}
          </h2>
          {ticket.visit_reasons?.name && (
            <p className="text-sm text-gray-500">{ticket.visit_reasons.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-blue-700">{fmtElapsed(elapsed)}</p>
          <p className="text-xs text-blue-500">Tiempo de atención</p>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl p-3 mb-4 text-sm flex flex-wrap gap-x-6 gap-y-1">
        {ticket.customer_phone && <span className="text-gray-600">📱 {ticket.customer_phone}</span>}
        {ticket.customer_email && <span className="text-gray-600">✉️ {ticket.customer_email}</span>}
        <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.marketing_opt_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {ticket.marketing_opt_in ? '✓ Acepta publicidad' : 'No acepta publicidad'}
        </span>
      </div>

      {/* Advisor fields */}
      {advisorFields.length > 0 && (
        <div className="bg-white rounded-xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información de la atención</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advisorFields.map(renderField)}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-xl p-4 mb-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas internas</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observaciones..."
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      <Button size="lg" className="w-full" loading={loading} onClick={handleComplete}>
        <CheckCircle size={16} className="mr-2" /> Marcar como atendido
      </Button>
    </div>
  )
}

// ─── QR Panel ─────────────────────────────────────────────────────────────────
function QRPanel({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/t/${slug}`
    : `/t/${slug}`

  useEffect(() => {
    if (canvasRef.current && slug) {
      QRCode.toCanvas(canvasRef.current, `${window.location.origin}/t/${slug}`, {
        width: 180,
        margin: 1,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      })
    }
  }, [slug])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center justify-center gap-1">
        <QrCode size={12} /> QR de turno
      </p>
      <canvas ref={canvasRef} className="mx-auto rounded-lg" />
      <p className="text-[10px] text-gray-400 mt-2 break-all">/t/{slug}</p>
    </div>
  )
}

// ─── Mini stats ────────────────────────────────────────────────────────────────
function MiniStats({ stats }: { stats: DailyStat }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span className="flex items-center gap-2"><BarChart2 size={14} className="text-indigo-500" /> Mi rendimiento hoy</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-indigo-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700">{stats.done}</p>
              <p className="text-xs text-indigo-500">Atendidos</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{stats.avgAttentionMin > 0 ? `${stats.avgAttentionMin}m` : '—'}</p>
              <p className="text-xs text-green-500">Prom. atención</p>
            </div>
          </div>
          {stats.topReasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Top motivos</p>
              {stats.topReasons.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-700 mb-1">
                  <span className="truncate mr-2">{r.name}</span>
                  <span className="font-bold text-indigo-600 shrink-0">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main QueueBoard ───────────────────────────────────────────────────────────
export function QueueBoard({ establishmentId, establishmentSlug, advisorId, advisorFields }: Props) {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [doneToday, setDoneToday] = useState(0)
  const [dailyStats, setDailyStats] = useState<DailyStat>({ done: 0, avgAttentionMin: 0, topReasons: [] })

  const loadTickets = useCallback(() => {
    const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    supabase
      .from('tickets')
      .select('*, visit_reasons(name)')
      .eq('establishment_id', establishmentId)
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTickets((data as TicketRow[]) || [])
        setLoading(false)
      })

    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .eq('status', 'done')
      .gte('created_at', todayStart.toISOString())
      .then(({ count }) => setDoneToday(count ?? 0))
  }, [establishmentId])

  // Load daily stats for mini dashboard (advisor-specific)
  const loadDailyStats = useCallback(async () => {
    const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: doneTickets } = await supabase
      .from('tickets')
      .select('attended_at, completed_at, visit_reasons(name)')
      .eq('establishment_id', establishmentId)
      .eq('advisor_id', advisorId)
      .eq('status', 'done')
      .gte('created_at', todayStart.toISOString())

    if (!doneTickets) return
    let totalMs = 0, count = 0
    const reasonCount: Record<string, number> = {}
    doneTickets.forEach((t: any) => {
      if (t.attended_at && t.completed_at) {
        totalMs += new Date(t.completed_at).getTime() - new Date(t.attended_at).getTime()
        count++
      }
      const name = t.visit_reasons?.name || 'Sin motivo'
      reasonCount[name] = (reasonCount[name] || 0) + 1
    })
    const avgAttentionMin = count > 0 ? Math.round(totalMs / count / 60000) : 0
    const topReasons = Object.entries(reasonCount).map(([name, cnt]) => ({ name, count: cnt })).sort((a, b) => b.count - a.count)
    setDailyStats({ done: doneTickets.length, avgAttentionMin, topReasons })
  }, [establishmentId, advisorId])

  useEffect(() => {
    loadTickets()
    loadDailyStats()
    const supabase = createClient()
    const channel = supabase
      .channel(`queue-${establishmentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `establishment_id=eq.${establishmentId}` }, () => {
        loadTickets()
        loadDailyStats()
      })
      .subscribe()
    // Polling fallback every 5s in case realtime replication is not enabled on tickets table
    const poll = setInterval(() => {
      loadTickets()
    }, 5000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [establishmentId, loadTickets, loadDailyStats])

  function dispatchEvent(event: string, ticketId: string) {
    fetch('/api/internal/webhooks/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, ticket_id: ticketId }),
    }).catch(() => null)
  }

  async function attendTicket(ticket: TicketRow) {
    const supabase = createClient()
    const now = new Date().toISOString()
    await supabase.from('tickets').update({ status: 'in_progress', advisor_id: advisorId, attended_at: now }).eq('id', ticket.id)
    setActiveTicket({ ...ticket, status: 'in_progress', attended_at: now })
    fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: ticket.id }) }).catch(() => null)
    dispatchEvent('ticket.attended', ticket.id)
  }

  const waiting = tickets.filter(t => t.status === 'waiting')
  const inProgress = tickets.filter(t => t.status === 'in_progress')

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando cola...</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* ── Left column: queue ──────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'En espera', value: waiting.length, color: 'bg-yellow-100 text-yellow-600', icon: Clock },
            { label: 'En atención', value: inProgress.length, color: 'bg-blue-100 text-blue-600', icon: Users },
            { label: 'Atendidos hoy', value: doneToday, color: 'bg-green-100 text-green-600', icon: TrendingUp },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
              <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon size={17} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Inline attention panel */}
        {activeTicket && (
          <AttentionPanel
            ticket={activeTicket}
            advisorId={advisorId}
            advisorFields={advisorFields}
            onComplete={() => {
              dispatchEvent('ticket.done', activeTicket.id)
              setActiveTicket(null)
              loadTickets()
              loadDailyStats()
            }}
          />
        )}

        {/* In-progress (otros agentes) — sin el activeTicket ya mostrado arriba */}
        {inProgress.filter(t => t.id !== activeTicket?.id).length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">En atención (otros)</h2>
            <div className="flex flex-col gap-2">
              {inProgress.filter(t => t.id !== activeTicket?.id).map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onAttend={() => setActiveTicket(ticket)} inProgress />
              ))}
            </div>
          </div>
        )}

        {/* Waiting queue */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cola de espera</h2>
          {waiting.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Sin clientes en espera</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {waiting.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} onAttend={() => attendTicket(ticket)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar: QR + mini stats ─────────────────────── */}
      <div className="lg:w-56 flex flex-col gap-4 shrink-0">
        {establishmentSlug && <QRPanel slug={establishmentSlug} />}
        <MiniStats stats={dailyStats} />
      </div>
    </div>
  )
}

function TicketCard({ ticket, onAttend, inProgress = false }: {
  ticket: TicketRow
  onAttend: () => void
  inProgress?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border-2 p-4 flex items-center gap-3 ${inProgress ? 'border-blue-300' : 'border-gray-200'}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${inProgress ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
        {ticket.queue_number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{ticket.customer_name}</p>
        <p className="text-xs text-gray-500 truncate">{ticket.visit_reasons?.name || 'Sin motivo'}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={ticket.status as TicketStatus}>{ticket.status}</Badge>
          <span className="text-xs text-gray-400">{formatTime(ticket.created_at)}</span>
        </div>
      </div>
      <Button size="sm" onClick={onAttend}>
        {inProgress ? 'Ver' : 'Atender'}
      </Button>
    </div>
  )
}
