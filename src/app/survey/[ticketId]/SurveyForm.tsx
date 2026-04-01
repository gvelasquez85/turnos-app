'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CheckCircle, Star } from 'lucide-react'

interface Question {
  id: string
  type: 'nps' | 'csat' | 'ces' | 'open'
  label: string
}

interface Props {
  ticket: { id: string; queue_number: string; customer_name: string }
  establishment: { id: string; name: string; brand_name: string; primary_color?: string | null }
  template: { id: string; name: string; questions: Question[] } | null
  preview?: boolean
}

export function SurveyForm({ ticket, establishment, template, preview }: Props) {
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const primaryColor = establishment.primary_color ?? '#6366f1'

  if (!template || !template.questions || template.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)` }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Gracias por tu visita!</h2>
          <p className="text-gray-500 text-sm">{establishment.brand_name} · {establishment.name}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)` }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Gracias!</h2>
          <p className="text-gray-600 mb-4">Tu opinión es muy valiosa para nosotros.</p>
          <p className="text-sm text-gray-400">{establishment.brand_name} · {establishment.name}</p>
        </div>
      </div>
    )
  }

  async function handleSubmit() {
    if (preview) { setSubmitted(true); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('survey_responses').insert({
      ticket_id: ticket.id,
      template_id: template!.id,
      establishment_id: establishment.id,
      responses,
    })
    setLoading(false)
    setSubmitted(true)
  }

  function NpsQuestion({ q }: { q: Question }) {
    const val = responses[q.id] as number | undefined
    return (
      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">{q.label}</p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setResponses(r => ({ ...r, [q.id]: n }))}
              className={`w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all ${
                val === n
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : n <= 6
                  ? 'border-red-200 text-red-600 hover:border-red-400'
                  : n <= 8
                  ? 'border-yellow-200 text-yellow-600 hover:border-yellow-400'
                  : 'border-green-200 text-green-600 hover:border-green-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">Muy poco probable</span>
          <span className="text-xs text-gray-400">Totalmente seguro</span>
        </div>
      </div>
    )
  }

  function CsatCesQuestion({ q }: { q: Question }) {
    const val = responses[q.id] as number | undefined
    const isCSAT = q.type === 'csat'
    const labels = isCSAT
      ? ['Muy mal', 'Mal', 'Regular', 'Bien', 'Excelente']
      : ['Muy difícil', 'Difícil', 'Regular', 'Fácil', 'Muy fácil']

    return (
      <div>
        <p className="text-sm font-medium text-gray-800 mb-3">{q.label}</p>
        <div className="flex gap-3 justify-center">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setResponses(r => ({ ...r, [q.id]: n }))}
              className="flex flex-col items-center gap-1"
              title={labels[n - 1]}
            >
              <Star
                size={32}
                className={`transition-colors ${val !== undefined && n <= (val as number) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
              />
              <span className="text-xs text-gray-400">{n}</span>
            </button>
          ))}
        </div>
        {val && (
          <p className="text-center text-sm text-gray-600 mt-2 font-medium">{labels[(val as number) - 1]}</p>
        )}
      </div>
    )
  }

  function OpenQuestion({ q }: { q: Question }) {
    return (
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">{q.label}</p>
        <textarea
          value={(responses[q.id] as string) || ''}
          onChange={e => setResponses(r => ({ ...r, [q.id]: e.target.value }))}
          rows={3}
          placeholder="Escribe tu respuesta..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="text-white text-center py-6 px-4" style={{ backgroundColor: primaryColor }}>
        <h1 className="text-xl font-bold">{establishment.brand_name}</h1>
        <p className="text-indigo-200 text-sm">{establishment.name}</p>
      </div>

      <div className="flex-1 p-6 max-w-sm mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Cuéntanos tu experiencia</h2>
          <p className="text-sm text-gray-500 mt-1">Turno #{ticket.queue_number} · {ticket.customer_name}</p>
        </div>

        <div className="flex flex-col gap-6">
          {template.questions.map(q => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
              {q.type === 'nps' && <NpsQuestion q={q} />}
              {(q.type === 'csat' || q.type === 'ces') && <CsatCesQuestion q={q} />}
              {q.type === 'open' && <OpenQuestion q={q} />}
            </div>
          ))}

          <Button size="lg" className="w-full" loading={loading} onClick={handleSubmit}>
            Enviar encuesta
          </Button>
        </div>
      </div>
    </div>
  )
}
