'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Building2, ChevronDown } from 'lucide-react'
import type { VisitReason, Brand } from '@/types/database'

interface Props {
  brands: Pick<Brand, 'id' | 'name' | 'slug'>[]
  defaultBrandId: string | null
  reasons: VisitReason[]
}

export function VisitReasonsManager({ brands, defaultBrandId, reasons: initial }: Props) {
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
  const [reasons, setReasons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VisitReason | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sort_order: '0' })
  const [loading, setLoading] = useState(false)

  const showBrandSelector = brands.length > 1
  const selectedBrand = brands.find(b => b.id === selectedBrandId)
  const filteredReasons = selectedBrandId
    ? reasons.filter(r => r.brand_id === selectedBrandId)
    : reasons

  function handleBrandChange(id: string) {
    setSelectedBrandId(id)
    setShowForm(false)
    setEditing(null)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', description: '', sort_order: '0' })
    setShowForm(true)
  }

  function openEdit(r: VisitReason) {
    setEditing(r)
    setForm({ name: r.name, description: r.description || '', sort_order: String(r.sort_order) })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name || !selectedBrandId) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      description: form.description || null,
      brand_id: selectedBrandId,
      sort_order: parseInt(form.sort_order) || 0,
      active: true,
    }
    if (editing) {
      const { data } = await supabase.from('visit_reasons').update(payload).eq('id', editing.id).select('*').single()
      if (data) setReasons(rs => rs.map(r => r.id === editing.id ? data as VisitReason : r))
    } else {
      const { data } = await supabase.from('visit_reasons').insert(payload).select('*').single()
      if (data) setReasons(rs => [...rs, data as VisitReason])
    }
    setShowForm(false)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('visit_reasons').delete().eq('id', id)
    setReasons(rs => rs.filter(r => r.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Motivos de visita <span className="ml-1 text-sm font-normal text-gray-400">({reasons.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBrand ? `Marca: ${selectedBrand.name}` : 'Selecciona una marca'}
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
            {editing ? 'Editar' : 'Nuevo'} motivo
            {selectedBrand && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedBrand.name}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Descripción" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input label="Orden" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
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
          <p className="text-sm">Selecciona una marca para ver sus motivos de visita</p>
        </div>
      )}

      {/* Lista */}
      {selectedBrandId && (
        <div className="flex flex-col gap-3">
          {filteredReasons.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No hay motivos configurados para esta marca.
            </div>
          )}
          {filteredReasons.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {r.sort_order}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{r.name}</p>
                {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 size={14} className="text-red-500" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
