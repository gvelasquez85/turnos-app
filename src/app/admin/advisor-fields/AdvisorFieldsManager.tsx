'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { AdvisorField, FieldType } from '@/types/database'

type FieldWithEst = AdvisorField & { establishments: { name: string } | null }

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección' },
  { value: 'date', label: 'Fecha' },
]

export function AdvisorFieldsManager({ establishments, fields: initial }: { establishments: { id: string; name: string }[], fields: FieldWithEst[] }) {
  const [fields, setFields] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FieldWithEst | null>(null)
  const [form, setForm] = useState({ label: '', field_type: 'text' as FieldType, options: '', establishment_id: establishments[0]?.id || '', sort_order: '0', required: false })
  const [loading, setLoading] = useState(false)

  function openNew() { setEditing(null); setForm({ label: '', field_type: 'text', options: '', establishment_id: establishments[0]?.id || '', sort_order: '0', required: false }); setShowForm(true) }
  function openEdit(f: FieldWithEst) { setEditing(f); setForm({ label: f.label, field_type: f.field_type, options: (f.options as string[] || []).join(', '), establishment_id: f.establishment_id, sort_order: String(f.sort_order), required: f.required }); setShowForm(true) }

  async function handleSave() {
    if (!form.label || !form.establishment_id) return
    setLoading(true)
    const supabase = createClient()
    const options = form.field_type === 'select' ? form.options.split(',').map(s => s.trim()).filter(Boolean) : null
    const payload = { label: form.label, field_type: form.field_type, options, establishment_id: form.establishment_id, sort_order: parseInt(form.sort_order) || 0, required: form.required, active: true }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from('advisor_fields')
    if (editing) {
      const { data } = await table.update(payload).eq('id', editing.id).select('*, establishments(name)').single()
      if (data) setFields(fs => fs.map((f: FieldWithEst) => f.id === editing.id ? data as FieldWithEst : f))
    } else {
      const { data } = await table.insert(payload).select('*, establishments(name)').single()
      if (data) setFields(fs => [...fs, data as FieldWithEst])
    }
    setShowForm(false); setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('advisor_fields').delete().eq('id', id)
    setFields(fs => fs.filter(f => f.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campos del asesor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Información que el asesor completa al atender al cliente</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} campo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Etiqueta *" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tipo de campo</label>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value as FieldType }))}>
                {fieldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {form.field_type === 'select' && (
              <Input label="Opciones (separadas por coma)" value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} className="md:col-span-2" placeholder="Opción 1, Opción 2, Opción 3" />
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Establecimiento *</label>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.establishment_id} onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
                {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <Input label="Orden" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700">Campo requerido</span>
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {fields.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No hay campos configurados.</div>}
        {fields.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">{f.sort_order}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{f.label} {f.required && <span className="text-xs text-red-500">*</span>}</p>
              <p className="text-xs text-gray-500">{f.establishments?.name} · {fieldTypes.find(t => t.value === f.field_type)?.label}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(f)}><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(f.id)}><Trash2 size={14} className="text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
