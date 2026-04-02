'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Building2, GripVertical } from 'lucide-react'
import type { AdvisorField, FieldType, Brand } from '@/types/database'
import { Select } from '@/components/ui/select'

type FieldRow = AdvisorField & { brand_id?: string | null }

interface Props {
  brands: Pick<Brand, 'id' | 'name' | 'slug'>[]
  defaultBrandId: string | null
  fields: FieldRow[]
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección' },
  { value: 'date', label: 'Fecha' },
]

export function AdvisorFieldsManager({ brands, defaultBrandId, fields: initial }: Props) {
  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrandId, setSelectedBrandId] = useState(() => storeBrandId || autoBrandId)

  useEffect(() => {
    setSelectedBrandId(storeBrandId || autoBrandId)
    setShowForm(false)
    setEditing(null)
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [fields, setFields] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FieldRow | null>(null)
  const [loading, setLoading] = useState(false)

  // Drag and drop
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const showBrandSelector = brands.length > 1
  const selectedBrand = brands.find(b => b.id === selectedBrandId)

  const brandFields = selectedBrandId
    ? fields.filter(f => f.brand_id === selectedBrandId)
    : fields
  const sortedFields = [...brandFields].sort((a, b) => a.sort_order - b.sort_order)

  const [form, setForm] = useState({
    label: '', field_type: 'text' as FieldType, options: '', required: false,
  })

  function openNew() {
    setEditing(null)
    setForm({ label: '', field_type: 'text', options: '', required: false })
    setShowForm(true)
  }

  function openEdit(f: FieldRow) {
    setEditing(f)
    setForm({
      label: f.label,
      field_type: f.field_type,
      options: (f.options as string[] || []).join(', '),
      required: f.required,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.label || !selectedBrandId) return
    setLoading(true)
    const supabase = createClient()
    const options = form.field_type === 'select'
      ? form.options.split(',').map(s => s.trim()).filter(Boolean)
      : null
    const payload = {
      label: form.label,
      field_type: form.field_type,
      options,
      brand_id: selectedBrandId,
      establishment_id: null,
      sort_order: editing ? editing.sort_order : brandFields.length,
      required: form.required,
      active: true,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from('advisor_fields')
    if (editing) {
      const { data } = await table.update(payload).eq('id', editing.id).select('*').single()
      if (data) setFields(fs => fs.map((f: FieldRow) => f.id === editing.id ? data as FieldRow : f))
    } else {
      const { data } = await table.insert(payload).select('*').single()
      if (data) setFields(fs => [...fs, data as FieldRow])
    }
    setShowForm(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('advisor_fields').delete().eq('id', id)
    setFields(fs => fs.filter(f => f.id !== id))
  }

  function handleDragStart(index: number) { dragItem.current = index; setDragging(index) }
  function handleDragEnter(index: number) { dragOver.current = index }

  async function handleDrop() {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      setDragging(null); return
    }
    const reordered = [...sortedFields]
    const dragged = reordered[dragItem.current]
    reordered.splice(dragItem.current, 1)
    reordered.splice(dragOver.current, 0, dragged)
    const updates = reordered.map((f, i) => ({ id: f.id, sort_order: i }))
    setFields(fs => {
      const map = Object.fromEntries(updates.map(u => [u.id, u.sort_order]))
      return fs.map(f => map[f.id] !== undefined ? { ...f, sort_order: map[f.id] } : f)
    })
    const supabase = createClient()
    for (const u of updates) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('advisor_fields').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
    dragItem.current = null; dragOver.current = null; setDragging(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campos del agente <span className="ml-1 text-sm font-normal text-gray-400">({fields.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBrand ? `Marca: ${selectedBrand.name}` : 'Información que el asesor completa al atender al cliente'}
          </p>
        </div>
        <Button onClick={openNew} disabled={!selectedBrandId}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>


      {/* Formulario */}
      {showForm && selectedBrandId && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editing ? 'Editar' : 'Nuevo'} campo
            {selectedBrand && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedBrand.name}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Etiqueta *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <Select
              label="Tipo de campo"
              value={form.field_type}
              onChange={e => setForm(f => ({ ...f, field_type: e.target.value as FieldType }))}
            >
              {fieldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            {form.field_type === 'select' && (
              <Input
                label="Opciones (separadas por coma)"
                value={form.options}
                onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                className="md:col-span-2"
                placeholder="Opción 1, Opción 2, Opción 3"
              />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.required}
                onChange={e => setForm(f => ({ ...f, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              <span className="text-sm text-gray-700">Campo requerido</span>
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Sin marca seleccionada */}
      {showBrandSelector && !selectedBrandId && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecciona una marca para ver sus campos</p>
        </div>
      )}

      {/* Lista */}
      {selectedBrandId && (
        <div className="flex flex-col gap-2">
          {sortedFields.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No hay campos configurados para esta marca.
            </div>
          )}
          {sortedFields.length > 0 && (
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <GripVertical size={12} /> Arrastra para reordenar
            </p>
          )}
          {sortedFields.map((f, index) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDrop}
              onDragOver={e => e.preventDefault()}
              className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all select-none ${
                dragging === index ? 'opacity-50 ring-2 ring-indigo-300' : 'hover:shadow-sm'
              }`}
            >
              <GripVertical size={16} className="text-gray-300 shrink-0" />
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {f.label} {f.required && <span className="text-xs text-red-500">*</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {fieldTypes.find(t => t.value === f.field_type)?.label}
                  {f.field_type === 'select' && Array.isArray(f.options) && f.options.length > 0 && (
                    <span className="ml-1 text-gray-400">· {(f.options as string[]).join(', ')}</span>
                  )}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Edit2 size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id)}>
                <Trash2 size={14} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
