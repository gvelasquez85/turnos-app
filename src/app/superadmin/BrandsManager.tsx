'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Building2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Brand } from '@/types/database'

type BrandWithCount = Brand & { establishments: { count: number }[] }

export function BrandsManager({ brands: initial }: { brands: BrandWithCount[] }) {
  const [brands, setBrands] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', logo_url: '' })
  const [loading, setLoading] = useState(false)

  function slugify(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function openNew() { setEditing(null); setForm({ name: '', slug: '', logo_url: '' }); setShowForm(true) }
  function openEdit(b: Brand) { setEditing(b); setForm({ name: b.name, slug: b.slug, logo_url: b.logo_url || '' }); setShowForm(true) }

  async function handleSave() {
    if (!form.name || !form.slug) return
    setLoading(true)
    const supabase = createClient()
    if (editing) {
      const { data } = await supabase.from('brands').update({ name: form.name, slug: form.slug, logo_url: form.logo_url || null }).eq('id', editing.id).select().single()
      if (data) setBrands(bs => bs.map(b => b.id === editing.id ? { ...b, ...data } : b))
    } else {
      const { data } = await supabase.from('brands').insert({ name: form.name, slug: form.slug, logo_url: form.logo_url || null, active: true }).select().single()
      if (data) setBrands(bs => [{ ...data, establishments: [] }, ...bs])
    }
    setShowForm(false); setLoading(false)
  }

  async function toggleActive(brand: Brand) {
    const supabase = createClient()
    const { data } = await supabase.from('brands').update({ active: !brand.active }).eq('id', brand.id).select().single()
    if (data) setBrands(bs => bs.map(b => b.id === brand.id ? { ...b, ...data } : b))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marcas <span className="ml-1 text-sm font-normal text-gray-400">({brands.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de todas las marcas del sistema</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nueva marca</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nueva'} marca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} />
            <Input label="Slug *" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            <Input label="URL Logo" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." className="md:col-span-2" />
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.length === 0 && <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No hay marcas aún.</div>}
        {brands.map(brand => (
          <div key={brand.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {brand.logo_url
                  ? <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded-lg object-cover" />
                  : <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center"><Building2 size={18} className="text-indigo-600" /></div>
                }
                <div>
                  <p className="font-semibold text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-500">/{brand.slug}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${brand.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {brand.active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">{brand.establishments?.[0]?.count || 0} establecimientos</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(brand)}><Edit2 size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive(brand)}>{brand.active ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
