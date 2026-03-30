'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { VisitReason } from '@/types/database'

type ReasonWithEst = VisitReason & { establishments: { name: string } | null }

interface Props {
  establishments: { id: string; name: string }[]
  reasons: ReasonWithEst[]
}

export function VisitReasonsManager({ establishments, reasons: initial }: Props) {
  const [reasons, setReasons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ReasonWithEst | null>(null)
  const [form, setForm] = useState({ name: '', description: '', establishment_id: establishments[0]?.id || '', sort_order: '0' })
  const [loading, setLoading] = useState(false)

  function openNew() { setEditing(null); setForm({ name: '', description: '', establishment_id: establishments[0]?.id || '', sort_order: '0' }); setShowForm(true) }
  function openEdit(r: ReasonWithEst) { setEditing(r); setForm({ name: r.name, description: r.description || '', establishment_id: r.establishment_id, sort_order: String(r.sort_order) }); setShowForm(true) }

  async function handleSave() {
    if (!form.name || !form.establishment_id) return
    setLoading(true)
    const supabase = createClient()
    const payload = { name: form.name, description: form.description || null, establishment_id: form.establishment_id, sort_order: parseInt(form.sort_order) || 0, active: true }
    if (editing) {
      const { data } = await supabase.from('visit_reasons').update(payload).eq('id', editing.id).select('*, establishments(name)').single()
      if (data) setReasons(rs => rs.map(r => r.id === editing.id ? data as ReasonWithEst : r))
    } else {
      const { data } = await supabase.from('visit_reasons').insert(payload).select('*, establishments(name)').single()
      if (data) setReasons(rs => [...rs, data as ReasonWithEst])
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Establecimiento *</label>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.establishment_id} onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
                {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
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
              <p className="text-xs text-gray-500">{r.establishments?.name} {r.description && `· ${r.description}`}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 size={14} className="text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
