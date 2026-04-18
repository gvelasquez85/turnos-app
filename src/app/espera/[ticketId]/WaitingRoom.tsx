'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, BellOff, Clock, CheckCircle, XCircle, Users, Wifi, WifiOff } from 'lucide-react'

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

// ── Audio: beeps ascendentes con Web Audio API ────────────────────────────────
function playAlert(times = 1) {
  let played = 0
  const once = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const notes = [523, 659, 784, 1047]
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
      if (played < times) setTimeout(once, 900)
    } catch {}
  }
  once()
}

// ── Polling interval ─────────────────────────────────────────────────────────
// 4s cuando el turno está próximo (0-2 personas adelante), 8s en espera normal
function pollInterval(ahead: number, status: TicketStatus) {
  if (status !== 'waiting') return null   // dejar de hacer polling
  return ahead <= 2 ? 4000 : 8000
}

export function WaitingRoom({ ticket: initialTicket, initialAhead }: Props) {
  const [status, setStatus] = useState<TicketStatus>(initialTicket.status)
  const [ahead, setAhead] = useState(initialAhead)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [calledAt, setCalledAt] = useState<Date | null>(null)
  const [pulse, setPulse] = useState(false)
  const [connected, setConnected] = useState(true)
  const alertFired = useRef(false)
  const primaryColor = initialTicket.brand_color || '#6366f1'

  const handleCalled = useCallback(() => {
    if (alertFired.current) return
    alertFired.current = true
    if (soundEnabled) playAlert(2)
    setPulse(true)
    setCalledAt(new Date())
    try { navigator.vibrate?.([200, 100, 200, 100, 400]) } catch {}
  }, [soundEnabled])

  // ── Polling principal (funciona en Safari, Chrome, Firefox, sin RLS issues) ──
  useEffect(() => {
    if (status === 'done' || status === 'cancelled') return

    let timeoutId: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const res = await fetch(`/api/espera/${initialTicket.id}`, { cache: 'no-store' })
        if (!res.ok) { setConnected(false); return }
        const data = await res.json() as { status: TicketStatus; ahead: number }
        setConnected(true)

        // Actualizar posición en cola
        setAhead(data.ahead)

        // Detectar cambio de estado
        setStatus(prev => {
          if (prev !== data.status) {
            if (data.status === 'in_progress') handleCalled()
          }
          return data.status
        })

        // Reprogramar solo si sigue en espera
        const delay = pollInterval(data.ahead, data.status)
        if (delay) timeoutId = setTimeout(poll, delay)
      } catch {
        setConnected(false)
        timeoutId = setTimeout(poll, 10000) // retry en 10s si falla
      }
    }

    // Primera consulta a los 2s para no bloquear el render inicial
    timeoutId = setTimeout(poll, 2000)

    return () => clearTimeout(timeoutId)
  }, [initialTicket.id, status, handleCalled])

  // ── Visibilidad: polling inmediato al volver al tab ───────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && status === 'waiting') {
        // Forzar consulta inmediata refrescando el estado
        fetch(`/api/espera/${initialTicket.id}`, { cache: 'no-store' })
          .then(r => r.json())
          .then((data: { status: TicketStatus; ahead: number }) => {
            setAhead(data.ahead)
            setStatus(prev => {
              if (prev !== data.status && data.status === 'in_progress') handleCalled()
              return data.status
            })
          })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [initialTicket.id, status, handleCalled])

  // ── UI: turno llamado ─────────────────────────────────────────────────────
  if (status === 'in_progress') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #7c3aed 100%)` }}
      >
        <div className={`w-full max-w-sm text-center ${pulse ? 'animate-bounce' : ''}`}>
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

          <p className="text-white/60 text-xs mt-6">
            {initialTicket.brand_name} · {initialTicket.establishment_name}
          </p>
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
          <p className="text-white/50 text-xs mt-8">{initialTicket.brand_name}</p>
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

  // ── UI: en espera ─────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(180deg, ${primaryColor}22 0%, #f9fafb 40%)` }}
    >
      {/* Header */}
      <div className="text-center py-6 px-4 flex items-center justify-between" style={{ backgroundColor: primaryColor }}>
        <div className="w-8" />
        <div>
          <p className="text-white/80 text-sm">{initialTicket.brand_name}</p>
          <h1 className="text-white font-bold text-lg">{initialTicket.establishment_name}</h1>
        </div>
        {/* Indicador de conexión */}
        <div className="w-8 flex justify-end">
          {connected
            ? <Wifi size={16} className="text-white/60" />
            : <WifiOff size={16} className="text-white/60 animate-pulse" />}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
        {/* Número de turno */}
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-xs text-center">
          <p className="text-gray-400 text-sm mb-1">Tu turno</p>
          <div className="text-8xl font-black leading-none mb-3" style={{ color: primaryColor }}>
            {initialTicket.queue_number}
          </div>
          <p className="text-gray-700 font-medium">{initialTicket.customer_name}</p>
        </div>

        {/* Posición en cola */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${primaryColor}22` }}>
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
                  <p className="text-xs text-gray-400">Se actualiza cada pocos segundos</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de espera */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={15} className="animate-pulse" />
          <span>Esperando tu turno…</span>
        </div>

        {/* Puntos animados */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: primaryColor,
                animation: `pulse 1.4s ease-in-out ${i * 0.25}s infinite`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {/* Instrucción */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 w-full max-w-xs text-center">
          <p className="text-amber-800 text-xs font-medium">
            Mantén esta pantalla abierta — sonará y vibrará cuando sea tu turno
          </p>
        </div>
      </div>

      {/* Footer: toggle de sonido */}
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
