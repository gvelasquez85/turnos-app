'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, BookOpen, Sparkles, ThumbsUp, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

const SUGGESTED_QUESTIONS = [
  '¿Cómo registro una venta?',
  '¿Cómo agrego un cliente nuevo?',
  '¿Cómo funciona la cola de espera?',
  '¿Cómo genero una factura electrónica?',
  '¿Qué módulos tiene TurnFlow?',
]

function parseSourcesFromText(text: string): { clean: string; sources: string[] } {
  const match = text.match(/<!--SOURCES:(\[.*?\])-->/)
  if (!match) return { clean: text, sources: [] }
  try {
    const sources = JSON.parse(match[1]) as string[]
    const clean = text.replace(/\n\n<!--SOURCES:.*?-->/, '').trim()
    return { clean, sources }
  } catch {
    return { clean: text.replace(/<!--SOURCES:.*?-->/, '').trim(), sources: [] }
  }
}

export function HelpAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    setShowSuggestions(false)

    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Placeholder for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    abortRef.current = new AbortController()

    try {
      const history = messages.slice(-6)
      const res = await fetch('/api/help/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ question: text.trim() }),
      })

      if (!res.ok || !res.body) throw new Error('Error en la respuesta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        const { clean } = parseSourcesFromText(fullText)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: clean }
          return updated
        })
      }

      // Final parse with sources
      const { clean, sources } = parseSourcesFromText(fullText)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: clean, sources }
        return updated
      })
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Ocurrió un error. Por favor intenta de nuevo.',
          }
          return updated
        })
      }
    }

    setStreaming(false)
  }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input) }

  const unreadCount = 0 // reserved for future notifications

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-50 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 px-4 py-3 transition-all group"
        aria-label="Abrir asistente de ayuda"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <MessageCircle size={15} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <span className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">¿Necesitas ayuda?</span>
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-5 left-5 z-50 w-[360px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 80px)', height: 520 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Asistente TurnFlow</p>
          <p className="text-[10px] text-gray-400">Respuestas del centro de ayuda</p>
        </div>
        <Link
          href="/ayuda"
          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-0.5"
          onClick={() => setOpen(false)}
        >
          Ver todo <ExternalLink size={9} />
        </Link>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 ml-1">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {/* Welcome */}
        {messages.length === 0 && (
          <div className="text-center py-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-2">
              <Sparkles size={20} className="text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Hola, ¿en qué te ayudo?
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pregúntame cómo hacer cualquier cosa en TurnFlow y te guío paso a paso.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5 mr-2">
                <BookOpen size={11} className="text-indigo-600" />
              </div>
            )}
            <div className={`max-w-[85%] space-y-1.5 ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
              }`}>
                {m.content || (
                  streaming && i === messages.length - 1 ? (
                    <span className="inline-flex gap-0.5 items-center">
                      {[0, 1, 2].map(d => (
                        <span key={d} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </span>
                  ) : null
                )}
              </div>
              {/* Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="space-y-1">
                  {m.sources.slice(0, 2).map((title, si) => (
                    <div key={si} className="flex items-center gap-1 text-[10px] text-indigo-500 dark:text-indigo-400">
                      <BookOpen size={9} />
                      <span className="truncate">{title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-2 space-y-1 shrink-0">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="w-full text-left text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-lg transition truncate"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 pb-3 shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="¿Cómo puedo ayudarte?"
            disabled={streaming}
            className="flex-1 bg-transparent text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none disabled:opacity-50"
          />
          {streaming
            ? <button type="button" onClick={() => abortRef.current?.abort()} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
            : <button type="submit" disabled={!input.trim()} className="text-indigo-600 hover:text-indigo-700 disabled:opacity-30"><Send size={14} /></button>
          }
        </div>
        <p className="text-[9px] text-center text-gray-300 dark:text-gray-600 mt-1.5">
          Solo responde con contenido del centro de ayuda
        </p>
      </form>
    </div>
  )
}
