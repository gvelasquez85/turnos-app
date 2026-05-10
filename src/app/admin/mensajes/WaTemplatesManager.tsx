'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  MessageCircle, Save, RotateCcw, CheckCircle, ChevronDown, ChevronUp,
  Pencil, Eye, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  WA_TEMPLATE_DEFS, MODULE_LABELS, buildWaMessage,
  type WaCategory, type WaTemplateDef,
} from '@/lib/waTemplates'

interface BrandTemplate {
  id: string
  brand_id: string
  category: WaCategory
  name: string
  body: string
  is_active: boolean
}

interface TemplateWithOverride extends WaTemplateDef {
  brandTemplate: BrandTemplate | null
  defaultBody: string
}

interface Props {
  brandId: string
  templates: TemplateWithOverride[]
  activeModules?: Record<string, boolean>
}

const PREVIEW_VARS: Record<WaCategory, Record<string, string>> = {
  appointment_confirmation: { nombre: 'María García', negocio: 'Tu negocio', fecha: 'lunes 12 de mayo', hora: '10:00', sucursal: 'Sede principal', motivo: 'Corte de cabello' },
  appointment_reminder:     { nombre: 'Carlos López', negocio: 'Tu negocio', fecha: 'mañana martes 13', hora: '15:30', sucursal: 'Sede principal' },
  appointment_cancelled:    { nombre: 'Ana Rodríguez', negocio: 'Tu negocio', fecha: 'jueves 15', hora: '11:00', link: 'turnflow.com.co/book/tu-negocio' },
  appointment_no_show:      { nombre: 'Luis Martínez', negocio: 'Tu negocio', fecha: 'ayer miércoles 14' },
  sale_receipt:             { nombre: 'Sandra Torres', negocio: 'Tu negocio', total: '$85.000', referencia: 'VTA-2024-0042', fecha: 'hoy 3 de mayo' },
  sale_pending_payment:     { nombre: 'Pedro Sánchez', negocio: 'Tu negocio', total: '$120.000', vencimiento: 'viernes 10 de mayo' },
  quote_sent:               { nombre: 'Laura Jiménez', negocio: 'Tu negocio', total: '$350.000', link: 'turnflow.com.co/cotizacion/abc123' },
  quote_followup:           { nombre: 'Roberto Díaz', negocio: 'Tu negocio', total: '$350.000', dias: '3', link: 'turnflow.com.co/cotizacion/abc123' },
  customer_reactivation:    { nombre: 'Isabel Vargas', negocio: 'Tu negocio' },
}

