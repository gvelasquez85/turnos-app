'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  queue_number: string
  customer_name: string
  status: string
  visit_reasons: { name: string } | null
}

interface Widget {
  id: string
  type: 'queue_now' | 'queue_waiting' | 'clock' | 'text' | 'youtube' | 'image'
  col: 'main' | 'side'
  config: {
    title?: string
    content?: string
    youtubeUrl?: string
    imageUrl?: string
    maxItems?: number
    textAlign?: 'left' | 'center' | 'right'
    fontSize?: 'sm' | 'md' | 'lg' | 'xl'
  }
}

interface Props {
  establishment: { id: string; name: string; brands: { name: string; logo_url: string | null } }
  config: { bg_color: string; accent_color: string; widgets: Widget[] } | null
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'w1', type: 'queue_now', col: 'main', config: { title: 'Atendiendo ahora' } },
  { id: 'w2', type: 'queue_waiting', col: 'main', config: { title: 'Próximos en cola', maxItems: 6 } },
  { id: 'w3', type: 'clock', col: 'side', config: {} },
]

const FONT_SIZE_CLASS: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
  xl: 'text-4xl',
}

const TEXT_ALIGN_CLASS: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function SectionTitle({ title }: { title?: string }) {
  if (!title) return null
  return (
    <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">
      {title}
    </div>
  )
}

function ClockWidget() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-center">
      <div className="text-5xl font-mono font-bold tabular-nums">
        {time.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm opacity-50 mt-2 capitalize">
        {time.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  )
}

function QueueNowWidget({
  tickets,
  accentColor,
  config,
}: {
  tickets: Ticket[]
  accentColor: string
  config: Widget['config']
}) {
  const inProgress = tickets.filter(t => t.status === 'in_progress')
  return (
    <div>
      <SectionTitle title={config.title} />
      {inProgress.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-white/20 p-8 text-center opacity-40">
          <div className="text-5xl font-black mb-2">—</div>
          <div className="text-sm">Sin atenciones en curso</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {inProgress.map(t => (
            <div
              key={t.id}
              className="rounded-2xl p-6 flex items-center gap-6"
              style={{ backgroundColor: accentColor }}
            >
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
  )
}

function QueueWaitingWidget({
  tickets,
  config,
}: {
  tickets: Ticket[]
  config: Widget['config']
}) {
  const maxItems = config.maxItems ?? 6
  const waiting = tickets.filter(t => t.status === 'waiting').slice(0, maxItems)
  if (waiting.length === 0) return null
  return (
    <div>
      <SectionTitle title={config.title} />
      <div className="grid grid-cols-3 gap-3">
        {waiting.map((t, i) => (
          <div
            key={t.id}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: `rgba(255,255,255,${i === 0 ? 0.15 : 0.07})` }}
          >
            <div className="text-3xl font-black mb-1">{t.queue_number}</div>
            <div className="text-xs opacity-60 truncate">{t.customer_name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TextWidget({ config }: { config: Widget['config'] }) {
  const sizeClass = FONT_SIZE_CLASS[config.fontSize ?? 'md']
  const alignClass = TEXT_ALIGN_CLASS[config.textAlign ?? 'left']
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
    >
      <SectionTitle title={config.title} />
      <p className={`${sizeClass} ${alignClass} leading-relaxed`}>
        {config.content}
      </p>
    </div>
  )
}

function YoutubeWidget({ config }: { config: Widget['config'] }) {
  return (
    <div>
      <SectionTitle title={config.title} />
      <div className="aspect-video w-full">
        <iframe
          src={config.youtubeUrl}
          allow="autoplay; fullscreen"
          style={{ border: 0 }}
          className="w-full h-full rounded-xl"
        />
      </div>
    </div>
  )
}

function ImageWidget({ config }: { config: Widget['config'] }) {
  return (
    <div>
      <SectionTitle title={config.title} />
      <div className="w-full rounded-xl overflow-hidden">
        <img
          src={config.imageUrl}
          alt={config.title ?? ''}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

function WidgetRenderer({
  widget,
  tickets,
  accentColor,
}: {
  widget: Widget
  tickets: Ticket[]
  accentColor: string
}) {
  switch (widget.type) {
    case 'queue_now':
      return <QueueNowWidget tickets={tickets} accentColor={accentColor} config={widget.config} />
    case 'queue_waiting':
      return <QueueWaitingWidget tickets={tickets} config={widget.config} />
    case 'clock':
      return <ClockWidget />
    case 'text':
      return <TextWidget config={widget.config} />
    case 'youtube':
      return <YoutubeWidget config={widget.config} />
    case 'image':
      return <ImageWidget config={widget.config} />
    default:
      return null
  }
}

export function DisplayScreen({ establishment, config }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])

  const bgColor = config?.bg_color ?? '#1e1b4b'
  const accentColor = config?.accent_color ?? '#6366f1'

  const rawWidgets = config?.widgets && config.widgets.length > 0 ? config.widgets : DEFAULT_WIDGETS
  const mainWidgets = rawWidgets.filter(w => w.col === 'main')
  const sideWidgets = rawWidgets.filter(w => w.col === 'side')

  const hasClockInConfig = rawWidgets.some(w => w.type === 'clock')

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
    const channel = supabase
      .channel(`display-${establishment.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `establishment_id=eq.${establishment.id}`,
        },
        loadTickets,
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [establishment.id, loadTickets])

  // Header clock (shown when a clock widget exists, for the header area)
  const [headerTime, setHeaderTime] = useState(new Date())
  useEffect(() => {
    if (!hasClockInConfig) return
    const t = setInterval(() => setHeaderTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [hasClockInConfig])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: bgColor, color: 'white', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div>
          <div className="text-2xl font-black tracking-tight">{establishment.brands.name}</div>
          <div className="text-sm opacity-60">{establishment.name}</div>
        </div>
        {hasClockInConfig && (
          <div className="text-right">
            <div className="text-4xl font-mono font-bold tabular-nums">
              {headerTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-sm opacity-50 mt-1 capitalize">
              {headerTime.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Main column */}
        <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
          {mainWidgets.map(widget => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              tickets={tickets}
              accentColor={accentColor}
            />
          ))}
        </div>

        {/* Side column */}
        {sideWidgets.length > 0 && (
          <div
            className="w-80 p-6 border-l border-white/10 flex flex-col gap-6 overflow-y-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            {sideWidgets.map(widget => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                tickets={tickets}
                accentColor={accentColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-white/10 flex items-center justify-between opacity-40">
        <span className="text-xs">TurnApp</span>
        <span className="text-xs">{tickets.length} en cola</span>
      </div>
    </div>
  )
}
