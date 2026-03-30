'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Establishment, Brand } from '@/types/database'
import { Plus, Store, Edit2, ToggleLeft, ToggleRight, QrCode, Copy } from 'lucide-react'
import QRCode from 'qrcode'

interface Props {
  establishments: Establishment[]
  brands: Pick<Brand, 'id' | 'name'>[]
  defaultBrandId: string | null
}

export function EstablishmentsManager({ establishments: initial, brands, defaultBrandId }: Props) {
  const [establishments, setEstablishments] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Establishment | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', address: '', brand_id: defaultBrandId || '' })
  const [loading, setLoading] = useState(false)
  const [qrModal, setQrModal] = useState<{ slug: string; dataUrl: string } | null>(null)

  function openNew() { setEditing(null); setForm({ name: '', slug: '', address: '', brand_id: defaultBrandId || '' }); setShowForm(true) }
  function openEdit(e: Establishment) { setEditing(e); setForm({ name: e.name, slug: e.slug, address: e.address || '', brand_id: e.brand_id }); setShowForm(true) }

  async function handleSave() {
    if (!form.name || !form.slug || !form.brand_id) return
    setLoading(true)
    const supabase = createClient()
    if (editing) {
      const { data } = await supabase.from('establishments').update({ name: form.name, slug: form.slug, address: form.address }).eq('id', editing.id).select().single()
      if (data) setEstablishments(es => es.map(e => e.id === editing.id ? data : e))
    } else {
      const { data } = await supabase.from('establishments').insert({ ...form, active: true }).select().single()
      if (data) setEstablishments(es => [...es, data])
    }
    setShowForm(false); setLoading(false)
  }

  async function toggleActive(est: Establishment) {
    const supabase = createClient()
    const { data } = await supabase.from('establishments').update({ active: !est.active }).eq('id', est.id).select().single()
    if (data) setEstablishments(es => es.map(e => e.id === est.id ? data : e))
  }

  async function showQR(slug: string) {
    const url = `${window.location.origin}/t/${slug}`
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    setQrModal({ slug, dataUrl })
  }

  function slugify(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Establecimientos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los locales de tu marca</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo</Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} establecimiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) })) }}
            />
            <Input label="Slug (URL) *" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            <Input label="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="md:col-span-2" />
            {brands.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Marca *</label>
                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}>
                  <option value="">Seleccionar marca...</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {establishments.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No hay establecimientos aún.
          </div>
        )}
        {establishments.map(est => (
          <div key={est.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Store size={18} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{est.name}</p>
              <p className="text-xs text-gray-500">{est.address || 'Sin dirección'} · /{est.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${est.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {est.active ? 'Activo' : 'Inactivo'}
              </span>
              <Button size="sm" variant="ghost" onClick={() => showQR(est.slug)}><QrCode size={15} /></Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(est)}><Edit2 size={15} /></Button>
              <Button size="sm" variant="ghost" onClick={() => toggleActive(est)}>
                {est.active ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <h3 className="font-bold text-gray-900 mb-4">QR del establecimiento</h3>
            <img src={qrModal.dataUrl} alt="QR" className="mx-auto rounded-lg" />
            <p className="text-xs text-gray-500 mt-3 break-all">{typeof window !== 'undefined' ? `${window.location.origin}/t/${qrModal.slug}` : ''}</p>
            <div className="flex gap-2 mt-4">
              <Button className="flex-1" onClick={() => {
                const a = document.createElement('a'); a.href = qrModal.dataUrl
                a.download = `qr-${qrModal.slug}.png`; a.click()
              }}>Descargar</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setQrModal(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
