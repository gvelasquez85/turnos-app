'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket { id: string; queue_number: string; customer_name: string; status: string; visit_reasons: { name: string } | null }
interface Props {
  establishment: { id: string; name: string; brands: { name: string; logo_url: string | null } }
  config: { bg_color: string; accent_color: string; show_waiting_list: boolean; show_promotions: boolean; show_clock: boolean; custom_message: string | null } | null
  promotions: { id: string; title: string; description: string | null; image_url: string | null }[]
}

export function DisplayScreen({ establishment, config, promotions }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [time, setTime] = useState(new Date())
  const [promoIndex, setPromoIndex] = useState(0)

  const bgColor = config?.bg_color ?? '#1e1b4b'
  const accentColor = config?.accent_color ?? '#6366f1'

  const loadTickets = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tickets')
      .select('id, queue_number, customer_name, status, visit_reasons(name)')
      .eq('establishment_id', establishment.id)
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: true })
    setTickets((data as any) || [])
  }, [establishment.id])

  useEffect(() => {
    loadTickets()
    const supabase = createClient()
    const channel = supabase.channel(`display-${establishment.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `establishment_id=eq.${establishment.id}` }, loadTickets)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [establishment.id, loadTickets])

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Promo rotation
  useEffect(() => {
    if (promotions.length <= 1) return
    const t = setInterval(() => setPromoIndex(i => (i + 1) % promotions.length), 6000)
    return () => clearInterval(t)
  }, [promotions.length])

  const inProgress = tickets.filter(t => t.status === 'in_progress')
  const waiting = tickets.filter(t => t.status === 'waiting').slice(0, 6)
  const currentPromo = promotions[promoIndex]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bgColor, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div>
          <div className="text-2xl font-black tracking-tight">{establishment.brands.name}</div>
          <div className="text-sm opacity-60">{establishment.name}</div>
        </div>
        <div className="text-right">
          {(config?.show_clock ?? true) && (
            <div className="text-4xl font-mono font-bold tabular-nums">
              {time.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
          <div className="text-sm opacity-50 mt-1">
            {time.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-0">
        {/* Left: Tickets */}
        <div className="flex-1 p-8 flex flex-col gap-8">
          {/* In progress */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Atendiendo ahora</div>
            {inProgress.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/20 p-8 text-center opacity-40">
                <div className="text-5xl font-black mb-2">—</div>
                <div className="text-sm">Sin atenciones en curso</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {inProgress.map(t => (
                  <div key={t.id} className="rounded-2xl p-6 flex items-center gap-6" style={{ backgroundColor: accentColor }}>
                    <div className="text-6xl font-black">{t.queue_number}</div>
                    <div>
                      <div className="text-xl font-bold">{t.customer_name}</div>
                      <div className="opacity-70 text-sm">{(t.visit_reasons as any)?.name || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waiting */}
          {(config?.show_waiting_list ?? true) && waiting.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-4">Próximos en cola</div>
              <div className="grid grid-cols-3 gap-3">
                {waiting.map((t, i) => (
                  <div key={t.id} className="rounded-xl p-4 text-center" style={{ backgroundColor: `rgba(255,255,255,${i === 0 ? 0.15 : 0.07})` }}>
                    <div className="text-3xl font-black mb-1">{t.queue_number}</div>
                    <div className="text-xs opacity-60 truncate">{t.customer_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Promos + Message */}
        {(config?.show_promotions ?? true) && (
          <div className="w-80 p-6 border-l border-white/10 flex flex-col gap-6" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            {config?.custom_message && (
              <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${accentColor}40`, border: `1px solid ${accentColor}` }}>
                <p className="text-sm font-medium leading-relaxed">{config.custom_message}</p>
              </div>
            )}
            {currentPromo && (
              <div className="rounded-xl overflow-hidden flex flex-col flex-1">
                {currentPromo.image_url && (
                  <img src={currentPromo.image_url} alt={currentPromo.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4 flex-1 flex flex-col" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Promoción</div>
                  <div className="font-bold text-lg leading-snug">{currentPromo.title}</div>
                  {currentPromo.description && <div className="text-sm opacity-70 mt-2 line-clamp-3">{currentPromo.description}</div>}
                </div>
              </div>
            )}
            {promotions.length > 1 && (
              <div className="flex justify-center gap-1.5">
                {promotions.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i === promoIndex ? accentColor : 'rgba(255,255,255,0.3)' }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-white/10 flex items-center justify-between opacity-40">
        <span className="text-xs">TurnApp · Sistema de Gestión de Turnos</span>
        <span className="text-xs">{waiting.length + inProgress.length} en cola</span>
      </div>
    </div>
  )
}
