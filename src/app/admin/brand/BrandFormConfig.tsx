'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Trash2, GripVertical, FileText, Shield } from 'lucide-react'

type FieldType = 'text' | 'number' | 'select' | 'date' | 'textarea'

interface FormField {
  id: string
  label: string
  field_type: FieldType
  required: boolean
  options?: string[]
}

const FIXED_FIELDS = [
  { label: 'Nombre completo', required: true },
  { label: 'Teléfono', required: true },
  { label: 'Correo electrónico', required: true },
]

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  number: 'Número',
  select: 'Opciones',
  date: 'Fecha',
  textarea: 'Texto largo',
}

function genId() { return Math.random().toString(36).slice(2, 9) }

const MAX_POLICY_CHARS = 1000

export function BrandFormConfig({
  brandId,
  initialFields,
  initialPolicy,
}: {
  brandId: string
  initialFields: FormField[]
  initialPolicy: string | null
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields)
  const [policy, setPolicy] = useState(initialPolicy || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // New field form
  const [newField, setNewField] = useState<{ label: string; field_type: FieldType; required: boolean; options: string }>({
    label: '', field_type: 'text', required: false, options: '',
  })
  const [showNewField, setShowNewField] = useState(false)

  const dragIdx = useRef<number>(-1)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  function handleDragStart(i: number) { dragIdx.current = i }
  function handleDragEnter(i: number) { setDragOverIdx(i) }
  function handleDragEnd() { dragIdx.current = -1; setDragOverIdx(null) }
  function handleDrop(dropIdx: number) {
    const from = dragIdx.current
    if (from === -1 || from === dropIdx) { handleDragEnd(); return }
    setFields(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(dropIdx, 0, moved)
      return next
    })
    handleDragEnd()
  }

  function addField() {
    if (!newField.label.trim()) return
    const field: FormField = {
      id: genId(),
      label: newField.label.trim(),
      field_type: newField.field_type,
      required: newField.required,
      options: newField.field_type === 'select' && newField.options
        ? newField.options.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    }
    setFields(f => [...f, field])
    setNewField({ label: '', field_type: 'text', required: false, options: '' })
    setShowNewField(false)
  }

  function removeField(id: string) { setFields(f => f.filter(x => x.id !== id)) }
  function toggleRequired(id: string) { setFields(f => f.map(x => x.id === id ? { ...x, required: !x.required } : x)) }

  async function handleSave() {
    setError('')
    if (policy.length > MAX_POLICY_CHARS) {
      setError(`La política no puede superar los ${MAX_POLICY_CHARS} caracteres`)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { data: updated, error: err } = await supabase
      .from('brands')
      .update({ form_fields: fields, data_policy_text: policy || null })
      .eq('id', brandId)
      .select('id')
    setSaving(false)
    if (err) { setError(err.message); return }
    if (!updated || updated.length === 0) {
      setError('No se pudo guardar. Verifica que tienes permisos para editar esta marca.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const policyChars = policy.length

  return (
    <div className="flex flex-col gap-6">
      {/* Fixed fields (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Campos fijos del formulario</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">Estos campos siempre se muestran y no pueden eliminarse.</p>
        <div className="flex flex-col gap-2">
          {FIXED_FIELDS.map(f => (
            <div key={f.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{f.label}</span>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Obligatorio</span>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Texto</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom fields */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-indigo-500" />
            <h2 className="font-semibold text-gray-900">Campos adicionales</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{fields.length}</span>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowNewField(v => !v)}>
            <Plus size={14} className="mr-1" /> Nuevo campo
          </Button>
        </div>

        {showNewField && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input
                label="Etiqueta *"
                value={newField.label}
                onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
                placeholder="Ej: Documento de identidad"
              />
              <Select
                label="Tipo"
                value={newField.field_type}
                onChange={e => setNewField(f => ({ ...f, field_type: e.target.value as FieldType }))}
              >
                {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
              {newField.field_type === 'select' && (
                <Input
                  label="Opciones (separadas por coma)"
                  value={newField.options}
                  onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
                  placeholder="Opción 1, Opción 2, Opción 3"
                  className="sm:col-span-2"
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                />
                Campo obligatorio
              </label>
              <div className="flex gap-2">
                <Button size="sm" onClick={addField} disabled={!newField.label.trim()}>Agregar</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowNewField(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}

        {fields.length === 0 && !showNewField ? (
          <p className="text-sm text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
            No hay campos adicionales. Haz clic en "Nuevo campo" para agregar.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field, i) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 transition-all select-none ${
                  dragOverIdx === i ? 'border-indigo-400 shadow-md scale-[1.01]' : 'border-gray-200'
                }`}
              >
                <GripVertical size={14} className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">{field.label}</span>
                  <span className="ml-2 text-xs text-gray-400">{FIELD_TYPE_LABELS[field.field_type]}</span>
                </div>
                <button
                  onClick={() => toggleRequired(field.id)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    field.required
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {field.required ? 'Obligatorio' : 'Opcional'}
                </button>
                <button onClick={() => removeField(field.id)} className="text-gray-300 hover:text-red-500 p-0.5 ml-1">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data policy */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900">Política de tratamiento de datos</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Este texto se muestra al cliente en el formulario de registro y queda registrado en la autorización.
          Puedes incluir links en formato: <code className="bg-gray-100 px-1 rounded text-xs">https://...</code>
        </p>
        <div className="relative">
          <textarea
            value={policy}
            onChange={e => setPolicy(e.target.value)}
            maxLength={MAX_POLICY_CHARS}
            rows={8}
            placeholder="Al proporcionar sus datos personales, usted autoriza..."
            className={`w-full rounded-xl border px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${
              policyChars > MAX_POLICY_CHARS ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
            }`}
          />
          <span className={`absolute bottom-3 right-3 text-xs ${policyChars > MAX_POLICY_CHARS * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
            {policyChars}/{MAX_POLICY_CHARS}
          </span>
        </div>
        {policyChars > MAX_POLICY_CHARS && (
          <p className="text-xs text-red-600 mt-1">Supera el límite de {MAX_POLICY_CHARS} caracteres</p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          Si dejas este campo vacío, se usará la política predeterminada de TurnApp.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}

      <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
        {saved ? '¡Guardado!' : 'Guardar configuración del formulario'}
      </Button>
    </div>
  )
}