function formatPreview(body: string, vars: Record<string, string>): string {
  let result = body
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${k}}}`, 'g'), v)
  }
  result = result.replace(/{{#\w+}}[\s\S]*?{{\/\w+}}/g, '')
  return result
}

function VariablePill({ variable }: { variable: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-mono border border-indigo-200 hover:bg-indigo-200 transition-colors"
      title="Clic para insertar"
    >
      {`{{${variable}}}`}
    </button>
  )
}

function TemplateCard({
  tmpl, brandId, onSaved,
}: {
  tmpl: TemplateWithOverride
  brandId: string
  onSaved: (category: WaCategory, saved: BrandTemplate | null) => void
}) {
  const activeBody = tmpl.brandTemplate?.body ?? tmpl.defaultBody
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(activeBody)
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function insertVar(v: string) {
    setDraft(d => d + `{{${v}}}`)
  }

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true); setError('')
    const supabase = createClient()
    let result: BrandTemplate | null = null
    if (tmpl.brandTemplate) {
      const { data, error: err } = await supabase
        .from('wa_templates')
        .update({ body: draft, name: tmpl.name, updated_at: new Date().toISOString() })
        .eq('id', tmpl.brandTemplate.id)
        .select().single()
      if (err) { setError(err.message); setSaving(false); return }
      result = data as BrandTemplate
    } else {
      const { data, error: err } = await supabase
        .from('wa_templates')
        .insert({ brand_id: brandId, category: tmpl.category, name: tmpl.name, body: draft, is_active: true })
        .select().single()
      if (err) { setError(err.message); setSaving(false); return }
      result = data as BrandTemplate
    }
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2500)
    onSaved(tmpl.category, result)
  }

  async function handleReset() {
    if (!tmpl.brandTemplate) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('wa_templates').delete().eq('id', tmpl.brandTemplate.id)
    setSaving(false)
    setDraft(tmpl.defaultBody)
    setEditing(false)
    onSaved(tmpl.category, null)
  }

  const isCustomized = !!tmpl.brandTemplate
  const previewText = formatPreview(draft, PREVIEW_VARS[tmpl.category] ?? {})

  return (
    <div className={cn('bg-white rounded-xl border transition-colors', isCustomized ? 'border-indigo-200' : 'border-gray-200')}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl shrink-0">{tmpl.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm">{tmpl.name}</p>
              {isCustomized && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wide">Personalizado</span>
              )}
              {saved && (
                <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Guardado</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(e => !e); setPreview(false) }}
          className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1.5 rounded-lg hover:bg-indigo-50"
        >
          <Pencil size={13} />
          {editing ? 'Cerrar' : 'Editar'}
          {editing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Preview (collapsed) */}
      {!editing && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-xs text-gray-600 whitespace-pre-wrap leading-relaxed border border-gray-100 line-clamp-3">
            {activeBody}
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <div className="px-4 pb-5 border-t border-gray-100 pt-4 space-y-4">
          {/* Variable pills */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Variables disponibles — clic para insertar:</p>
            <div className="flex flex-wrap gap-1.5">
              {tmpl.variables.map(v => (
                <button key={v} type="button" onClick={() => insertVar(v)}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-xs font-mono border border-indigo-100 hover:bg-indigo-100 transition-colors">
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Editor / Preview toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
            <button onClick={() => setPreview(false)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium', !preview ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
              <Pencil size={12} /> Editar
            </button>
            <button onClick={() => setPreview(true)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium', preview ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
              <Eye size={12} /> Vista previa
            </button>
          </div>

          {!preview ? (
            <textarea
              rows={7}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none font-mono leading-relaxed"
              placeholder="Escribe el mensaje aquí…"
            />
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-3 py-1.5 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <MessageCircle size={12} /> WhatsApp — vista previa con datos de ejemplo
              </div>
              {/* WhatsApp-style bubble */}
              <div className="bg-[#e5ddd5] p-4">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-xs shadow-sm">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{previewText}</p>
                  <p className="text-[10px] text-gray-400 text-right mt-1">11:30 ✓✓</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}

          <div className="flex items-center gap-2">
            <Button size="sm" loading={saving} onClick={handleSave}>
              <Save size={13} className="mr-1" /> Guardar
            </Button>
            {isCustomized && (
              <button type="button" onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 border border-gray-200">
                <RotateCcw size={12} /> Restablecer predeterminado
              </button>
            )}
            <button type="button" onClick={() => { setDraft(activeBody); setEditing(false) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function WaTemplatesManager({ brandId, templates: initial, activeModules }: Props) {
  const hasAppointments = activeModules?.appointments === true
  // Filter out appointment templates when module is inactive
  const filteredInitial = hasAppointments ? initial : initial.filter(t => t.module !== 'appointments')
  const [templates, setTemplates] = useState(filteredInitial)
  const [activeModule, setActiveModule] = useState<string>(hasAppointments ? 'appointments' : 'sales')

  function onSaved(category: WaCategory, saved: BrandTemplate | null) {
    setTemplates(ts => ts.map(t =>
      t.category === category ? { ...t, brandTemplate: saved } : t
    ))
  }

  const allModules = ['appointments', 'sales', 'clientes'] as const
  const modules = allModules.filter(m => m !== 'appointments' || hasAppointments)
  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.module]) acc[t.module] = []
    acc[t.module].push(t)
    return acc
  }, {} as Record<string, TemplateWithOverride[]>)

  const customizedCount = templates.filter(t => t.brandTemplate).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={20} className="text-green-600" />
          <h1 className="text-xl font-bold text-gray-900">Mensajes de WhatsApp</h1>
        </div>
        <p className="text-sm text-gray-500">
          Personaliza los mensajes que se envían a tus clientes desde todos los módulos.
          Los mensajes base son proporcionados por TurnFlow, pero puedes editarlos libremente.
        </p>
      </div>

      {/* Stats bar */}
      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-green-700">
          <CheckCircle size={15} />
          <span className="font-medium">{templates.length} plantillas disponibles</span>
        </div>
        <div className="text-green-600">
          {customizedCount > 0
            ? `${customizedCount} personalizada${customizedCount !== 1 ? 's' : ''} por tu marca`
            : 'Usando plantillas base de TurnFlow'}
        </div>
        <div className="ml-auto text-xs text-green-500 flex items-center gap-1">
          <span>💡</span>
          Usa <span className="font-mono bg-green-100 px-1 rounded">{'{{nombre}}'}</span> para insertar datos del cliente
        </div>
      </div>

      {/* Module tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {modules.map(mod => (
          <button
            key={mod}
            onClick={() => setActiveModule(mod)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeModule === mod
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {MODULE_LABELS[mod]}
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              (grouped[mod] ?? []).some(t => t.brandTemplate)
                ? 'bg-indigo-100 text-indigo-600'
                : 'bg-gray-100 text-gray-500'
            )}>
              {(grouped[mod] ?? []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Templates for active module */}
      <div className="flex flex-col gap-3">
        {(grouped[activeModule] ?? []).map(tmpl => (
          <TemplateCard
            key={tmpl.category}
            tmpl={tmpl}
            brandId={brandId}
            onSaved={onSaved}
          />
        ))}
      </div>
    </div>
  )
}
