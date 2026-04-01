'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Copy, Check, Eye, BarChart2 } from 'lucide-react'
import { useBrandStore } from '@/stores/brandStore'

interface Question {
  id: string
  type: 'nps' | 'csat' | 'ces' | 'open'
  label: string
}

interface SurveyTemplate {
  id: string
  brand_id: string
  name: string
  questions: Question[]
  active: boolean
  created_at: string
}

interface Props {
  brands: { id: string; name: string }[]
  templates: SurveyTemplate[]
  defaultBrandId: string | null
}

const QUESTION_TYPE_LABELS = {
  nps: 'NPS (1-10)',
  csat: 'CSAT (1-5 estrellas)',
  ces: 'CES (1-5 esfuerzo)',
  open: 'Pregunta abierta',
}

const QUESTION_DEFAULTS: Record<string, string> = {
  nps: '¿Qué tan probable es que nos recomiendes? (1 = Muy poco, 10 = Definitivamente)',
  csat: '¿Cómo calificarías tu experiencia de atención?',
  ces: '¿Qué tan fácil fue resolver tu solicitud?',
  open: 'Cuéntanos más sobre tu visita...',
}

export function SurveyManager({ brands, templates: initialTemplates, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [templates, setTemplates] = useState<SurveyTemplate[]>(initialTemplates)
  const [selectedBrand, setSelectedBrand] = useState(() => storeBrandId || defaultBrandId || brands[0]?.id || '')
  const [editing, setEditing] = useState<SurveyTemplate | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [name, setName] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [viewingResponses, setViewingResponses] = useState<string | null>(null)
  const [responsesList, setResponsesList] = useState<any[]>([])

  useEffect(() => {
    if (storeBrandId) setSelectedBrand(storeBrandId)
  }, [storeBrandId])

  const brandTemplates = templates.filter(t => t.brand_id === selectedBrand)

  function startNew() {
    setEditing(null)
    setIsNew(true)
    setName('')
    setQuestions([])
  }

  function startEdit(t: SurveyTemplate) {
    setEditing(t)
    setIsNew(false)
    setName(t.name)
    setQuestions(t.questions || [])
  }

  function cancelEdit() {
    setEditing(null)
    setIsNew(false)
    setName('')
    setQuestions([])
  }

  function addQuestion(type: Question['type']) {
    const newQ: Question = {
      id: Math.random().toString(36).slice(2),
      type,
      label: QUESTION_DEFAULTS[type],
    }
    setQuestions(qs => [...qs, newQ])
  }

  function removeQuestion(id: string) {
    setQuestions(qs => qs.filter(q => q.id !== id))
  }

  function updateQuestion(id: string, label: string) {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, label } : q))
  }

  async function handleSave() {
    if (!name.trim() || !selectedBrand) return
    setSaving(true)
    const supabase = createClient()

    if (isNew) {
      const { data } = await supabase.from('survey_templates').insert({
        brand_id: selectedBrand,
        name: name.trim(),
        questions,
        active: true,
      }).select().single()
      if (data) setTemplates(ts => [data as SurveyTemplate, ...ts])
    } else if (editing) {
      await supabase.from('survey_templates').update({
        name: name.trim(),
        questions,
      }).eq('id', editing.id)
      setTemplates(ts => ts.map(t => t.id === editing.id ? { ...t, name: name.trim(), questions } : t))
    }

    setSaving(false)
    cancelEdit()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    const supabase = createClient()
    await supabase.from('survey_templates').delete().eq('id', id)
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  async function toggleActive(t: SurveyTemplate) {
    const supabase = createClient()
    await supabase.from('survey_templates').update({ active: !t.active }).eq('id', t.id)
    setTemplates(ts => ts.map(tt => tt.id === t.id ? { ...tt, active: !tt.active } : tt))
  }

  function copyLink(templateId: string) {
    const url = `${window.location.origin}/survey/preview?templateId=${templateId}`
    navigator.clipboard.writeText(url)
    setCopied(templateId)
    setTimeout(() => setCopied(null), 2000)
  }

  async function fetchResponses(t: SurveyTemplate) {
    const supabase = createClient()
    const { data } = await supabase
      .from('survey_responses')
      .select('*, tickets(customer_name, queue_number)')
      .eq('template_id', t.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setResponsesList(data || [])
    setViewingResponses(t.id)
    cancelEdit()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left: Template list */}
      <div className="md:col-span-1 flex flex-col gap-3">
        <Button onClick={startNew} size="sm" className="self-start">
          <Plus size={14} className="mr-1" /> Nueva plantilla
        </Button>

        {brandTemplates.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Sin plantillas aún</p>
        )}

        {brandTemplates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                <p className="text-xs text-gray-400">{(t.questions || []).length} preguntas</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {t.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Editar">
                <Edit2 size={13} />
              </button>
              <button onClick={() => toggleActive(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-xs px-2">
                {t.active ? 'Desactivar' : 'Activar'}
              </button>
              <button onClick={() => window.open(`/survey/preview?templateId=${t.id}`, '_blank')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Vista previa">
                <Eye size={13} />
              </button>
              <button onClick={() => fetchResponses(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Ver respuestas">
                <BarChart2 size={13} />
              </button>
              <button onClick={() => copyLink(t.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Copiar link">
                {copied === t.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              </button>
              <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 ml-auto" title="Eliminar">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Form */}
      {(isNew || editing) && (
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{isNew ? 'Nueva plantilla' : 'Editar plantilla'}</h2>

            <div className="flex flex-col gap-4">
              <Input
                label="Nombre de la plantilla"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Encuesta de satisfacción general"
              />

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preguntas</p>
                {questions.length === 0 && (
                  <p className="text-sm text-gray-400 mb-3">Sin preguntas. Agrega una abajo.</p>
                )}
                <div className="flex flex-col gap-3">
                  {questions.map((q, i) => (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </span>
                        <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-red-50 rounded text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <textarea
                        value={q.label}
                        onChange={e => updateQuestion(q.id, e.target.value)}
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add question buttons */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Agregar pregunta</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(QUESTION_TYPE_LABELS) as Question['type'][]).map(type => (
                    <button
                      key={type}
                      onClick={() => addQuestion(type)}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:border-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                      <Plus size={11} /> {QUESTION_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} loading={saving}>Guardar</Button>
                <Button variant="secondary" onClick={cancelEdit}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingResponses && !isNew && !editing && (
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Respuestas — {templates.find(t => t.id === viewingResponses)?.name}
              <span className="ml-2 text-sm font-normal text-gray-400">({responsesList.length})</span>
            </h2>
            <button onClick={() => setViewingResponses(null)} className="text-sm text-gray-400 hover:text-gray-600">Cerrar</button>
          </div>
          {responsesList.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Sin respuestas aún</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {responsesList.map(r => {
                const resp = (r.responses as Record<string, any>) || {}
                const scores = Object.entries(resp).map(([, v]) =>
                  typeof v === 'number' ? String(v) : typeof v === 'string' ? v.slice(0, 40) : JSON.stringify(v)
                ).join(' · ')
                return (
                  <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(r.tickets as any)?.customer_name || 'Cliente'} · #{(r.tickets as any)?.queue_number || '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{scores}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(r.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!isNew && !editing && !viewingResponses && (
        <div className="md:col-span-2 flex items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed p-12">
          <div className="text-center">
            <p className="font-medium mb-1">Selecciona o crea una plantilla</p>
            <p className="text-sm">Usa el ojo para vista previa o el gráfico para ver respuestas.</p>
            <p className="text-xs mt-2 text-gray-300">URL pública: /survey/&#123;ticketId&#125;</p>
          </div>
        </div>
      )}
    </div>
  )
}
