'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Clock, CheckCircle, XCircle, Users } from 'lucide-react'

type TicketStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled'

interface Ticket {
  id: string
  queue_number: string
  customer_name: string
  status: TicketStatus
  establishment_id: string
  establishment_name: string
  brand_name: string
  brand_color: string
}

interface Props {
  ticket: Ticket
  initialAhead: number
}

// ── Audio: beeps ascendentes con Web Audio API (funciona en todos los navegadores) ──
function playAlert(times = 1) {
  let played = 0
  const playOnce = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = ctx.currentTime + i * 0.15
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.35, t + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
        osc.start(t)
        osc.stop(t + 0.15)
      })
      played++
      if (played < times) setTimeout(playOnce, 900)
    } catch {}
  }
  playOnce()
}

export function WaitingRoom({ ticket: initialTicket, initialAhead }: Props) {
  const [status, setStatus] = useState<TicketStatus>(initialTicket.status)
  const [ahead, setAhead] = useState(initialAhead)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [calledAt, setCalledAt] = useState<Date | null>(null)
  const [pulse, setPulse] = useState(false)
  const alertFired = useRef(false)
  const primaryColor = initialTicket.brand_color || '#6366f1'

  // ── Supabase Realtime ───────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()

    // 1. Escuchar cambios en ESTE ticket (status)
    const ticketChannel = supabase
      .channel(`ticket-status-${initialTicket.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${initialTicket.id}` },
        (payload) => {
          const newStatus = (payload.new as any).status as TicketStatus
          setStatus(newStatus)
          if ((newStatus === 'in_progress') && !alertFired.current) {
            alertFired.current = true
            if (soundEnabled) playAlert(2)
            setPulse(true)
            setCalledAt(new Date())
            // Vibrar el dispositivo si está disponible (mobile)
            try { navigator.vibrate?.([200, 100, 200, 100, 400]) } catch {}
          }
        }
      )
      .subscribe()

    // 2. Escuchar todos los tickets del establecimiento para actualizar posición
    const queueChannel = supabase
      .channel(`queue-position-${initialTicket.establishment_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `establishment_id=eq.${initialTicket.establishment_id}` },
        async () => {
          // Recalcular posición
          const { count } = await supabase
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('establishment_id', initialTicket.establishment_id)
            .eq('status', 'waiting')
            .lt('queue_number', initialTicket.queue_number)
          setAhead(count ?? 0)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ticketChannel)
      supabase.removeChannel(queueChannel)
    }
  }, [initialTicket.id, initialTicket.establishment_id, initialTicket.queue_number, soundEnabled])

  // ── Rendered UI ─────────────────────────────────────────────────────────────

  if (status === 'in_progress') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #7c3aed 100%)` }}>
        <div className={`w-full max-w-sm text-center ${pulse ? 'animate-bounce' : ''}`}>
          {/* Icono de llamada */}
          <div className="text-7xl mb-4 animate-pulse">📣</div>
          <h1 className="text-white text-3xl font-black mb-2">¡Es tu turno!</h1>
          <p className="text-white/80 mb-8">Por favor acércate a la ventanilla</p>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <p className="text-gray-500 text-sm mb-1">Turno número</p>
            <div className="text-8xl font-black mb-2" style={{ color: primaryColor }}>
              {initialTicket.queue_number}
            </div>
            <p className="text-gray-700 font-medium">{initialTicket.customer_name}</p>
            {calledAt && (
              <p className="text-xs text-gray-400 mt-2">
                Llamado a las {calledAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <p className="text-white/60 text-xs mt-6">{initialTicket.brand_name} · {initialTicket.establishment_name}</p>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-emerald-600">
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={72} className="text-white mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Turno completado</h1>
          <p className="text-white/70">Gracias por tu visita</p>
          <p className="text-white/60 text-xs mt-8">{initialTicket.brand_name}</p>
        </div>
      </div>
    )
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-400 to-gray-600">
        <div className="w-full max-w-sm text-center">
          <XCircle size={72} className="text-white mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-2">Turno cancelado</h1>
          <p className="text-white/70">Este turno fue cancelado</p>
        </div>
      </div>
    )
  }

  // ── En espera ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${primaryColor}22 0%, #f9fafb 40%)` }}>
      {/* Header */}
      <div className="text-center py-6 px-4" style={{ backgroundColor: primaryColor }}>
        <p className="text-white/80 text-sm">{initialTicket.brand_name}</p>
        <h1 className="text-white font-bold text-lg">{initialTicket.establishment_name}</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Ticket number */}
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xs text-center">
          <p className="text-gray-400 text-sm mb-1">Tu turno</p>
          <div className="text-8xl font-black leading-none mb-3" style={{ color: primaryColor }}>
            {initialTicket.queue_number}
          </div>
          <p className="text-gray-700 font-medium">{initialTicket.customer_name}</p>
        </div>

        {/* Queue position */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}22` }}>
              <Users size={20} style={{ color: primaryColor }} />
            </div>
            <div>
              {ahead === 0 ? (
                <>
                  <p className="font-bold text-gray-900">¡Eres el siguiente!</p>
                  <p className="text-xs text-gray-400">Prepárate para ser llamado</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-900">
                    {ahead === 1 ? '1 persona antes que tú' : `${ahead} personas antes que tú`}
                  </p>
                  <p className="text-xs text-gray-400">La pantalla se actualizará en tiempo real</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={15} className="animate-pulse" />
          <span>Esperando tu turno…</span>
        </div>

        {/* Dots animation */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: primaryColor,
                opacity: 0.4,
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 w-full max-w-xs text-center">
          <p className="text-amber-800 text-xs font-medium">
            Mantén esta pantalla abierta para recibir el aviso cuando sea tu turno
          </p>
        </div>
      </div>

      {/* Footer sound toggle */}
      <div className="p-4 flex justify-center">
        <button
          onClick={() => setSoundEnabled(s => !s)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {soundEnabled ? <Bell size={14} /> : <BellOff size={14} />}
          {soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
        </button>
      </div>
    </div>
  )
}
