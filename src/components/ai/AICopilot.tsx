'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, X, Send, Sparkles, Lock, RefreshCw, ChevronDown, Zap } from 'lucide-react'
import Link from 'next/link'

export interface CopilotContext {
  moduleKey: string
  moduleLabel: string
  data: Record<string, any>
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface UsageInfo {
  plan: string
  limit: number
  used: number
  remaining: number
}

interface Props {
  initialUsage?: UsageInfo | null
}

// ─── Route → module mapping (fallback when no page calls setCopilotContext) ───
const ROUTE_MODULE_MAP: { pattern: RegExp; moduleKey: string; moduleLabel: string }[] = [
  { pattern: /\/admin\/queue/,        moduleKey: 'queue',         moduleLabel: 'Colas de espera' },
  { pattern: /\/admin\/appointments/, moduleKey: 'appointments',  moduleLabel: 'Citas' },
  { pattern: /\/admin\/clientes/,     moduleKey: 'clientes',      moduleLabel: 'Clientes' },
  { pattern: /\/admin\/crm/,          moduleKey: 'clientes',      moduleLabel: 'Clientes' },
  { pattern: /\/admin\/surveys/,      moduleKey: 'encuestas',     moduleLabel: 'Encuestas' },
  { pattern: /\/admin\/menu/,         moduleKey: 'ventas',        moduleLabel: 'Menú / Preorden' },
  { pattern: /\/admin\/reports/,      moduleKey: 'reportes',      moduleLabel: 'Reportes' },
  { pattern: /\/admin\/pqrs/,         moduleKey: 'pqrs',          moduleLabel: 'PQRS' },
  { pattern: /\/admin\/cuotas/,       moduleKey: 'cuotas',        moduleLabel: 'Cuotas' },
  { pattern: /\/admin\/coprop/,       moduleKey: 'copropiedades', moduleLabel: 'Copropiedades' },
  { pattern: /\/admin/,               moduleKey: 'home',          moduleLabel: 'Panel general' },
]

function contextFromPath(pathname: string): CopilotContext {
  const match = ROUTE_MODULE_MAP.find(r => r.pattern.test(pathname))
  return {
    moduleKey:   match?.moduleKey   ?? 'home',
    moduleLabel: match?.moduleLabel ?? 'Panel general',
    data: {},
  }
}

// ─── Singleton context store (avoids prop-drilling) ──────────────────────────
let _setContext: ((ctx: CopilotContext) => void) | null = null
export function setCopilotContext(ctx: CopilotContext) {
  _setContext?.(ctx)
}

// ─── Suggested prompts per module ────────────────────────────────────────────
const SUGGESTIONS: Record<string, string[]> = {
  home:          ['¿Cómo van mis ventas hoy?', '¿Qué clientes necesitan atención?', '¿Cuál es mi tendencia esta semana?'],
  ventas:        ['¿Cuáles son mis productos más vendidos?', '¿Qué promoción me sugieres para hoy?', '¿A qué hora vendo más?'],
  clientes:      ['¿Cuáles clientes no han comprado en 30 días?', '¿Cuántos clientes nuevos tengo este mes?'],
  reportes:      ['¿Qué insight destacado ves en estos datos?', '¿En qué categoría estoy perdiendo más?'],
  queue:         ['¿Cuánto tiempo lleva esperando el cliente más antiguo?', '¿Cuál es mi tiempo promedio de atención?'],
  appointments:  ['¿Cuántas citas tengo hoy?', '¿Cuál es mi tasa de cancelación?'],
  cuotas:        ['¿Cuánto me falta por recaudar este mes?', '¿Cuáles unidades están en mora?'],
  pqrs:          ['¿Cuántos casos están fuera de SLA?', '¿Cuál categoría de PQRS es la más frecuente?'],
  copropiedades: ['¿Cuál es mi porcentaje de recaudo?', '¿Qué espacios tienen más reservas?'],
}

const FREE_MODULES = ['home']

export function AICopilot({ initialUsage }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState<CopilotContext | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [usage, setUsage] = useState<UsageInfo | null>(initialUsage ?? null)
  const [upgradePrompt, setUpgradePrompt] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Register the global setter (pages call this to push rich context + data)
  useEffect(() => {
    _setContext = (ctx) => {
      setContext(ctx)
      setMessages([])
      setUpgradePrompt(false)
    }
    return () => { _setContext = null }
  }, [])

  // When the route changes and no page has pushed an explicit context, clear it
  // so activeContext falls back to the path-derived one automatically.
  useEffect(() => {
    setContext(null)
    setMessages([])
    setUpgradePrompt(false)
  }, [pathname])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages])

  const activeContext = context ?? contextFromPath(pathname)
  const isFreePlan = usage?.plan === 'free'
  const isModuleLocked = isFreePlan && !FREE_MODULES.includes(activeContext.moduleKey)
  const isExhausted = (usage?.remaining ?? 1) <= 0
  const suggestions = SUGGESTIONS[activeContext.moduleKey] ?? SUGGESTIONS.home

  async function loadUsage() {
    const res = await fetch('/api/ai/usage')
    if (res.ok) setUsage(await res.json())
  }

  useEffect(() => { if (open && !usage) loadUsage() }, [open])

  const sendMessage = useCallback(async (text: string) => {
    const activeContext = context ?? contextFromPath(pathname)
    if (!text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const history = isFreePlan ? [] : messages // free: no history
    const newMessages = [...history, userMsg]
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Optimistic assistant placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const contextData = JSON.stringify(activeContext.data, null, 2)

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: newMessages,
          moduleKey: activeContext.moduleKey,
          contextData,
        }),
      })

      if (res.status === 402) {
        setUpgradePrompt(true)
        setMessages(prev => prev.slice(0, -1)) // remove placeholder
        setStreaming(false)
        return
      }

      if (res.status === 429) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: `Has alcanzado el límite de ${usage?.limit} consultas diarias. ${isFreePlan ? 'Actualiza tu plan para obtener más consultas.' : 'Se reiniciará mañana.'}`,
          }
          return updated
        })
        await loadUsage()
        setStreaming(false)
        return
      }

      if (!res.ok || !res.body) throw new Error('Error en la respuesta')

      // Update remaining from header
      const remaining = res.headers.get('X-Copilot-Remaining')
      if (remaining !== null) setUsage(prev => prev ? { ...prev, remaining: parseInt(remaining), used: prev.used + 1 } : prev)

      // Stream text into last message
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Ocurrió un error. Intenta de nuevo.' }
          return updated
        })
      }
    }

    setStreaming(false)
  }, [context, pathname, messages, streaming, isFreePlan, usage])

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  // ─── Floating button ──────────────────────────────────────────────────────
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-13 h-13 flex items-center justify-center gap-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
        style={{ width: 52, height: 52 }}>
        <Bot size={22} />
        {usage && usage.remaining > 0 && isFreePlan && (
          <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[9px] font-bold text-amber-900 rounded-full w-4 h-4 flex items-center justify-center">
            {usage.remaining}
          </span>
        )}
      </button>
    )
  }

  // ─── Chat panel ───────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-5 right-5 z-50 w-[360px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 80px)', height: 520 }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shrink-0">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Bot size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Copilot IA</p>
          <p className="text-[10px] text-white/70 truncate">{activeContext.moduleLabel}</p>
        </div>

        {/* Usage badge */}
        {usage && (
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isFreePlan ? 'bg-amber-400 text-amber-900' : 'bg-white/20 text-white'}`}>
            {usage.remaining}/{usage.limit} hoy
          </div>
        )}
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white ml-1"><X size={16} /></button>
      </div>

      {/* Upgrade banner for locked modules */}
      {isModuleLocked && (
        <div className="mx-3 mt-3 shrink-0 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-violet-600 shrink-0" />
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">Copilot en {activeContext.moduleLabel}</p>
          </div>
          <p className="text-[11px] text-violet-600 dark:text-violet-400 mb-2.5">
            Con el plan gratuito, el Copilot solo funciona en el Dashboard. Activa el módulo completo para obtener insights en <strong>todos los módulos</strong>.
          </p>
          <Link href="/admin/marketplace" onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 w-full justify-center px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700">
            <Zap size={12} /> Ver planes — desde $19.900/mes
          </Link>
        </div>
      )}

      {/* Upgrade prompt (module access ok but tried to use it) */}
      {upgradePrompt && !isModuleLocked && (
        <div className="mx-3 mt-3 shrink-0 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Activa el Copilot completo</p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
            Obtén historial de conversación, 50 consultas diarias y acceso en todos los módulos.
          </p>
          <Link href="/admin/marketplace" onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 w-full justify-center px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600">
            <Sparkles size={12} /> Actualizar plan
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isModuleLocked && (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-2">
              <Sparkles size={18} className="text-violet-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">¿En qué te ayudo?</p>
            <p className="text-[11px] text-gray-400">Solo tengo acceso a los datos de esta pantalla.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <Bot size={12} className="text-violet-600" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              m.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
            }`}>
              {m.content || (streaming && i === messages.length - 1
                ? <span className="inline-flex gap-0.5">{[0,1,2].map(d => <span key={d} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}</span>
                : null
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 0 && !isModuleLocked && suggestions.length > 0 && (
        <div className="px-3 pb-2 flex flex-col gap-1 shrink-0">
          {suggestions.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-left text-[11px] text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-2.5 py-1.5 rounded-lg transition truncate">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Free plan exhausted nudge */}
      {isExhausted && isFreePlan && (
        <div className="px-3 pb-2 shrink-0">
          <Link href="/admin/marketplace" onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-lg">
            <Sparkles size={12} /> Agotaste tus 5 consultas — Actualiza para más
          </Link>
        </div>
      )}

      {/* Input */}
      {!isModuleLocked && (
        <form onSubmit={handleSubmit} className="px-3 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
            <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={isExhausted ? 'Límite diario alcanzado...' : 'Pregunta algo sobre estos datos...'}
              disabled={streaming || isExhausted}
              className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none disabled:opacity-50" />
            {streaming
              ? <button type="button" onClick={() => abortRef.current?.abort()} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
              : <button type="submit" disabled={!input.trim() || isExhausted} className="text-violet-600 hover:text-violet-700 disabled:opacity-30"><Send size={14} /></button>
            }
          </div>
          {isFreePlan && !isExhausted && (
            <p className="text-[10px] text-center text-gray-400 mt-1.5">
              Plan gratuito · {usage?.remaining ?? 0} consultas restantes hoy
            </p>
          )}
        </form>
      )}
    </div>
  )
}
