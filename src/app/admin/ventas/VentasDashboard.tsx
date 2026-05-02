'use client'
import { useState, useMemo, useCallback } from 'react'
import { SALE_COMPLETED_SET } from '@/lib/saleStatus'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart, TrendingUp, FileCheck,
  ArrowRight, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
  Eye, Edit3, Truck, X, Loader2,
  User, Building2, Calendar, Package,
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Sale {
  id: string
  type: string
  status: string
  total: number
  subtotal?: number
  discount?: number
  created_at: string
  establishment_id: string | null
  customer_id: string | null
  customers: { name: string; email?: string | null } | null
  fulfillment_type?: string | null
  notes?: string | null
}

interface SaleItem {
  product_name: string
  product_sku?: string | null
  qty: number
  unit_price: number
  line_total: number
}

interface Establishment { id: string; name: string }

interface Props {
  brandId: string
  recentSales: Sale[]
  pendingSales: Sale[]
  establishments: Establishment[]
}

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending:         { label: 'Pendiente',       color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  facturado:       { label: 'Facturado',       color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  en_alistamiento: { label: 'En alistamiento', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  despachado:      { label: 'Despachado',      color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  entregado:       { label: 'Entregado',       color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  completado:      { label: 'Completado',      color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  completed:       { label: 'Completado',      color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  cancelled:       { label: 'Cancelado',       color: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
}

// Status flows
const SERVICE_FLOW = ['pending', 'completado']
const PHYSICAL_FLOW = ['pending', 'facturado', 'en_alistamiento', 'despachado', 'entregado']

function getFlow(fulfillmentType?: string | null) {
  return fulfillmentType === 'physical' ? PHYSICAL_FLOW : SERVICE_FLOW
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  const date = new Date(d)
  const today = new Date()
  const diff = Math.floor((today.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return `Hoy ${date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
  if (diff === 1) return 'Ayer'
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function fmtDateFull(d: string) {
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function VentasDashboard({ brandId, recentSales: initialRecent, pendingSales: initialPending, establishments }: Props) {
  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const [recentSales, setRecentSales] = useState<Sale[]>(initialRecent)
  const [pendingSales, setPendingSales] = useState<Sale[]>(initialPending)

  // Panel state
  const [openSaleId, setOpenSaleId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'status'>('view')
  const [panelItems, setPanelItems] = useState<SaleItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Edit state
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Status change state
  const [notifyClient, setNotifyClient] = useState(true)
  const [changingStatus, setChangingStatus] = useState(false)

  const allSales = useMemo(() => {
    const ids = new Set(recentSales.map(s => s.id))
    const extra = pendingSales.filter(s => !ids.has(s.id))
    return [...recentSales, ...extra]
  }, [recentSales, pendingSales])

  const openSale = useMemo(() => allSales.find(s => s.id === openSaleId) ?? null, [allSales, openSaleId])

  // KPIs
  const completedSales = useMemo(() => recentSales.filter(s => SALE_COMPLETED_SET.has(s.status)), [recentSales])
  const totalRevenue = completedSales.reduce((s, x) => s + (x.total ?? 0), 0)
  const avgTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0
  const todayStr = new Date().toDateString()
  // Count = ALL non-cancelled today (matches home dashboard and list view)
  const allTodaySales = useMemo(() =>
    recentSales.filter(s => s.status !== 'cancelled' && new Date(s.created_at).toDateString() === todayStr),
    [recentSales, todayStr])
  // Revenue = completed/invoiced only
  const todaySales = completedSales.filter(s => new Date(s.created_at).toDateString() === todayStr)
  const todayRevenue = todaySales.reduce((s, x) => s + (x.total ?? 0), 0)
  const todayPending = allTodaySales.filter(s => s.status === 'pending')
  // Pending (separate indicator — all time in window)
  const pendingSalesKPI = useMemo(() => allSales.filter(s => s.status === 'pending'), [allSales])
  const pendingRevenue = pendingSalesKPI.reduce((s, x) => s + (x.total ?? 0), 0)

  // ── Open panel ─────────────────────────────────────────────────────────────
  async function openPanel(saleId: string, mode: 'view' | 'edit' | 'status' = 'view') {
    setOpenSaleId(saleId)
    setPanelMode(mode)
    setLoadingItems(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('sale_items')
      .select('product_name, product_sku, qty, unit_price, line_total')
      .eq('sale_id', saleId)

    setPanelItems(data ?? [])
    if (mode === 'edit') {
      const sale = allSales.find(s => s.id === saleId)
      setEditNotes(sale?.notes ?? '')
    }
    setLoadingItems(false)
  }

  function closePanel() {
    setOpenSaleId(null)
    setPanelMode('view')
  }

  function switchMode(mode: 'view' | 'edit' | 'status') {
    setPanelMode(mode)
    if (mode === 'edit' && openSale) {
      setEditNotes(openSale.notes ?? '')
    }
  }

  // ── Save notes ─────────────────────────────────────────────────────────────
  async function saveNotes() {
    if (!openSale) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('sales').update({ notes: editNotes || null }).eq('id', openSale.id)
    updateLocalSale(openSale.id, { notes: editNotes || null })
    setSaving(false)
    setPanelMode('view')
  }

  // ── Change status ──────────────────────────────────────────────────────────
  async function changeStatus(newStatus: string) {
    if (!openSale) return
    setChangingStatus(true)
    try {
      if (notifyClient) {
        await fetch('/api/admin/sales/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: openSale.id, newStatus }),
        })
        // notify API also updates status in DB
      } else {
        const supabase = createClient()
        await supabase.from('sales').update({ status: newStatus }).eq('id', openSale.id)
      }
      updateLocalSale(openSale.id, { status: newStatus })
    } finally {
      setChangingStatus(false)
    }
  }

  function updateLocalSale(id: string, patch: Partial<Sale>) {
    setRecentSales(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s))
    setPendingSales(ss => ss.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* ── LEFT: main content ── */}
      <div className={`flex-1 min-w-0 ${openSaleId ? 'hidden lg:block' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-500 text-sm mt-1">Últimos 30 días</p>
          </div>
          <Link
            href="/admin/ventas/nueva-venta"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ShoppingCart size={15} /> Nueva venta
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Ingresos (30d)', value: fmt(totalRevenue), icon: DollarSign, color: 'bg-emerald-100 text-emerald-700', sub: `${completedSales.length} ventas facturadas` },
            { label: 'Hoy', value: String(allTodaySales.length), icon: TrendingUp, color: 'bg-blue-100 text-blue-700', sub: allTodaySales.length === 0 ? 'sin ventas hoy' : `${fmt(todayRevenue)} facturado${todayPending.length > 0 ? ` · ${todayPending.length} pendiente${todayPending.length > 1 ? 's' : ''}` : ''}` },
            { label: 'Ticket promedio', value: fmt(avgTicket), icon: ShoppingCart, color: 'bg-indigo-100 text-indigo-700', sub: 'últimos 30 días' },
            { label: 'Ventas totales', value: String(completedSales.length), icon: CheckCircle, color: 'bg-purple-100 text-purple-700', sub: 'últimos 30 días' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={13} />
                </div>
                <p className="text-xs font-semibold text-gray-500">{label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        {/* Pending revenue indicator */}
        {pendingSalesKPI.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={13} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-800">
                {pendingSalesKPI.length} venta{pendingSalesKPI.length > 1 ? 's' : ''} pendiente{pendingSalesKPI.length > 1 ? 's' : ''} — {fmt(pendingRevenue)} por confirmar
              </p>
              <p className="text-[11px] text-amber-600">Estas ventas no están incluidas en los ingresos hasta ser facturadas</p>
            </div>
          </div>
        )}

        {/* Pending sales */}
        {pendingSales.length > 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200 bg-amber-100">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <p className="font-semibold text-amber-800 text-sm">
                {pendingSales.length === 1 ? '1 venta por revisar' : `${pendingSales.length} ventas por revisar`}
              </p>
              <span className="ml-1 text-xs text-amber-600">— Generadas desde cotizaciones aceptadas</span>
            </div>
            <div className="divide-y divide-amber-100">
              {pendingSales.map(sale => (
                <div
                  key={sale.id}
                  className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-amber-100/50 transition-colors ${openSaleId === sale.id ? 'bg-amber-100 border-l-4 border-amber-500' : ''}`}
                  onClick={() => openPanel(sale.id, 'view')}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-200 text-amber-700">
                    <Clock size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sale.customers?.name ?? 'Cliente sin registrar'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {sale.notes?.split('\n')[0] ?? ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(sale.total ?? 0)}</p>
                    <p className="text-[10px] text-gray-400">{fmtDate(sale.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick access */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/admin/ventas/inventario', icon: Package, label: 'Inventario', desc: 'Gestiona productos y stock', color: 'bg-amber-50 border-amber-200 hover:border-amber-300', iconColor: 'bg-amber-100 text-amber-700' },
            { href: '/admin/ventas/cotizaciones', icon: FileCheck, label: 'Cotizaciones', desc: 'Crea y da seguimiento', color: 'bg-blue-50 border-blue-200 hover:border-blue-300', iconColor: 'bg-blue-100 text-blue-700' },
            { href: '/admin/ventas/nueva-venta', icon: ShoppingCart, label: 'Nueva venta', desc: 'Registrar venta directa', color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300', iconColor: 'bg-emerald-100 text-emerald-700' },
          ].map(({ href, icon: Icon, label, desc, color, iconColor }) => (
            <Link key={href} href={href} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${color}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Recent sales list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ventas recientes</h2>
            <Link href="/admin/reportes/ventas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver reporte completo <ArrowRight size={11} />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-14 text-center">
              <ShoppingCart size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">Aún no hay ventas registradas</p>
              <p className="text-xs text-gray-400 mt-1">Crea tu primera venta desde el botón de arriba</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentSales.slice(0, 20).map(sale => {
                const s = STATUS_MAP[sale.status] ?? STATUS_MAP.pending
                const isOpen = openSaleId === sale.id
                return (
                  <div
                    key={sale.id}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => openPanel(sale.id, 'view')}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sale.customers?.name ?? 'Cliente sin registrar'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                        {sale.establishment_id && (
                          <span className="text-[10px] text-gray-400">{estMap[sale.establishment_id]}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{fmt(sale.total ?? 0)}</p>
                      <p className="text-[10px] text-gray-400">{fmtDate(sale.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Detail panel ── */}
      {openSaleId && openSale && (
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="font-mono text-xs text-gray-400 mb-0.5"># VTA-{openSale.id.slice(-6).toUpperCase()}</p>
                <p className="font-bold text-gray-900">{openSale.customers?.name ?? 'Sin cliente'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Mode tabs */}
                <button
                  onClick={() => switchMode('view')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'view' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Ver detalle"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => switchMode('edit')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Editar"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => switchMode('status')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'status' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Cambiar estado"
                >
                  <Truck size={15} />
                </button>
                <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 ml-1">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>

              {/* ── VIEW MODE ── */}
              {panelMode === 'view' && (
                <div className="p-5 space-y-4">
                  {/* Status + date */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {(() => { const s = STATUS_MAP[openSale.status] ?? STATUS_MAP.pending; return (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    )})()}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} /> {fmtDateFull(openSale.created_at)}
                    </span>
                  </div>

                  {/* Customer info */}
                  {openSale.customers && (
                    <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <User size={13} className="text-gray-400" /> {openSale.customers.name}
                      </div>
                      {openSale.customers.email && (
                        <p className="text-gray-500 text-xs">{openSale.customers.email}</p>
                      )}
                    </div>
                  )}

                  {/* Establishment */}
                  {openSale.establishment_id && estMap[openSale.establishment_id] && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 size={12} className="text-gray-400" /> {estMap[openSale.establishment_id]}
                    </div>
                  )}

                  {/* Items */}
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Productos / Servicios</p>
                      {panelItems.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-xs text-gray-400">
                              <th className="pb-1.5 text-left font-semibold">Item</th>
                              <th className="pb-1.5 text-center font-semibold">Cant.</th>
                              <th className="pb-1.5 text-right font-semibold">P. Unit.</th>
                              <th className="pb-1.5 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {panelItems.map((it, i) => (
                              <tr key={i}>
                                <td className="py-2 font-medium text-gray-900 text-xs">
                                  {it.product_name}
                                  {it.product_sku && <span className="text-gray-400 ml-1">({it.product_sku})</span>}
                                </td>
                                <td className="py-2 text-center text-gray-500 text-xs">{it.qty}</td>
                                <td className="py-2 text-right text-gray-500 text-xs">{fmt(it.unit_price)}</td>
                                <td className="py-2 text-right font-semibold text-xs">{fmt(it.line_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin ítems registrados</p>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-gray-100 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span><span>{fmt(openSale.subtotal ?? openSale.total)}</span>
                    </div>
                    {(openSale.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descuento</span><span>−{fmt(openSale.discount!)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Total</span><span>{fmt(openSale.total)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {openSale.notes && (
                    <div className="p-3 bg-amber-50 rounded-xl border-l-4 border-amber-300">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Notas</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{openSale.notes}</p>
                    </div>
                  )}


                  {/* Quick status change */}
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => switchMode('status')}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 border border-indigo-200"
                    >
                      <Truck size={14} /> Actualizar estado
                    </button>
                  </div>
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {panelMode === 'edit' && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Edit3 size={14} /> Editando venta
                  </p>
                  <p className="text-xs text-gray-400">Solo se puede editar las notas. Para modificar ítems, crea una nueva venta.</p>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Notas</label>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      rows={5}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                      placeholder="Observaciones, condiciones especiales..."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPanelMode('view')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveNotes}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                      {saving ? 'Guardando…' : 'Guardar notas'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STATUS MODE ── */}
              {panelMode === 'status' && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Truck size={14} /> Estado del pedido
                  </p>

                  {/* Flow steps */}
                  {(() => {
                    const flow = getFlow(openSale.fulfillment_type)
                    const currentIdx = flow.indexOf(openSale.status)
                    return (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                          Flujo {openSale.fulfillment_type === 'physical' ? 'físico' : 'de servicio'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {flow.map((step, idx) => {
                            const s = STATUS_MAP[step] ?? STATUS_MAP.pending
                            const isCurrent = openSale.status === step
                            const isPast = currentIdx > idx
                            return (
                              <button
                                key={step}
                                onClick={() => changeStatus(step)}
                                disabled={changingStatus || isCurrent}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:cursor-not-allowed
                                  ${isCurrent ? `${s.color} ring-2 ring-offset-1 ring-current` : isPast ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : `bg-white border-2 border-gray-200 text-gray-500 hover:${s.color}`}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${isCurrent || isPast ? s.dot : 'bg-gray-300'}`} />
                                {s.label}
                                {isCurrent && <span className="ml-0.5 text-[9px]">✓</span>}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Notify checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyClient}
                      onChange={e => setNotifyClient(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Notificar al cliente por email</span>
                  </label>

                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    {openSale.status !== 'completado' && openSale.status !== 'completed' && openSale.status !== 'entregado' && (
                      <button
                        onClick={() => changeStatus(openSale.fulfillment_type === 'physical' ? 'entregado' : 'completado')}
                        disabled={changingStatus}
                        className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-40"
                      >
                        {changingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Marcar como completado
                      </button>
                    )}
                    {openSale.status !== 'cancelled' && (
                      <button
                        onClick={() => changeStatus('cancelled')}
                        disabled={changingStatus}
                        className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-100 border border-red-200 disabled:opacity-40"
                      >
                        {changingStatus ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Marcar como cancelado
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
