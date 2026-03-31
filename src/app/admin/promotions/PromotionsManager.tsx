'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Building2, ChevronDown } from 'lucide-react'
import type { Promotion, Brand } from '@/types/database'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'

type PromoWithEst = Promotion & { establishments: { name: string } | null }
type EstWithBrand = { id: string; name: string; brand_id: string }

interface Props {
  brands: Pick<Brand, 'id' | 'name' | 'slug'>[]
  defaultBrandId: string | null
  establishments: EstWithBrand[]
  promotions: PromoWithEst[]
}

export function PromotionsManager({ brands, defaultBrandId, establishments, promotions: initial }: Props) {
  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const [selectedBrandId, setSelectedBrandId] = useState(autoBrandId)
  const [promotions, setPromotions] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PromoWithEst | null>(null)
  const [loading, setLoading] = useState(false)

  const showBrandSelector = brands.length > 1
  const selectedBrand = brands.find(b => b.id === selectedBrandId)

  // Establecimientos de la marca seleccionada
  const brandEstablishments = selectedBrandId
    ? establishments.filter(e => e.brand_id === selectedBrandId)
    : establishments

  // Promociones de los establecimientos de la marca seleccionada
  const brandEstIds = new Set(brandEstablishments.map(e => e.id))
  const filteredPromotions = selectedBrandId
    ? promotions.filter(p => brandEstIds.has(p.establishment_id))
    : promotions

  const emptyForm = {
    title: '', description: '', image_url: '',
    establishment_id: brandEstablishments[0]?.id || '',
    starts_at: '', ends_at: '',
  }
  const [form, setForm] = useState(emptyForm)

  function handleBrandChange(id: string) {
    setSelectedBrandId(id)
    setShowForm(false)
    setEditing(null)
  }

  function openNew() {
    setEditing(null)
    setForm({ ...emptyForm, establishment_id: brandEstablishments[0]?.id || '' })
    setShowForm(true)
  }

  function openEdit(p: PromoWithEst) {
    setEditing(p)
    setForm({
      title: p.title,
      description: p.description || '',
      image_url: p.image_url || '',
      establishment_id: p.establishment_id,
      starts_at: p.starts_at ? p.starts_at.slice(0, 10) : '',
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : '',
    })
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
    setShowForm(false)
    setLoading(false)
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
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBrand ? `Marca: ${selectedBrand.name}` : 'Se muestran al cliente al escanear el QR'}
          </p>
        </div>
        <Button onClick={openNew} disabled={!selectedBrandId || brandEstablishments.length === 0}>
          <Plus size={16} className="mr-1" /> Nueva
        </Button>
      </div>

      {/* Selector de marca */}
      {showBrandSelector && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Building2 size={18} className="text-indigo-500 shrink-0" />
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 block mb-1 uppercase tracking-wide">Marca</label>
            <div className="relative max-w-xs">
              <select
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedBrandId}
                onChange={e => handleBrandChange(e.target.value)}
              >
                <option value="">— Seleccionar marca —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      )}

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
            {editing ? 'Editar' : 'Nueva'} promoción
            {selectedBrand && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedBrand.name}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Título *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Select
              label="Establecimiento *"
              value={form.establishment_id}
              onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}
            >
              <option value="">— Seleccionar —</option>
              {brandEstablishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={2}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
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

      {/* Sin marca seleccionada */}
      {showBrandSelector && !selectedBrandId && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecciona una marca para ver sus promociones</p>
        </div>
      )}

      {/* Lista */}
      {selectedBrandId && (
        <div className="flex flex-col gap-3">
          {filteredPromotions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No hay promociones para esta marca aún.
            </div>
          )}
          {filteredPromotions.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="w-14 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.title}</p>
                <p className="text-xs text-gray-500">{p.establishments?.name}</p>
                {(p.starts_at || p.ends_at) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.starts_at ? formatDate(p.starts_at) : '∞'} → {p.ends_at ? formatDate(p.ends_at) : '∞'}
                  </p>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {p.active ? 'Activa' : 'Inactiva'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                {p.active ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit2 size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 size={14} className="text-red-500" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
