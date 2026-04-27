'use client'
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart, FileCheck, Search, Plus, Minus, Trash2,
  Save, ArrowLeft, Loader2, User, Building2, ChevronDown,
} from 'lucide-react'

interface Product { id: string; name: string; sku: string | null; price: number; unit: string; stock: number }
interface Customer { id: string; name: string; phone: string | null }
interface Establishment { id: string; name: string }

interface LineItem {
  product_id: string
  product_name: string
  product_sku: string | null
  unit_price: number
  qty: number
  discount: number
}

interface Props {
  brandId: string
  userId: string
  products: Product[]
  customers: Customer[]
  establishments: Establishment[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export function NuevaVentaForm({ brandId, userId, products, customers, establishments }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') === 'quote' ? 'quote' : 'sale'

  const [type, setType] = useState<'sale' | 'quote'>(defaultType)
  const [customerId, setCustomerId] = useState('')
  const [establishmentId, setEstablishmentId] = useState(establishments[0]?.id ?? '')
  const [items, setItems] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showProductList, setShowProductList] = useState(false)
  const [saving, setSaving] = useState(false)
  const [globalDiscount, setGlobalDiscount] = useState(0)

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 20)
    const q = productSearch.toLowerCase()
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
  }, [products, productSearch])

  function addProduct(p: Product) {
    const existing = items.findIndex(i => i.product_id === p.id)
    if (existing >= 0) {
      setItems(its => its.map((it, idx) => idx === existing ? { ...it, qty: it.qty + 1 } : it))
    } else {
      setItems(its => [...its, {
        product_id: p.id,
        product_name: p.name,
        product_sku: p.sku,
        unit_price: p.price,
        qty: 1,
        discount: 0,
      }])
    }
    setProductSearch('')
    setShowProductList(false)
  }

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems(its => its.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  function removeItem(idx: number) {
    setItems(its => its.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.unit_price - it.discount, 0)
  const total = Math.max(0, subtotal - globalDiscount)

  async function handleSave() {
    if (items.length === 0) return
    setSaving(true)
    const supabase = createClient()

    const salePayload = {
      brand_id: brandId,
      type,
      status: type === 'sale' ? 'completed' : 'draft',
      establishment_id: establishmentId || null,
      customer_id: customerId || null,
      subtotal,
      discount: globalDiscount,
      total,
      notes: notes || null,
      created_by: userId,
    }

    const { data: sale, error } = await supabase.from('sales').insert(salePayload).select().single()
    if (error || !sale) { setSaving(false); alert('Error al guardar: ' + error?.message); return }

    // Insert line items
    const lineItems = items.map(it => ({
      sale_id: sale.id,
      product_id: it.product_id,
      product_name: it.product_name,
      product_sku: it.product_sku,
      qty: it.qty,
      unit_price: it.unit_price,
      discount: it.discount,
      line_total: it.qty * it.unit_price - it.discount,
    }))
    await supabase.from('sale_items').insert(lineItems)

    // Decrease stock for sales
    if (type === 'sale') {
      for (const it of items) {
        if (it.product_id) {
          const prod = products.find(p => p.id === it.product_id)
          if (prod) {
            const newStock = prod.stock - Math.ceil(it.qty)
            await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
            await supabase.from('stock_movements').insert({
              product_id: it.product_id,
              brand_id: brandId,
              type: 'sale',
              qty_change: -Math.ceil(it.qty),
              qty_after: newStock,
              reference_id: sale.id,
            })
          }
        }
      }
    }

    setSaving(false)
    router.push(type === 'quote' ? '/admin/ventas/cotizaciones' : '/admin/ventas')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {type === 'quote' ? 'Nueva cotización' : 'Nueva venta'}
          </h1>
        </div>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        {(['sale', 'quote'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              type === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'sale' ? <ShoppingCart size={14} /> : <FileCheck size={14} />}
            {t === 'sale' ? 'Venta directa' : 'Cotización'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Productos</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Buscar producto o servicio..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowProductList(true) }}
                onFocus={() => setShowProductList(true)}
              />
              {showProductList && (productSearch || true) && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-52 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                  ) : filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onMouseDown={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        {p.sku && <p className="text-xs text-gray-400">{p.sku}</p>}
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{fmt(p.price)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Line items */}
            {items.length > 0 && (
              <div className="mt-4 space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{it.product_name}</p>
                      <p className="text-xs text-gray-400">{fmt(it.unit_price)} c/u</p>
                    </div>
                    {/* Qty */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => it.qty > 1 ? updateItem(idx, { qty: it.qty - 1 }) : removeItem(idx)}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-red-300 hover:text-red-500"
                      >
                        <Minus size={10} />
                      </button>
                      <input
                        type="number"
                        className="w-12 text-center text-sm font-semibold border border-gray-200 rounded-lg py-0.5 focus:border-emerald-500 focus:outline-none"
                        value={it.qty}
                        min={0.1}
                        step={1}
                        onChange={e => updateItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                      />
                      <button
                        onClick={() => updateItem(idx, { qty: it.qty + 1 })}
                        className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900 w-20 text-right shrink-0">
                      {fmt(it.qty * it.unit_price - it.discount)}
                    </p>
                    <button onClick={() => removeItem(idx)} className="p-1 text-gray-300 hover:text-red-500 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">
                Busca y agrega productos de arriba
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">Notas</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="Condiciones, observaciones, vigencia de la cotización..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <User size={13} className="text-gray-400" />
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cliente</p>
            </div>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
            >
              <option value="">Sin cliente registrado</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Establishment */}
          {establishments.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Building2 size={13} className="text-gray-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sucursal</p>
              </div>
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                value={establishmentId}
                onChange={e => setEstablishmentId(e.target.value)}
              >
                {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Resumen</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Descuento</span>
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    className="w-20 text-right rounded border border-gray-200 px-1 py-0.5 text-sm focus:border-emerald-500 focus:outline-none"
                    value={globalDiscount}
                    min={0}
                    onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : (type === 'quote' ? <FileCheck size={14} /> : <ShoppingCart size={14} />)}
              {saving ? 'Guardando...' : type === 'quote' ? 'Crear cotización' : 'Registrar venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
