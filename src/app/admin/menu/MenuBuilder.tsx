'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Plus, Edit2, Trash2, UtensilsCrossed, Tag, Package,
  ChevronDown, ToggleLeft, ToggleRight, ExternalLink, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type OrderStatus = 'pending' | 'received' | 'preparing' | 'ready' | 'delivered'

interface MenuItem { id: string; name: string; description: string | null; price: number | null; available: boolean; sort_order: number; category_id: string }
interface MenuCategory { id: string; name: string; sort_order: number; menu_id: string; menu_items: MenuItem[] }
interface Menu { id: string; establishment_id: string; name: string; active: boolean; menu_categories: MenuCategory[] }
interface PreOrder { id: string; establishment_id: string; customer_name: string; customer_phone: string | null; items: any[]; total: number | null; notes: string | null; status: OrderStatus; created_at: string }

const ORDER_STATUS: Record<OrderStatus, { label: string; color: string; next?: OrderStatus; nextLabel?: string }> = {
  pending:   { label: 'Nuevo',       color: 'bg-yellow-100 text-yellow-700', next: 'received',  nextLabel: 'Recibir' },
  received:  { label: 'Recibido',    color: 'bg-blue-100 text-blue-700',     next: 'preparing', nextLabel: 'Preparando' },
  preparing: { label: 'Preparando',  color: 'bg-orange-100 text-orange-700', next: 'ready',     nextLabel: 'Listo' },
  ready:     { label: 'Listo',       color: 'bg-green-100 text-green-700',   next: 'delivered', nextLabel: 'Entregado' },
  delivered: { label: 'Entregado',   color: 'bg-gray-100 text-gray-600' },
}

interface Props {
  establishments: { id: string; name: string; brand_id: string; slug: string }[]
  menus: Menu[]
  preOrders: PreOrder[]
  defaultEstId: string | null
}

