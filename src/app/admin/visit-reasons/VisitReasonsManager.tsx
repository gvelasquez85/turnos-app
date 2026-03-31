'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { VisitReason } from '@/types/database'

interface Props {
  brandId: string
  reasons: VisitReason[]
}

export function VisitReasonsManager({ brandId, reasons: initial }: Props) {
  const [reasons, setReasons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<VisitReason | null>(null)
  const [form, setForm] = useState({ name: '', description: '', sort_order: '0' })
  const [loading, setLoading] = useState(false)

  function openNew() { setEditing(null); setForm({ name: '', description: '', sort_order: '0' }); setShowForm(true) }
  function openEdit(r: VisitReason) { setEditing(r); setForm({ name: r.name, description: r.description || '', sort_order: String(r.sort_order) }); setShowForm(true) }

  async function handleSave() {
    if (!form.name) return
    setLoading(true)
    const supabase = createClient()
    const payload = { name: form.name, description: form.description || null, brand_id: brandId, sort_order: parseInt(form.sort_order) || 0, active: true }
    if (editing) {
      const { data } = await supabase.from('visit_reasons').update(payload).eq('id', editing.id).select('*').single()
      if (data) setReasons(rs => rs.map(r => r.id === editing.id ? data as VisitReason : r))
    } else {
      const { data } = await supabase.from('visit_reasons').insert(payload).select('*').single()
      if (data) setReasons(rs => [...rs, data as VisitReason])
    }
    setShowForm(false); setLoading(false)
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
          <h1 className="text-xl font-bold text-gray-900">Motivos de visita</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personaliza las razones por las que los clientes te visitan</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} motivo</h2>
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

      <div className="flex flex-col gap-3">
        {reasons.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No hay motivos configurados.</div>}
        {reasons.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500">{r.sort_order}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{r.name}</p>
              {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 size={14} className="text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
