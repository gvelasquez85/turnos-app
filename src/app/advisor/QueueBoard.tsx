'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import type { Ticket, AdvisorField, TicketStatus } from '@/types/database'
import { Users, Clock, CheckCircle, X, TrendingUp } from 'lucide-react'
import { AttentionModal } from './AttentionModal'

interface TicketRow extends Ticket {
  visit_reasons: { name: string } | null
}

interface Props {
  establishmentId: string
  advisorId: string
  advisorFields: AdvisorField[]
}

export function QueueBoard({ establishmentId, advisorId, advisorFields }: Props) {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [activeTicket, setActiveTicket] = useState<TicketRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [doneToday, setDoneToday] = useState(0)

  function loadTickets() {
    const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // Active queue
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

    // Atendidos hoy
    supabase
      .from('tickets')
      .select('id', { count: 'exact', head: true })
      .eq('establishment_id', establishmentId)
      .eq('status', 'done')
      .gte('created_at', todayStart.toISOString())
      .then(({ count }) => setDoneToday(count ?? 0))
  }

  useEffect(() => {
    loadTickets()
    const supabase = createClient()
    // Real-time subscription
    const channel = supabase
      .channel(`queue-${establishmentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `establishment_id=eq.${establishmentId}` },
        () => loadTickets()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [establishmentId])

  async function attendTicket(ticket: TicketRow) {
    const supabase = createClient()
    await supabase.from('tickets').update({
      status: 'in_progress',
      advisor_id: advisorId,
      attended_at: new Date().toISOString(),
    }).eq('id', ticket.id)
    setActiveTicket({ ...ticket, status: 'in_progress' })
    // Fire-and-forget push notification to customer
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: ticket.id }),
    }).catch(() => null)
  }

  async function cancelTicket(ticketId: string) {
    const supabase = createClient()
    await supabase.from('tickets').update({ status: 'cancelled' }).eq('id', ticketId)
  }

  const waiting = tickets.filter(t => t.status === 'waiting')
  const inProgress = tickets.filter(t => t.status === 'in_progress')

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400">Cargando cola...</div>
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{waiting.length}</p>
            <p className="text-xs text-gray-500">En espera</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{inProgress.length}</p>
            <p className="text-xs text-gray-500">En atención</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{doneToday}</p>
            <p className="text-xs text-gray-500">Atendidos hoy</p>
          </div>
        </div>
      </div>

      {/* En atención */}
      {inProgress.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">En atención</h2>
          <div className="flex flex-col gap-3">
            {inProgress.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAttend={() => setActiveTicket(ticket)}
                onCancel={() => cancelTicket(ticket.id)}
                inProgress
              />
            ))}
          </div>
        </div>
      )}

      {/* Cola de espera */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cola de espera</h2>
        {waiting.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Sin clientes en espera</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {waiting.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onAttend={() => attendTicket(ticket)}
                onCancel={() => cancelTicket(ticket.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de atención */}
      {activeTicket && (
        <AttentionModal
          ticket={activeTicket}
          advisorId={advisorId}
          advisorFields={advisorFields}
          onClose={() => setActiveTicket(null)}
          onComplete={() => { setActiveTicket(null); loadTickets() }}
        />
      )}
    </>
  )
}

function TicketCard({
  ticket, onAttend, onCancel, inProgress = false
}: {
  ticket: TicketRow
  onAttend: () => void
  onCancel: () => void
  inProgress?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border-2 p-4 flex items-center gap-4 ${inProgress ? 'border-blue-300' : 'border-gray-200'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${inProgress ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
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
      <div className="flex flex-col gap-2">
        <Button size="sm" onClick={onAttend}>
          {inProgress ? 'Ver' : 'Atender'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X size={14} />
        </Button>
      </div>
    </div>
  )
}
