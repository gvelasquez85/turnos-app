'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, CheckCircle, UtensilsCrossed } from 'lucide-react'

interface MenuItem { id: string; name: string; description: string | null; price: number | null; available: boolean }
interface MenuCategory { id: string; name: string; sort_order: number; menu_items: MenuItem[] }
interface Menu { id: string; name: string; menu_categories: MenuCategory[] }
interface CartItem { item: MenuItem; qty: number }

interface Props {
  establishment: { id: string; name: string; brands: { name: string } }
  menu: Menu | null
}

export function OrderFlow({ establishment, menu }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<'menu' | 'checkout' | 'done'>('menu')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const brand = establishment.brands

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { item, qty: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === itemId)
      if (!existing) return prev
      if (existing.qty === 1) return prev.filter(c => c.item.id !== itemId)
      return prev.map(c => c.item.id === itemId ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  function cartQty(itemId: string) {
    return cart.find(c => c.item.id === itemId)?.qty ?? 0
  }

  const total = cart.reduce((sum, c) => sum + (c.item.price ?? 0) * c.qty, 0)
  const itemCount = cart.reduce((sum, c) => sum + c.qty, 0)

  async function handleOrder() {
    if (!customerName.trim() || !customerPhone.trim()) return
    setLoading(true)
    const supabase = createClient()
    const items = cart.map(c => ({
      item_id: c.item.id,
      name: c.item.name,
      qty: c.qty,
      price: c.item.price,
    }))

    const { data, error } = await supabase
      .from('pre_orders')
      .insert({
        establishment_id: establishment.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        items,
        total: total || null,
        notes: notes.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single()

    setLoading(false)
    if (!error && data) {
      setOrderId(data.id)
      setStep('done')
    }
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <UtensilsCrossed size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">{brand.name}</h2>
        <p className="text-gray-400">{establishment.name} no tiene un menú activo disponible.</p>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={64} className="text-white mx-auto mb-4" />
          <h1 className="text-white text-2xl font-bold mb-1">¡Pedido enviado!</h1>
          <p className="text-white/70 mb-8">Tu pedido está siendo procesado</p>
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-left">
            <div className="flex flex-col gap-2 mb-4">
              {cart.map(c => (
                <div key={c.item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{c.qty}× {c.item.name}</span>
                  {c.item.price != null && (
                    <span className="font-medium">${(c.qty * c.item.price).toLocaleString('es')}</span>
                  )}
                </div>
              ))}
            </div>
            {total > 0 && (
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-indigo-600">${total.toLocaleString('es')}</span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4 text-center">Pedido #{orderId?.slice(-6).toUpperCase()}</p>
          </div>
          <p className="text-white/50 text-xs mt-6">{brand.name} · {establishment.name}</p>
        </div>
      </div>
    )
  }

  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-indigo-600 text-white text-center py-5 px-4">
          <h1 className="text-xl font-bold">{brand.name}</h1>
          <p className="text-indigo-200 text-sm">{establishment.name}</p>
        </div>
        <div className="flex-1 p-6 max-w-sm mx-auto w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu pedido</h2>
          {/* Cart summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col gap-2">
            {cart.map(c => (
              <div key={c.item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{c.qty}× {c.item.name}</span>
                {c.item.price != null && (
                  <span className="font-medium">${(c.qty * c.item.price).toLocaleString('es')}</span>
                )}
              </div>
            ))}
            {total > 0 && (
              <div className="border-t pt-2 flex justify-between font-bold text-sm mt-1">
                <span>Total</span>
                <span className="text-indigo-600">${total.toLocaleString('es')}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Input label="Nombre *" value={customerName}
              onChange={e => setCustomerName(e.target.value)} />
            <Input label="Teléfono *" type="tel" value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notas / instrucciones</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Sin cebolla, extra picante..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <Button size="lg" className="w-full" loading={loading}
              disabled={!customerName.trim() || !customerPhone.trim()}
              onClick={handleOrder}>
              Confirmar pedido
            </Button>
            <button onClick={() => setStep('menu')}
              className="text-center text-sm text-gray-400 hover:text-gray-600">
              ← Volver al menú
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <div className="bg-indigo-600 text-white text-center py-5 px-4">
        <h1 className="text-xl font-bold">{brand.name}</h1>
        <p className="text-indigo-200 text-sm">{establishment.name}</p>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{menu.name}</h2>
        {menu.menu_categories
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(cat => (
            <div key={cat.id} className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">{cat.name}</h3>
              <div className="flex flex-col gap-2">
                {cat.menu_items.filter(i => i.available).map(item => {
                  const qty = cartQty(item.id)
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                        {item.price != null && (
                          <p className="text-sm font-bold text-indigo-600 mt-1">
                            ${Number(item.price).toLocaleString('es')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 ? (
                          <>
                            <button onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200">
                              <Minus size={14} />
                            </button>
                            <span className="w-5 text-center font-bold text-sm text-gray-900">{qty}</span>
                          </>
                        ) : null}
                        <button onClick={() => addToCart(item)}
                          className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Cart bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button size="lg" className="w-full max-w-lg mx-auto flex items-center justify-between"
            onClick={() => setStep('checkout')}>
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            <span>Ver pedido</span>
            {total > 0 && <span className="font-bold">${total.toLocaleString('es')}</span>}
          </Button>
        </div>
      )}
    </div>
  )
}