export function MenuBuilder({ establishments, menus: initialMenus, preOrders: initialOrders, defaultEstId }: Props) {
  const [tab, setTab] = useState<'menu' | 'orders'>('menu')
  const [selectedEst, setSelectedEst] = useState(defaultEstId || (establishments.length === 1 ? establishments[0].id : ''))
  const [menus, setMenus] = useState(initialMenus)
  const [orders, setOrders] = useState(initialOrders)

  // Menu creation
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [menuName, setMenuName] = useState('')
  const [loadingMenu, setLoadingMenu] = useState(false)

  // Category form
  const [catForms, setCatForms] = useState<Record<string, string>>({})

  // Item form
  const [itemForms, setItemForms] = useState<Record<string, { name: string; description: string; price: string; open: boolean }>>({})

  const estMenus = menus.filter(m => m.establishment_id === selectedEst)
  const estOrders = orders.filter(o => o.establishment_id === selectedEst)
  const currentEst = establishments.find(e => e.id === selectedEst)

  async function createMenu() {
    if (!menuName.trim() || !selectedEst) return
    setLoadingMenu(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('menus')
      .insert({ establishment_id: selectedEst, name: menuName.trim(), active: true })
      .select('*, menu_categories(*, menu_items(*))')
      .single()
    setLoadingMenu(false)
    if (!error && data) {
      setMenus(prev => [...prev, data as any])
      setMenuName(''); setShowMenuForm(false)
    }
  }

  async function toggleMenuActive(menu: Menu) {
    const supabase = createClient()
    await supabase.from('menus').update({ active: !menu.active }).eq('id', menu.id)
    setMenus(prev => prev.map(m => m.id === menu.id ? { ...m, active: !m.active } : m))
  }

  async function addCategory(menuId: string) {
    const name = catForms[menuId]?.trim()
    if (!name) return
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_categories')
      .insert({ menu_id: menuId, name, sort_order: 0 })
      .select()
      .single()
    if (data) {
      setMenus(prev => prev.map(m => m.id === menuId
        ? { ...m, menu_categories: [...m.menu_categories, { ...data, menu_items: [] } as any] }
        : m
      ))
      setCatForms(prev => ({ ...prev, [menuId]: '' }))
    }
  }

  async function addItem(catId: string, menuId: string) {
    const f = itemForms[catId]
    if (!f?.name?.trim()) return
    const supabase = createClient()
    const { data } = await supabase
      .from('menu_items')
      .insert({
        category_id: catId,
        name: f.name.trim(),
        description: f.description.trim() || null,
        price: f.price ? parseFloat(f.price) : null,
        available: true,
        sort_order: 0,
      })
      .select()
      .single()
    if (data) {
      setMenus(prev => prev.map(m => m.id === menuId ? {
        ...m,
        menu_categories: m.menu_categories.map(c => c.id === catId
          ? { ...c, menu_items: [...c.menu_items, data as any] }
          : c
        )
      } : m))
      setItemForms(prev => ({ ...prev, [catId]: { name: '', description: '', price: '', open: false } }))
    }
  }

  async function toggleItemAvailable(item: MenuItem, menuId: string) {
    const supabase = createClient()
    await supabase.from('menu_items').update({ available: !item.available }).eq('id', item.id)
    setMenus(prev => prev.map(m => m.id === menuId ? {
      ...m,
      menu_categories: m.menu_categories.map(c => ({
        ...c,
        menu_items: c.menu_items.map(i => i.id === item.id ? { ...i, available: !i.available } : i)
      }))
    } : m))
  }

  async function deleteItem(itemId: string, catId: string, menuId: string) {
    const supabase = createClient()
    await supabase.from('menu_items').delete().eq('id', itemId)
    setMenus(prev => prev.map(m => m.id === menuId ? {
      ...m,
      menu_categories: m.menu_categories.map(c => c.id === catId
        ? { ...c, menu_items: c.menu_items.filter(i => i.id !== itemId) }
        : c
      )
    } : m))
  }

  async function advanceOrder(orderId: string, nextStatus: OrderStatus) {
    const supabase = createClient()
    await supabase.from('pre_orders').update({ status: nextStatus }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Menú / Preorden</h1>
          <p className="text-sm text-gray-500 mt-0.5">Constructor de menús y gestión de pedidos anticipados</p>
        </div>
        {currentEst && (
          <a href={`/order/${currentEst.slug}`} target="_blank"
            className="flex items-center gap-1 text-xs text-indigo-600 underline">
            <ExternalLink size={12} /> Ver menú público
          </a>
        )}
      </div>

      {/* Establishment selector */}
      {establishments.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Select label="Sucursal" value={selectedEst}
            onChange={e => setSelectedEst(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </div>
      )}

      {!selectedEst && (
        <div className="text-center py-16 text-gray-400">Selecciona un establecimiento</div>
      )}

      {selectedEst && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
            {(['menu', 'orders'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {t === 'menu' ? `Menú (${estMenus.length})` : `Pedidos (${estOrders.filter(o => o.status !== 'delivered').length})`}
              </button>
            ))}
          </div>

          {/* MENU TAB */}
          {tab === 'menu' && (
            <div className="flex flex-col gap-6">
              {/* New menu button */}
              {!showMenuForm ? (
                <Button variant="secondary" onClick={() => setShowMenuForm(true)}>
                  <Plus size={16} className="mr-1" /> Nuevo menú
                </Button>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                  <Input placeholder="Nombre del menú (ej: Carta principal)" value={menuName}
                    onChange={e => setMenuName(e.target.value)} className="flex-1" />
                  <Button loading={loadingMenu} onClick={createMenu}>Crear</Button>
                  <Button variant="secondary" onClick={() => setShowMenuForm(false)}>✕</Button>
                </div>
              )}

              {/* Menus list */}
              {estMenus.map(menu => (
                <div key={menu.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Menu header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <UtensilsCrossed size={18} className="text-indigo-500" />
                      <span className="font-semibold text-gray-900">{menu.name}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        menu.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {menu.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => toggleMenuActive(menu)}>
                      {menu.active ? <ToggleRight size={15} className="text-green-600" /> : <ToggleLeft size={15} />}
                    </Button>
                  </div>

                  {/* Categories */}
                  <div className="p-4 flex flex-col gap-4">
                    {menu.menu_categories.map(cat => (
                      <div key={cat.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="bg-indigo-50 px-4 py-2.5 flex items-center justify-between">
                          <span className="text-sm font-semibold text-indigo-800">{cat.name}</span>
                          <span className="text-xs text-indigo-500">{cat.menu_items.length} items</span>
                        </div>
                        {/* Items */}
                        {cat.menu_items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100">
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium', !item.available && 'opacity-40 line-through')}>{item.name}</p>
                              {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                            </div>
                            {item.price != null && (
                              <span className="text-sm font-bold text-gray-700 shrink-0">
                                ${Number(item.price).toLocaleString('es', { minimumFractionDigits: 0 })}
                              </span>
                            )}
                            <button onClick={() => toggleItemAvailable(item, menu.id)}
                              className="text-gray-400 hover:text-indigo-600 shrink-0">
                              {item.available ? <ToggleRight size={16} className="text-green-600" /> : <ToggleLeft size={16} />}
                            </button>
                            <button onClick={() => deleteItem(item.id, cat.id, menu.id)}
                              className="text-gray-300 hover:text-red-500 shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {/* Add item form */}
                        {itemForms[cat.id]?.open ? (
                          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input placeholder="Nombre del item *" value={itemForms[cat.id]?.name || ''}
                                onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value } }))} />
                              <Input placeholder="Precio" type="number" value={itemForms[cat.id]?.price || ''}
                                onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], price: e.target.value } }))} />
                            </div>
                            <Input placeholder="Descripción (opcional)" value={itemForms[cat.id]?.description || ''}
                              onChange={e => setItemForms(prev => ({ ...prev, [cat.id]: { ...prev[cat.id], description: e.target.value } }))} />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => addItem(cat.id, menu.id)}>Agregar</Button>
                              <Button size="sm" variant="ghost" onClick={() => setItemForms(prev => ({ ...prev, [cat.id]: { name: '', description: '', price: '', open: false } }))}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setItemForms(prev => ({ ...prev, [cat.id]: { name: '', description: '', price: '', open: true } }))}
                            className="w-full px-4 py-2 border-t border-gray-100 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-colors">
                            <Plus size={12} /> Agregar item
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add category */}
                    <div className="flex gap-2">
                      <Input placeholder="Nueva categoría (ej: Entradas, Bebidas...)"
                        value={catForms[menu.id] || ''}
                        onChange={e => setCatForms(prev => ({ ...prev, [menu.id]: e.target.value }))} />
                      <Button size="sm" onClick={() => addCategory(menu.id)}>
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {estMenus.length === 0 && !showMenuForm && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
                  <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No hay menús para este establecimiento</p>
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === 'orders' && (
            <div className="flex flex-col gap-3">
              {estOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  <p>No hay pedidos activos</p>
                </div>
              )}
              {estOrders.map(order => {
                const sc = ORDER_STATUS[order.status]
                return (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-gray-900">{order.customer_name}</p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc.color)}>{sc.label}</span>
                        </div>
                        {order.customer_phone && <p className="text-xs text-gray-400 mb-2">{order.customer_phone}</p>}
                        <div className="flex flex-col gap-0.5">
                          {(order.items as any[]).map((item, i) => (
                            <p key={i} className="text-xs text-gray-600">
                              {item.qty}× {item.name}
                              {item.price ? ` — $${(item.qty * item.price).toLocaleString('es')}` : ''}
                            </p>
                          ))}
                        </div>
                        {order.total != null && (
                          <p className="text-sm font-bold text-gray-900 mt-2">
                            Total: ${Number(order.total).toLocaleString('es')}
                          </p>
                        )}
                        {order.notes && <p className="text-xs text-gray-400 italic mt-1">{order.notes}</p>}
                        <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(order.created_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {sc.next && (
                        <Button size="sm" onClick={() => advanceOrder(order.id, sc.next!)}>
                          {sc.nextLabel}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
