'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Promotion } from '@/types/database'
import { formatDate } from '@/lib/utils'

type PromoWithEst = Promotion & { establishments: { name: string } | null }

export function PromotionsManager({ establishments, promotions: initial }: { establishments: { id: string; name: string }[], promotions: PromoWithEst[] }) {
  const [promotions, setPromotions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PromoWithEst | null>(null)
  const [form, setForm] = useState({ title: '', description: '', image_url: '', establishment_id: establishments[0]?.id || '', starts_at: '', ends_at: '' })
  const [loading, setLoading] = useState(false)

  function openNew() { setEditing(null); setForm({ title: '', description: '', image_url: '', establishment_id: establishments[0]?.id || '', starts_at: '', ends_at: '' }); setShowForm(true) }
  function openEdit(p: PromoWithEst) {
    setEditing(p)
    setForm({ title: p.title, description: p.description || '', image_url: p.image_url || '', establishment_id: p.establishment_id, starts_at: p.starts_at ? p.starts_at.slice(0, 10) : '', ends_at: p.ends_at ? p.ends_at.slice(0, 10) : '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title || !form.establishment_id) return
    setLoading(true)
    const supabase = createClient()
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      establishment_id: form.establishment_id,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      active: true,
    }
    if (editing) {
      const { data } = await supabase.from('promotions').update(payload).eq('id', editing.id).select('*, establishments(name)').single()
      if (data) setPromotions(ps => ps.map(p => p.id === editing.id ? data as PromoWithEst : p))
    } else {
      const { data } = await supabase.from('promotions').insert(payload).select('*, establishments(name)').single()
      if (data) setPromotions(ps => [data as PromoWithEst, ...ps])
    }
    setShowForm(false); setLoading(false)
  }

  async function toggleActive(promo: PromoWithEst) {
    const supabase = createClient()
    const { data } = await supabase.from('promotions').update({ active: !promo.active }).eq('id', promo.id).select('*, establishments(name)').single()
    if (data) setPromotions(ps => ps.map(p => p.id === promo.id ? data as PromoWithEst : p))
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('promotions').delete().eq('id', id)
    setPromotions(ps => ps.filter(p => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promociones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Se muestran al cliente al escanear el QR</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nueva</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nueva'} promoción</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Establecimiento *</label>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.establishment_id} onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
                {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <textarea rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <Input label="URL de imagen" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
            <div />
            <Input label="Válida desde" type="date" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            <Input label="Válida hasta" type="date" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {promotions.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No hay promociones aún.</div>}
        {promotions.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            {p.image_url && <img src={p.image_url} alt={p.title} className="w-14 h-14 object-cover rounded-lg" />}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{p.title}</p>
              <p className="text-xs text-gray-500">{p.establishments?.name}</p>
              {(p.starts_at || p.ends_at) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {p.starts_at ? formatDate(p.starts_at) : '∞'} → {p.ends_at ? formatDate(p.ends_at) : '∞'}
                </p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {p.active ? 'Activa' : 'Inactiva'}
            </span>
            <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>{p.active ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}</Button>
            <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit2 size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 size={14} className="text-red-500" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
