'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Establishment, Brand } from '@/types/database'
import { Plus, Store, Edit2, ToggleLeft, ToggleRight, QrCode, Building2, ChevronDown, Clock, CheckCircle, Settings2 } from 'lucide-react'
import QRCode from 'qrcode'

interface EstStat { waiting: number; today: number }

interface Props {
  establishments: Establishment[]
  brands: Pick<Brand, 'id' | 'name' | 'slug'>[]
  defaultBrandId: string | null
  ticketStats?: Record<string, EstStat>
  isSuperAdmin?: boolean
  maxEstablishments?: number
}

function FeaturesModal({ est, featureList, getFeatures, onSave, onClose, loading }: {
  est: Establishment
  featureList: { key: string; label: string; desc: string }[]
  getFeatures: (e: Establishment) => Record<string, boolean>
  onSave: (e: Establishment, f: Record<string, boolean>) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const [features, setFeatures] = useState<Record<string, boolean>>(getFeatures(est))

  function toggle(key: string) {
    if (key === 'queue') return // always on
    setFeatures(f => ({ ...f, [key]: !f[key] }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-gray-900 mb-1">Módulos activos</h3>
        <p className="text-sm text-gray-500 mb-5">{est.name}</p>
        <div className="flex flex-col gap-4">
          {featureList.map(({ key, label, desc }) => {
            const enabled = features[key] ?? (key === 'queue')
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  disabled={loading || key === 'queue'}
                  className={`shrink-0 w-11 h-6 rounded-full transition-colors flex items-center ${enabled ? 'bg-indigo-600' : 'bg-gray-300'} ${key === 'queue' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-6">
          <Button loading={loading} onClick={() => onSave(est, features)} className="flex-1">Guardar</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
        </div>
      </div>
    </div>
  )
}

export function EstablishmentsManager({ establishments: initial, brands, defaultBrandId, ticketStats = {}, isSuperAdmin, maxEstablishments }: Props) {
  const [establishments, setEstablishments] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Establishment | null>(null)

  // Si hay marca por defecto (brand_admin) o solo hay una marca, la preseleccionamos
  const autoBrandId = defaultBrandId || (brands.length === 1 ? brands[0].id : '')
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const [selectedBrandId, setSelectedBrandId] = useState(() => storeBrandId || autoBrandId)

  useEffect(() => {
    // storeBrandId puede ser '' (todas las marcas) o un UUID — ambos casos deben aplicarse
    setSelectedBrandId(storeBrandId || autoBrandId)
    setShowForm(false)
    setEditing(null)
  }, [storeBrandId]) // eslint-disable-line react-hooks/exhaustive-deps

  const emptyForm = { name: '', slug: '', address: '', brand_id: selectedBrandId }
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrModal, setQrModal] = useState<{ slug: string; dataUrl: string } | null>(null)
  const [featuresModal, setFeaturesModal] = useState<Establishment | null>(null)
  const [featuresLoading, setFeaturesLoading] = useState(false)

  const FEATURE_LIST = [
    { key: 'queue',        label: 'Cola de turnos',          desc: 'Página /t/[slug] para tomar turnos' },
    { key: 'appointments', label: 'Citas programadas',        desc: 'Reserva de citas en /book/[slug]' },
    { key: 'surveys',      label: 'Encuestas de satisfacción',desc: 'NPS / CSAT / CES post-atención' },
    { key: 'menu',         label: 'Menú / Preorden',          desc: 'Pedidos anticipados en /order/[slug]' },
  ]

  function getFeatures(est: Establishment): Record<string, boolean> {
    return (est as any).features ?? { queue: true, appointments: false, surveys: false, menu: false }
  }

  async function saveFeatures(est: Establishment, features: Record<string, boolean>) {
    setFeaturesLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('establishments')
      .update({ features })
      .eq('id', est.id)
      .select()
      .single()
    if (data) setEstablishments(es => es.map(e => e.id === est.id ? data : e))
    setFeaturesLoading(false)
    setFeaturesModal(null)
  }

  // Solo mostrar selector de marca si hay más de una
  const showBrandSelector = brands.length > 1
  const selectedBrand = brands.find(b => b.id === selectedBrandId)
  const filteredEstablishments = selectedBrandId
    ? establishments.filter(e => e.brand_id === selectedBrandId)
    : establishments

  // ── helpers ──────────────────────────────────────────────
  function slugify(str: string) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /** Genera el slug prefijado con el slug de la marca seleccionada */
  function buildSlug(name: string) {
    const base = slugify(name)
    return selectedBrand ? `${selectedBrand.slug}-${base}` : base
  }

  // ── acciones ─────────────────────────────────────────────
  function handleBrandChange(brandId: string) {
    setSelectedBrandId(brandId)
    setForm(f => ({ ...f, brand_id: brandId }))
    setShowForm(false)
    setEditing(null)
  }

  function openNew() {
    // Limit check: superadmin is unrestricted; brand_admin respects maxEstablishments
    if (!isSuperAdmin && maxEstablishments !== undefined) {
      const brandEsts = establishments.filter(e => e.brand_id === selectedBrandId)
      if (brandEsts.length >= maxEstablishments) {
        setFormError(`Tu plan permite hasta ${maxEstablishments} sucursal${maxEstablishments === 1 ? '' : 'es'}. Actualiza tu membresía para agregar más.`)
        setShowForm(true)
        setEditing(null)
        return
      }
    }
    setEditing(null)
    setFormError('')
    setForm({ name: '', slug: '', address: '', brand_id: selectedBrandId })
    setShowForm(true)
  }

  function openEdit(e: Establishment) {
    setEditing(e)
    setFormError('')
    setForm({ name: e.name, slug: e.slug, address: e.address || '', brand_id: e.brand_id })
    setShowForm(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return }
    if (!form.slug.trim()) { setFormError('El slug es requerido'); return }
    if (!form.brand_id) { setFormError('Debes seleccionar una marca'); return }

    // Re-check the limit on save (guards against bypassing openNew)
    if (!isSuperAdmin && !editing && maxEstablishments !== undefined) {
      const brandEsts = establishments.filter(e => e.brand_id === selectedBrandId)
      if (brandEsts.length >= maxEstablishments) {
        setFormError(`Tu plan permite hasta ${maxEstablishments} sucursal${maxEstablishments === 1 ? '' : 'es'}. Actualiza tu membresía para agregar más.`)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()
    if (editing) {
      const { data, error } = await supabase
        .from('establishments')
        .update({ name: form.name, slug: form.slug, address: form.address })
        .eq('id', editing.id)
        .select()
        .single()
      if (error) { setFormError(error.message); setLoading(false); return }
      if (data) setEstablishments(es => es.map(e => e.id === editing.id ? data : e))
    } else {
      const { data, error } = await supabase
        .from('establishments')
        .insert({ ...form, active: true })
        .select()
        .single()
      if (error) { setFormError(error.message); setLoading(false); return }
      if (data) setEstablishments(es => [...es, data])
    }
    setShowForm(false)
    setLoading(false)
  }

  async function toggleActive(est: Establishment) {
    const supabase = createClient()
    const { data } = await supabase
      .from('establishments')
      .update({ active: !est.active })
      .eq('id', est.id)
      .select()
      .single()
    if (data) setEstablishments(es => es.map(e => e.id === est.id ? data : e))
  }

  async function showQR(slug: string) {
    const url = `${window.location.origin}/t/${slug}`
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
    setQrModal({ slug, dataUrl })
  }

  // ── render ───────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sucursales <span className="ml-1 text-sm font-normal text-gray-400">({filteredEstablishments.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedBrand
              ? `Marca: ${selectedBrand.name}`
              : 'Selecciona una marca para comenzar'}
          </p>
        </div>
        <Button
          onClick={openNew}
          disabled={!selectedBrandId}
          title={
            !isSuperAdmin && maxEstablishments !== undefined &&
            establishments.filter(e => e.brand_id === selectedBrandId).length >= maxEstablishments
              ? `Límite de ${maxEstablishments} sucursal${maxEstablishments === 1 ? '' : 'es'} alcanzado`
              : undefined
          }
        >
          <Plus size={16} className="mr-1" /> Nuevo
        </Button>
      </div>


      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            {editing ? 'Editar' : 'Nueva'} sucursal
            {selectedBrand && (
              <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedBrand.name}
              </span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre *"
              value={form.name}
              onChange={e => {
                const name = e.target.value
                setForm(f => ({ ...f, name, slug: editing ? f.slug : buildSlug(name) }))
              }}
            />
            <Input
              label="Slug (URL) *"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              helper={
                selectedBrand && !editing
                  ? `Debe comenzar con "${selectedBrand.slug}-"`
                  : undefined
              }
            />
            <Input
              label="Dirección"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="md:col-span-2"
            />
          </div>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
              {formError}
            </p>
          )}
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay marca seleccionada */}
      {showBrandSelector && !selectedBrandId && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Selecciona una marca para ver sus sucursales</p>
        </div>
      )}

      {/* Lista de establecimientos */}
      {selectedBrandId && (
        <div className="flex flex-col gap-3">
          {filteredEstablishments.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
              No hay sucursales para esta marca aún.
            </div>
          )}
          {filteredEstablishments.map(est => {
            const stats = ticketStats[est.id] ?? { waiting: 0, today: 0 }
            return (
            <div key={est.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Store size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{est.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {est.address || 'Sin dirección'} · <span className="font-mono">/t/{est.slug}</span>
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock size={10} /> {stats.waiting} en espera
                  </span>
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} /> {stats.today} atendidos hoy
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${est.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {est.active ? 'Activo' : 'Inactivo'}
                </span>
                {isSuperAdmin && (
                  <Button size="sm" variant="ghost" title="Módulos" onClick={() => setFeaturesModal(est)}>
                    <Settings2 size={15} />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => showQR(est.slug)}>
                  <QrCode size={15} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(est)}>
                  <Edit2 size={15} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleActive(est)}>
                  {est.active
                    ? <ToggleRight size={15} className="text-green-600" />
                    : <ToggleLeft size={15} />
                  }
                </Button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Features Modal */}
      {featuresModal && (
        <FeaturesModal
          est={featuresModal}
          featureList={FEATURE_LIST}
          getFeatures={getFeatures}
          onSave={saveFeatures}
          onClose={() => setFeaturesModal(null)}
          loading={featuresLoading}
        />
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center">
            <h3 className="font-bold text-gray-900 mb-4">QR de la sucursal</h3>
            <img src={qrModal.dataUrl} alt="QR" className="mx-auto rounded-lg" />
            <p className="text-xs text-gray-500 mt-3 break-all font-mono">
              {typeof window !== 'undefined' ? `${window.location.origin}/t/${qrModal.slug}` : ''}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = qrModal.dataUrl
                  a.download = `qr-${qrModal.slug}.png`
                  a.click()
                }}
              >
                Descargar
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setQrModal(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
