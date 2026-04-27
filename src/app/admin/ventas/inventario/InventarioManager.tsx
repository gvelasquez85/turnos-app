'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Package, Plus, Search, Edit2, X, Save, Loader2,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Tag, DollarSign, Archive,
} from 'lucide-react'

interface Product {
  id: string
  brand_id: string
  establishment_id: string | null
  name: string
  sku: string | null
  description: string | null
  category: string | null
  price: number
  cost: number
  stock: number
  min_stock: number
  unit: string
  active: boolean
  created_at: string
}

interface Establishment { id: string; name: string }

interface Props {
  brandId: string
  products: Product[]
  establishments: Establishment[]
}

const UNITS = ['unidad', 'par', 'caja', 'docena', 'kg', 'g', 'L', 'mL', 'hora', 'servicio']

const EMPTY_FORM = {
  name: '', sku: '', description: '', category: '',
  price: '', cost: '', stock: '0', min_stock: '0', unit: 'unidad',
  establishment_id: '',
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

type SortField = 'name' | 'stock' | 'price'

export function InventarioManager({ brandId, products: initial, establishments }: Props) {
  const [products, setProducts] = useState<Product[]>(initial)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [stockEdit, setStockEdit] = useState<{ id: string; value: string } | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [products])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.active)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
    }
    if (filterCat) list = list.filter(p => p.category === filterCat)
    list.sort((a, b) => {
      const av: any = a[sortField]; const bv: any = b[sortField]
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return list
  }, [products, search, filterCat, sortField, sortDir])

  function openCreate() {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      name: p.name, sku: p.sku ?? '', description: p.description ?? '',
      category: p.category ?? '', price: String(p.price), cost: String(p.cost),
      stock: String(p.stock), min_stock: String(p.min_stock), unit: p.unit,
      establishment_id: p.establishment_id ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      brand_id: brandId,
      name: form.name.trim(),
      sku: form.sku || null,
      description: form.description || null,
      category: form.category || null,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 0,
      unit: form.unit,
      establishment_id: form.establishment_id || null,
    }

    if (editProduct) {
      const { data } = await supabase.from('products').update(payload).eq('id', editProduct.id).select().single()
      if (data) setProducts(ps => ps.map(p => p.id === editProduct.id ? data as Product : p))
    } else {
      const { data } = await supabase.from('products').insert(payload).select().single()
      if (data) setProducts(ps => [data as Product, ...ps])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function handleStockSave(id: string) {
    if (!stockEdit) return
    const newStock = parseInt(stockEdit.value)
    if (isNaN(newStock)) { setStockEdit(null); return }
    const supabase = createClient()
    const { data } = await supabase.from('products').update({ stock: newStock }).eq('id', id).select().single()
    if (data) setProducts(ps => ps.map(p => p.id === id ? data as Product : p))
    setStockEdit(null)
  }

  async function toggleActive(p: Product) {
    const supabase = createClient()
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    setProducts(ps => ps.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
  }

  const SortIcon = ({ f }: { f: SortField }) =>
    sortField === f
      ? sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
      : <ChevronDown size={11} className="opacity-30" />

  const lowStock = products.filter(p => p.active && p.stock <= p.min_stock && p.min_stock > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 text-sm mt-1">{products.filter(p => p.active).length} productos activos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <Plus size={15} /> Nuevo producto
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stock bajo en {lowStock.length} producto{lowStock.length > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? ` y ${lowStock.length - 3} más` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Buscar por nombre, SKU, categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none"
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <Package size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">
            {products.length === 0 ? 'Aún no hay productos' : 'Sin resultados'}
          </p>
          {products.length === 0 && (
            <button onClick={openCreate} className="mt-3 text-sm text-emerald-600 underline">
              Agregar primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('name')}>
                      Producto <SortIcon f="name" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left hidden md:table-cell">Categoría / SKU</th>
                  <th className="px-4 py-2.5 text-right">
                    <button className="flex items-center gap-1 hover:text-gray-700 ml-auto" onClick={() => toggleSort('price')}>
                      Precio <SortIcon f="price" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-center">
                    <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('stock')}>
                      Stock <SortIcon f="stock" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const lowS = p.min_stock > 0 && p.stock <= p.min_stock
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            lowS ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            <Package size={13} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {p.category && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{p.category}</span>
                        )}
                        {p.sku && <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">{fmt(p.price)}</p>
                        {p.cost > 0 && <p className="text-[10px] text-gray-400">costo: {fmt(p.cost)}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stockEdit?.id === p.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center focus:border-emerald-500 focus:outline-none"
                              value={stockEdit.value}
                              onChange={e => setStockEdit({ id: p.id, value: e.target.value })}
                              onKeyDown={e => { if (e.key === 'Enter') handleStockSave(p.id); if (e.key === 'Escape') setStockEdit(null) }}
                              autoFocus
                            />
                            <button onClick={() => handleStockSave(p.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                              <CheckCircle size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setStockEdit({ id: p.id, value: String(p.stock) })}
                            className={`text-sm font-bold hover:underline ${lowS ? 'text-amber-600' : 'text-gray-900'}`}
                            title="Haz clic para ajustar stock"
                          >
                            {p.stock}
                            {lowS && <AlertTriangle size={10} className="inline ml-1 text-amber-500" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Editar"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => toggleActive(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            title="Archivar"
                          >
                            <Archive size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} productos
          </div>
        </div>
      )}

      {/* Product form slide-over */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editProduct ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Corte de cabello"
                />
              </div>
              {/* Category + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Ej: Servicios"
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">SKU / Código</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              {/* Price + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Precio de venta *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 pl-6 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Costo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-gray-300 pl-6 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      value={form.cost}
                      onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              {/* Stock + Min stock + Unit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock inicial</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stock mín.</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.min_stock}
                    onChange={e => setForm(f => ({ ...f, min_stock: e.target.value }))}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unidad</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional del producto o servicio"
                />
              </div>
              {/* Establishment */}
              {establishments.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sucursal (opcional)</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    value={form.establishment_id}
                    onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}
                  >
                    <option value="">Disponible en todas las sucursales</option>
                    {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Guardando...' : editProduct ? 'Guardar cambios' : 'Crear producto'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
