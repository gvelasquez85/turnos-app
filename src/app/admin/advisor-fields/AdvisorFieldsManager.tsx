'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Building2, ChevronDown } from 'lucide-react'
import type { AdvisorField, FieldType, Brand } from '@/types/database'
import { Select } from '@/components/ui/select'

type FieldWithEst = AdvisorField & { establishments: { name: string } | null }
type EstWithBrand = { id: string; name: string; brand_id: string }

interface Props {
  brands: Pick<Brand, 'id' | 'name' | 'slug'>[]
  defaultBrandId: string | null
  establishments: EstWithBrand[]
  fields: FieldWithEst[]
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Selección' },
  { value: 'date', label: 'Fecha' },
]

export function AdvisorFieldsManager({ brands, defaultBrandId, establishments, fields: initial }: Props) {
  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrandId, setSelectedBrandId] = useState(() => storeBrandId || autoBrandId)

  useEffect(() => {
    if (storeBrandId) {
      setSelectedBrandId(storeBrandId)
      setShowForm(false)
      setEditing(null)
    }
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps
  const [fields, setFields] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FieldWithEst | null>(null)
  const [loading, setLoading] = useState(false)

  const showBrandSelector = brands.length > 1
  const selectedBrand = brands.find(b => b.id === selectedBrandId)

  // Sucursales de la marca seleccionada
  const brandEstablishments = selectedBrandId
    ? establishments.filter(e => e.brand_id === selectedBrandId)
    : establishments

  // Campos de los establecimientos de la marca seleccionada
  const brandEstIds = new Set(brandEstablishments.map(e => e.id))
  const filteredFields = selectedBrandId
    ? fields.filter(f => brandEstIds.has(f.establishment_id))
    : fields

  const [form, setForm] = useState({
    label: '', field_type: 'text' as FieldType, options: '',
    establishment_id: brandEstablishments[0]?.id || '',
    sort_order: '0', required: false,
  })

  function handleBrandChange(id: string) {
    setSelectedBrandId(id)
    setShowForm(false)
    setEditing(null)
  }

  function openNew() {
    setEditing(null)
    setForm({
      label: '', field_type: 'text', options: '',
      establishment_id: brandEstablishments[0]?.id || '',
      sort_order: '0', required: false,
    })
    setShowForm(true)
  }

  function openEdit(f: FieldWithEst) {
    setEditing(f)
    setForm({
      label: f.label,
      field_type: f.field_type,
      options: (f.options as string[] || []).join(', '),
      establishment_id: f.establishment_id,
      sort_order: String(f.sort_order),
      required: f.required,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.label || !form.establishment_id) return
    setLoading(true)
    const supabase = createClient()
    const options = form.field_type === 'select'
      ? form.options.split(',').map(s => s.trim()).filter(Boolean)
      : null
    const payload = {
      label: form.label,
      field_type: form.field_type,
      options,
      establishment_id: form.establishment_id,
      sort_order: parseInt(form.sort_order) || 0,
      required: form.required,
      active: true,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (supabase as any).from('advisor_fields')
    if (editing) {
      const { data } = await table.update(payload).eq('id', editing.id).select('*, establishments(name)').single()
      if (data) setFields(fs => fs.map((f: FieldWithEst) => f.id === editing.id ? data as FieldWithEst : f))
    } else {
      const { data } = await table.insert(payload).select('*, establishments(name)').single()
      if (data) setFields(fs => [...fs, data as FieldWithEst])
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campos del agente <span className="ml-1 text-sm font-normal text-gray-400">({fields.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBrand ? `Marca: ${selectedBrand.name}` : 'Información que el asesor completa al atender al cliente'}
          </p>
        </div>
        <Button onClick={openNew} disabled={!selectedBrandId || brandEstablishments.length === 0}>
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>


      {/* Sin establecimientos en esta marca */}
      {selectedBrandId && brandEstablishments.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          Esta marca no tiene establecimientos activos. <a href="/admin" className="underline font-medium">Crea uno primero.</a>
        </div>
      )}

      {/* Formulario */}
      {showForm && selectedBrandId && brandEstablishments.length > 0 && (
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
            <Select
              label="Sucursal *"
              value={form.establishment_id}
              onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}
            >
              <option value="">— Seleccionar —</option>
              {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
            <Input
              label="Orden"
              type="number"
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
            />
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
        <div className="flex flex-col gap-3">
          {filteredFields.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No hay campos configurados para esta marca.
            </div>
          )}
          {filteredFields.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {f.sort_order}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {f.label} {f.required && <span className="text-xs text-red-500">*</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {f.establishments?.name} · {fieldTypes.find(t => t.value === f.field_type)?.label}
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
