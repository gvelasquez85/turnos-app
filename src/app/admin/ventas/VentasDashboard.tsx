'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { SALE_COMPLETED_SET } from '@/lib/saleStatus'
import { useCopilotContext } from '@/components/ai/useCopilotContext'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingCart, TrendingUp, FileCheck,
  ArrowRight, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
  Eye, Edit3, Truck, X, Loader2,
  User, Building2, Calendar, Package, MessageCircle, Mail,
  Receipt, BookOpen,
} from 'lucide-react'
import { buildWaMessage, WA_TEMPLATE_BY_CATEGORY } from '@/lib/waTemplates'

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
  customers: { name: string; email?: string | null; phone?: string | null } | null
  fulfillment_type?: string | null
  source_quote_id?: string | null
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

interface WaTemplateRow { category: string; body: string }

interface Props {
  brandId: string
  recentSales: Sale[]
  pendingSales: Sale[]
  establishments: Establishment[]
  waTemplates?: WaTemplateRow[]
  brandName?: string
}

// ─── Status config ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending:         { label: 'Pendiente',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',     dot: 'bg-amber-400' },
  confirmada:      { label: 'Confirmada',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',         dot: 'bg-blue-500' },
  en_alistamiento: { label: 'En alistamiento', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', dot: 'bg-indigo-500' },
  despachada:      { label: 'Despachada',      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300', dot: 'bg-violet-500' },
  entregada:       { label: 'Entregada',       color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',     dot: 'bg-green-500' },
  // Legacy statuses (backwards compat)
  facturado:       { label: 'Confirmada',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',         dot: 'bg-blue-500' },
  despachado:      { label: 'Despachada',      color: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300', dot: 'bg-violet-500' },
  entregado:       { label: 'Entregada',       color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',     dot: 'bg-green-500' },
  completado:      { label: 'Entregada',       color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',     dot: 'bg-green-500' },
  completed:       { label: 'Entregada',       color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',     dot: 'bg-green-500' },
  cancelled:       { label: 'Cancelada',       color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',             dot: 'bg-red-400' },
}

// Status flows
// From quote: pendiente → confirmada → alistamiento → despachada → entregada
const QUOTE_FLOW = ['pending', 'confirmada', 'en_alistamiento', 'despachada', 'entregada']
// Manual sale: confirmada → alistamiento → despachada → entregada (starts confirmed)
const MANUAL_FLOW = ['confirmada', 'en_alistamiento', 'despachada', 'entregada']

function getFlow(sale: Sale) {
  // Manual sales (no source quote) skip "pendiente"
  if (!sale.source_quote_id) return MANUAL_FLOW
  return QUOTE_FLOW
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

export function VentasDashboard({ brandId, recentSales: initialRecent, pendingSales: initialPending, establishments, waTemplates = [], brandName = 'Tu negocio' }: Props) {
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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Module integration state (facturación / contabilidad)
  const [hasFacturacion, setHasFacturacion] = useState(false)
  const [hasContabilidad, setHasContabilidad] = useState(false)
  const [invoiceStatus, setInvoiceStatus] = useState<'none' | 'generating' | 'done' | 'error'>('none')
  const [invoiceResult, setInvoiceResult] = useState<{ number?: string; error?: string } | null>(null)
  const [accountingStatus, setAccountingStatus] = useState<'none' | 'generating' | 'done' | 'exists' | 'error'>('none')

  // Check active modules once on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.from('module_subscriptions')
      .select('module_key, status')
      .eq('brand_id', brandId)
      .in('module_key', ['facturacion', 'contabilidad'])
      .in('status', ['active', 'trial'])
      .then(({ data }) => {
        if (data) {
          setHasFacturacion(data.some(d => d.module_key === 'facturacion'))
          setHasContabilidad(data.some(d => d.module_key === 'contabilidad'))
        }
      })
  }, [brandId])

  async function sendConfirmationEmail(sale: Sale) {
    setSendingEmail(true)
    setEmailResult(null)
    try {
      const res = await fetch('/api/admin/sales/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: sale.id }),
      })
      const body = await res.json()
      if (res.ok && body.ok) {
        setEmailResult({ ok: true, msg: body.msg === 'Sin email de cliente' ? '⚠️ El cliente no tiene email registrado' : '✓ Confirmación enviada por email' })
      } else {
        setEmailResult({ ok: false, msg: body.error || body.msg || 'Error al enviar' })
      }
    } catch (e: any) {
      setEmailResult({ ok: false, msg: e.message || 'Error de red' })
    }
    setSendingEmail(false)
  }

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

  // ── Copilot context ──────────────────────────────────────────────────────
  useCopilotContext({
    moduleKey: 'ventas',
    moduleLabel: 'Ventas',
    data: {
      ventas_hoy: todaySales.length,
      ingresos_hoy: todayRevenue,
      pendientes_cobro: pendingRevenue,
      ventas_pendientes: pendingSalesKPI.length,
      ticket_promedio: todaySales.length ? Math.round(todayRevenue / todaySales.length) : 0,
      top_productos: Object.values(
        todaySales.flatMap((s: any) => s.items ?? []).reduce((acc: any, item: any) => {
          const k = item.product_name ?? item.name ?? 'Producto'
          acc[k] = acc[k] ?? { nombre: k, cantidad: 0 }
          acc[k].cantidad += item.quantity ?? 1
          return acc
        }, {})
      ).sort((a: any, b: any) => b.cantidad - a.cantidad).slice(0, 5),
    },
  })

  // ── WA helpers ────────────────────────────────────────────────────────────
  const waTemplateMap = useMemo(() => Object.fromEntries(waTemplates.map(t => [t.category, t.body])), [waTemplates])

  function openSaleWa(sale: Sale, category: 'sale_receipt' | 'sale_pending_payment') {
    const phone = sale.customers?.phone
    if (!phone) return
    const fecha = new Date(sale.created_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
    const referencia = `VTA-${sale.id.slice(-6).toUpperCase()}`
    const total = fmt(sale.total)
    const vencimiento = new Date(Date.now() + 3 * 86400000).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
    const vars: Record<string, string> = {
      nombre: sale.customers?.name ?? '',
      negocio: brandName,
      total,
      referencia,
      fecha,
      vencimiento,
    }
    const body = waTemplateMap[category] ?? WA_TEMPLATE_BY_CATEGORY[category]?.defaultBody ?? ''
    const url = buildWaMessage(body, vars, phone)
    window.open(url, '_blank')
  }

  // ── Open panel ─────────────────────────────────────────────────────────────
  async function openPanel(saleId: string, mode: 'view' | 'edit' | 'status' = 'view') {
    setOpenSaleId(saleId)
    setPanelMode(mode)
    setLoadingItems(true)
    setInvoiceStatus('none')
    setInvoiceResult(null)
    setAccountingStatus('none')

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
      // Trigger auto accounting entry if moving to terminal status
      const terminalStatuses = ['entregada', 'entregado', 'completado', 'completed']
      if (terminalStatuses.includes(newStatus) && hasContabilidad && openSale.type === 'sale') {
        triggerAutoEntry(openSale.id)
      }
      // Log status change to customer_history
      if (openSale.customer_id) {
        const supabaseForHistory = createClient()
        await supabaseForHistory.from('customer_history').insert({
          customer_id: openSale.customer_id,
          tipo: 'venta',
          detalles: `Venta #${openSale.id.slice(-6).toUpperCase()} cambió a estado: ${STATUS_MAP[newStatus]?.label ?? newStatus}`,
          monto: openSale.total,
          fecha: new Date().toISOString(),
        })
      }
    } finally {
      setChangingStatus(false)
    }
  }

  async function generateInvoice(saleId: string) {
    setInvoiceStatus('generating')
    setInvoiceResult(null)
    try {
      const res = await fetch('/api/invoicing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, brandId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setInvoiceStatus('done')
        setInvoiceResult({ number: data.number })
      } else {
        setInvoiceStatus('error')
        setInvoiceResult({ error: data.error || 'Error generando factura' })
      }
    } catch (e: any) {
      setInvoiceStatus('error')
      setInvoiceResult({ error: e.message || 'Error de conexión' })
    }
  }

  async function triggerAutoEntry(saleId: string) {
    setAccountingStatus('generating')
    try {
      const res = await fetch('/api/accounting/auto-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId, brandId }),
      })
      const data = await res.json()
      if (data.ok) {
        setAccountingStatus(data.reason === 'already_exists' ? 'exists' : 'done')
      } else {
        setAccountingStatus(data.reason === 'auto_entries_on_sale disabled' ? 'none' : 'error')
      }
    } catch {
      setAccountingStatus('error')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ventas</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Últimos 30 días</p>
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
            <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon size={13} />
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
        {/* Pending revenue indicator */}
        {pendingSalesKPI.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
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
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-200 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              <p className="font-semibold text-amber-800 text-sm">
                {pendingSales.length === 1 ? '1 venta por revisar' : `${pendingSales.length} ventas por revisar`}
              </p>
              <span className="ml-1 text-xs text-amber-600">— Generadas desde cotizaciones aceptadas</span>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-800">
              {pendingSales.map(sale => (
                <div
                  key={sale.id}
                  className={`flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-800/30 transition-colors ${openSaleId === sale.id ? 'bg-amber-100 dark:bg-amber-800/50 border-l-4 border-amber-500' : ''}`}
                  onClick={() => openPanel(sale.id, 'view')}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-200 text-amber-700">
                    <Clock size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {sale.customers?.name ?? 'Cliente sin registrar'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {sale.notes?.split('\n')[0] ?? ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(sale.total ?? 0)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(sale.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick access */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { href: '/admin/ventas/inventario', icon: Package, label: 'Inventario', desc: 'Gestiona productos y stock', color: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600', iconColor: 'bg-amber-100 text-amber-700' },
            { href: '/admin/ventas/cotizaciones', icon: FileCheck, label: 'Cotizaciones', desc: 'Crea y da seguimiento', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600', iconColor: 'bg-blue-100 text-blue-700' },
            { href: '/admin/ventas/nueva-venta', icon: ShoppingCart, label: 'Nueva venta', desc: 'Registrar venta directa', color: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600', iconColor: 'bg-emerald-100 text-emerald-700' },
          ].map(({ href, icon: Icon, label, desc, color, iconColor }) => (
            <Link key={href} href={href} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${color}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-gray-400 dark:text-gray-500" />
            </Link>
          ))}
        </div>

        {/* Recent sales list */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Ventas recientes</h2>
            <Link href="/admin/reportes/ventas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Ver reporte completo <ArrowRight size={11} />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-14 text-center">
              <ShoppingCart size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aún no hay ventas registradas</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Crea tu primera venta desde el botón de arriba</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {recentSales.slice(0, 20).map(sale => {
                const s = STATUS_MAP[sale.status] ?? STATUS_MAP.pending
                const isOpen = openSaleId === sale.id
                return (
                  <div
                    key={sale.id}
                    className={`flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''}`}
                    onClick={() => openPanel(sale.id, 'view')}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {sale.customers?.name ?? 'Cliente sin registrar'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                        {sale.establishment_id && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{estMap[sale.establishment_id]}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(sale.total ?? 0)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(sale.created_at)}</p>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <div>
                <p className="font-mono text-xs text-gray-400 dark:text-gray-500 mb-0.5"># VTA-{openSale.id.slice(-6).toUpperCase()}</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{openSale.customers?.name ?? 'Sin cliente'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Mode tabs */}
                <button
                  onClick={() => switchMode('view')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'view' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Ver detalle"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => switchMode('edit')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Editar"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => switchMode('status')}
                  className={`p-1.5 rounded-lg transition-colors ${panelMode === 'status' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Cambiar estado"
                >
                  <Truck size={15} />
                </button>
                <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ml-1">
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
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar size={11} /> {fmtDateFull(openSale.created_at)}
                    </span>
                  </div>

                  {/* Customer info */}
                  {openSale.customers && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                        <User size={13} className="text-gray-400 dark:text-gray-500" /> {openSale.customers.name}
                      </div>
                      {openSale.customers.email && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">{openSale.customers.email}</p>
                      )}
                    </div>
                  )}

                  {/* Establishment */}
                  {openSale.establishment_id && estMap[openSale.establishment_id] && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Building2 size={12} className="text-gray-400 dark:text-gray-500" /> {estMap[openSale.establishment_id]}
                    </div>
                  )}

                  {/* Items */}
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-gray-300 dark:text-gray-600" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Productos / Servicios</p>
                      {panelItems.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500">
                              <th className="pb-1.5 text-left font-semibold">Item</th>
                              <th className="pb-1.5 text-center font-semibold">Cant.</th>
                              <th className="pb-1.5 text-right font-semibold">P. Unit.</th>
                              <th className="pb-1.5 text-right font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {panelItems.map((it, i) => (
                              <tr key={i}>
                                <td className="py-2 font-medium text-gray-900 dark:text-gray-100 text-xs">
                                  {it.product_name}
                                  {it.product_sku && <span className="text-gray-400 dark:text-gray-500 ml-1">({it.product_sku})</span>}
                                </td>
                                <td className="py-2 text-center text-gray-500 dark:text-gray-400 text-xs">{it.qty}</td>
                                <td className="py-2 text-right text-gray-500 dark:text-gray-400 text-xs">{fmt(it.unit_price)}</td>
                                <td className="py-2 text-right font-semibold text-xs text-gray-900 dark:text-gray-100">{fmt(it.line_total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin ítems registrados</p>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Subtotal</span><span>{fmt(openSale.subtotal ?? openSale.total)}</span>
                    </div>
                    {(openSale.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descuento</span><span>−{fmt(openSale.discount!)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                      <span>Total</span><span>{fmt(openSale.total)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {openSale.notes && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border-l-4 border-amber-300">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Notas</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{openSale.notes}</p>
                    </div>
                  )}


                  {/* Quick status change */}
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-2">
                    {/* Prominent confirm button for pending sales */}
                    {openSale.status === 'pending' && (
                      <button
                        onClick={() => changeStatus('confirmada')}
                        disabled={changingStatus}
                        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40"
                      >
                        {changingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Confirmar venta
                      </button>
                    )}
                    <button
                      onClick={() => switchMode('status')}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700"
                    >
                      <Truck size={14} /> Actualizar estado
                    </button>
                    <div className="flex flex-col gap-2">
                      {/* Email confirmation */}
                      <button
                        onClick={() => sendConfirmationEmail(openSale)}
                        disabled={sendingEmail}
                        className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700 disabled:opacity-40"
                      >
                        {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                        Enviar confirmación por email
                      </button>
                      {emailResult && (
                        <p className={`text-xs text-center ${emailResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {emailResult.msg}
                        </p>
                      )}
                      {/* WA buttons */}
                      {openSale.customers?.phone && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openSaleWa(openSale, 'sale_receipt')}
                            className="flex-1 py-2 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700"
                          >
                            <MessageCircle size={13} /> Comprobante WA
                          </button>
                          {openSale.status === 'pending' && (
                            <button
                              onClick={() => openSaleWa(openSale, 'sale_pending_payment')}
                              className="flex-1 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700"
                            >
                              <MessageCircle size={13} /> Cobro pendiente WA
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {panelMode === 'edit' && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Edit3 size={14} /> Editando venta
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Solo se puede editar las notas. Para modificar ítems, crea una nueva venta.</p>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Notas</label>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      rows={5}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Observaciones, condiciones especiales..."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPanelMode('view')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Truck size={14} /> Estado del pedido
                  </p>

                  {/* Flow steps */}
                  {(() => {
                    const flow = getFlow(openSale)
                    const currentIdx = flow.indexOf(openSale.status)
                    return (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                          {openSale.source_quote_id ? 'Desde cotización' : 'Venta directa'}
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
                                  ${isCurrent ? `${s.color} ring-2 ring-offset-1 ring-current` : isPast ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700' : `bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:${s.color}`}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${isCurrent || isPast ? s.dot : 'bg-gray-300 dark:bg-gray-600'}`} />
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
                      className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Notificar al cliente por email</span>
                  </label>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-2">
                    {/* Smart next-step button based on current status */}
                    {(() => {
                      const flow = getFlow(openSale)
                      const idx = flow.indexOf(openSale.status)
                      const isTerminal = openSale.status === 'entregada' || openSale.status === 'entregado' || openSale.status === 'completado' || openSale.status === 'completed'
                      if (isTerminal) return (
                        <div className="space-y-2">
                          {/* Facturación electrónica button */}
                          {hasFacturacion && openSale.type === 'sale' && (
                            <div>
                              {invoiceStatus === 'none' && (
                                <button
                                  onClick={() => generateInvoice(openSale.id)}
                                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700"
                                >
                                  <Receipt size={14} /> Generar factura electrónica
                                </button>
                              )}
                              {invoiceStatus === 'generating' && (
                                <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                                  <Loader2 size={14} className="animate-spin" /> Generando factura...
                                </div>
                              )}
                              {invoiceStatus === 'done' && invoiceResult?.number && (
                                <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle size={14} /> Factura {invoiceResult.number} generada
                                </div>
                              )}
                              {invoiceStatus === 'error' && (
                                <div className="space-y-1.5">
                                  <div className="w-full py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-xs px-3 border border-red-200 dark:border-red-800">
                                    {invoiceResult?.error}
                                  </div>
                                  <button
                                    onClick={() => generateInvoice(openSale.id)}
                                    className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700"
                                  >
                                    <Receipt size={14} /> Reintentar
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Auto-entry feedback */}
                          {hasContabilidad && accountingStatus === 'done' && (
                            <div className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800">
                              <BookOpen size={13} /> Asiento contable generado automáticamente
                            </div>
                          )}
                          {hasContabilidad && accountingStatus === 'exists' && (
                            <div className="w-full py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium flex items-center justify-center gap-2">
                              <BookOpen size={13} /> Asiento contable ya existe
                            </div>
                          )}
                        </div>
                      )

                      // Pending → Confirm
                      if (openSale.status === 'pending') {
                        return (
                          <button
                            onClick={() => changeStatus('confirmada')}
                            disabled={changingStatus}
                            className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-40"
                          >
                            {changingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Confirmar venta
                          </button>
                        )
                      }

                      // Next step in flow
                      const nextIdx = idx + 1
                      if (nextIdx < flow.length) {
                        const nextStatus = flow[nextIdx]
                        const nextLabel = STATUS_MAP[nextStatus]?.label ?? nextStatus
                        return (
                          <button
                            onClick={() => changeStatus(nextStatus)}
                            disabled={changingStatus}
                            className="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-40"
                          >
                            {changingStatus ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Pasar a: {nextLabel}
                          </button>
                        )
                      }
                      return null
                    })()}
                    {openSale.status !== 'cancelled' && (
                      <button
                        onClick={() => changeStatus('cancelled')}
                        disabled={changingStatus}
                        className="w-full py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700 disabled:opacity-40"
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
