'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, ShoppingCart, Package, FileCheck,
  Sparkles, Bell, ChevronRight, MessageSquare,
  CheckCircle, ArrowRight, Clock, CalendarClock,
} from 'lucide-react'
import { SALE_COMPLETED_SET } from '@/lib/saleStatus'

interface Sale { id: string; total: number; status: string; created_at: string }

interface Props {
  brandName: string
  businessType: string
  primaryColor: string
  userName: string
  /** Sales from last 48 h, all non-cancelled */
  salesRecent: Sale[]
  /** Sales from last 7 days, all non-cancelled */
  salesWeek: Sale[]
  totalClients: number
  inactiveClients: { id: string; name: string; phone: string | null; updated_at: string }[]
  openQuotes: { id: string; total: number; created_at: string; customers: any }[]
  lowStock: { id: string; name: string; stock: number }[]
  hasAppointments?: boolean
  appointments?: { id: string; status: string; scheduled_at: string; customer_name: string }[]
}

const VOCAB: Record<string, { service: string; client: string; clients: string }> = {
  belleza:     { service: 'servicio', client: 'clienta', clients: 'clientas' },
  restaurante: { service: 'venta',   client: 'cliente',  clients: 'clientes' },
  ferreteria:  { service: 'venta',   client: 'cliente',  clients: 'clientes' },
  tienda:      { service: 'venta',   client: 'cliente',  clients: 'clientes' },
  servicios:   { service: 'servicio', client: 'cliente', clients: 'clientes' },
  otros:       { service: 'venta',   client: 'cliente',  clients: 'clientes' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

const APPT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',   color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmada',  color: 'bg-blue-100 text-blue-700'   },
  attended:  { label: 'Atendida',    color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada',   color: 'bg-gray-100 text-gray-500'   },
  no_show:   { label: 'No asistió',  color: 'bg-red-100 text-red-600'     },
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((new Date(d.toDateString()).getTime() - today.getTime()) / 86400000)
  if (diff === 0) return null
  if (diff === 1) return 'mañana'
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' })
}

export function HomePanel({
  brandName, businessType, userName,
  salesRecent, salesWeek, totalClients,
  inactiveClients, openQuotes, lowStock,
  hasAppointments, appointments = [],
}: Props) {
  const v = VOCAB[businessType] || VOCAB.otros
  const firstName = userName.split(' ')[0]
  const [dismissed, setDismissed] = useState<string[]>([])

  // ── "Hoy" filtered in browser timezone — same logic as VentasDashboard ──
  const todayStr = new Date().toDateString()

  const todaySales = useMemo(() =>
    salesRecent.filter(s => new Date(s.created_at).toDateString() === todayStr),
    [salesRecent, todayStr])

  // Count = ALL non-cancelled today (matches what user sees in the sales list)
  const countToday = todaySales.length

  // Revenue = only committed/invoiced (facturado+)
  const completedToday = todaySales.filter(s => SALE_COMPLETED_SET.has(s.status))
  const pendingToday   = todaySales.filter(s => s.status === 'pending')
  const revenueToday   = completedToday.reduce((s, x) => s + (x.total ?? 0), 0)
  const pendingRevenue = pendingToday.reduce((s, x) => s + (x.total ?? 0), 0)

  // Week revenue (completed only)
  const revenueWeek = useMemo(() =>
    salesWeek
      .filter(s => SALE_COMPLETED_SET.has(s.status))
      .reduce((s, x) => s + (x.total ?? 0), 0),
    [salesWeek])

  // ── Action cards ────────────────────────────────────────────────────────────
  const actions: { key: string; icon: React.ElementType; color: string; text: string; sub: string; href: string }[] = []

  if (inactiveClients.length > 0) {
    const first = inactiveClients[0]
    actions.push({
      key: 'inactive',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
      text: `${inactiveClients.length} ${inactiveClients.length > 1 ? v.clients : v.client} ${inactiveClients.length > 1 ? 'pueden' : 'puede'} volver a comprarte`,
      sub: `${first.name} lleva ${daysAgo(first.updated_at)} días sin volver`,
      href: '/admin/clientes',
    })
  }

  if (openQuotes.length > 0) {
    actions.push({
      key: 'quotes',
      icon: FileCheck,
      color: 'bg-amber-50 text-amber-700',
      text: `${openQuotes.length} cotización${openQuotes.length > 1 ? 'es' : ''} sin respuesta`,
      sub: `Lleva${openQuotes.length > 1 ? 'n' : ''} más de 2 días esperando`,
      href: '/admin/ventas/cotizaciones',
    })
  }

  if (lowStock.length > 0) {
    actions.push({
      key: 'stock',
      icon: Package,
      color: 'bg-red-50 text-red-700',
      text: `${lowStock.length} producto${lowStock.length > 1 ? 's' : ''} con poco inventario`,
      sub: `${lowStock[0].name}: quedan ${lowStock[0].stock} unidades`,
      href: '/admin/ventas/inventario',
    })
  }

  const visibleActions = actions.filter(a => !dismissed.includes(a.key))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">{greeting()}, <strong className="text-gray-600">{firstName}</strong></p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">Hoy en {brandName}</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas hoy — TOTAL count (todos los estados no-cancelados) */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Ventas hoy</p>
            <TrendingUp size={14} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{countToday}</p>
          <p className="text-xs text-gray-400 mt-1">
            {completedToday.length > 0 && `${fmt(revenueToday)} facturado`}
            {completedToday.length > 0 && pendingToday.length > 0 && ' · '}
            {pendingToday.length > 0 && (
              <span className="text-amber-500">{pendingToday.length} pendiente{pendingToday.length > 1 ? 's' : ''}</span>
            )}
            {countToday === 0 && 'sin ventas hoy'}
          </p>
        </div>

        {/* Esta semana */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Esta semana</p>
            <TrendingUp size={14} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{fmt(revenueWeek)}</p>
          <p className="text-xs text-gray-400 mt-1">últimos 7 días · facturadas</p>
        </div>

        {/* Tus clientes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Tus {v.clients}</p>
            <Users size={14} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">en tu base</p>
        </div>

        {/* Por recuperar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 font-medium">Por recuperar</p>
            <MessageSquare size={14} className="text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-500">{inactiveClients.length}</p>
          <p className="text-xs text-gray-400 mt-1">{v.clients} inactivos</p>
        </div>
      </div>

      {/* Appointments widget */}
      {hasAppointments && (() => {
        const now = new Date()
        const todayStr2 = now.toDateString()
        const todayPending   = appointments.filter(a => new Date(a.scheduled_at).toDateString() === todayStr2 && a.status === 'pending').length
        const todayConfirmed = appointments.filter(a => new Date(a.scheduled_at).toDateString() === todayStr2 && a.status === 'confirmed').length
        const weekActive     = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length
        const upcoming       = appointments.filter(a => new Date(a.scheduled_at) >= now).slice(0, 4)
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-indigo-500" />
                <p className="text-sm font-semibold text-gray-800">Citas programadas</p>
              </div>
              <Link href="/admin/appointments" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Ver todas →</Link>
            </div>

            {/* KPI chips */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[90px] bg-amber-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-amber-700">{todayPending}</p>
                <p className="text-[10px] text-amber-600 font-medium leading-tight">Pendientes hoy</p>
              </div>
              <div className="flex-1 min-w-[90px] bg-blue-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-blue-700">{todayConfirmed}</p>
                <p className="text-[10px] text-blue-600 font-medium leading-tight">Confirmadas hoy</p>
              </div>
              <div className="flex-1 min-w-[90px] bg-indigo-50 rounded-lg px-3 py-2 text-center">
                <p className="text-lg font-black text-indigo-700">{weekActive}</p>
                <p className="text-[10px] text-indigo-600 font-medium leading-tight">Esta semana</p>
              </div>
            </div>

            {/* Upcoming list */}
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map(appt => {
                  const statusCfg = APPT_STATUS[appt.status] ?? APPT_STATUS.pending
                  const label = dayLabel(appt.scheduled_at)
                  return (
                    <div key={appt.id} className="flex items-center gap-3 py-1">
                      <div className="text-center shrink-0 w-12">
                        <p className="text-sm font-bold text-gray-800 leading-none">{fmtTime(appt.scheduled_at)}</p>
                        {label && <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>}
                      </div>
                      <p className="flex-1 text-sm text-gray-700 truncate">{appt.customer_name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">Sin citas próximas</p>
            )}
          </div>
        )
      })()}

      {/* Fila principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Acciones + IA */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones para hoy</p>
          </div>

          {visibleActions.length > 0 ? (
            <div className="space-y-3">
              {visibleActions.map(action => {
                const Icon = action.icon
                return (
                  <div key={action.key} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{action.text}</p>
                      <p className="text-xs text-gray-400 truncate">{action.sub}</p>
                    </div>
                    <Link href={action.href} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0">
                      Ver <ChevronRight size={12} />
                    </Link>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">¡Todo al día!</p>
                <p className="text-sm text-emerald-600">Sin pendientes urgentes por ahora.</p>
              </div>
            </div>
          )}

          {/* IA sugerida */}
          {inactiveClients.length > 0 && (
            <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={15} className="text-indigo-600" />
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Sugerencia IA</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {inactiveClients[0].name} lleva {daysAgo(inactiveClients[0].updated_at)} días sin volver
              </p>
              <p className="text-sm text-gray-600 mb-3">¿Generamos un mensaje para WhatsApp?</p>
              <Link
                href={`/admin/clientes?action=message&clientId=${inactiveClients[0].id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <MessageSquare size={13} /> Generar mensaje
              </Link>
            </div>
          )}
        </div>

        {/* Accesos rápidos */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Nueva venta',      icon: ShoppingCart, href: '/admin/ventas/nueva-venta',              color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Agregar cliente',  icon: Users,        href: '/admin/clientes',                        color: 'text-indigo-600 bg-indigo-50'  },
              { label: 'Nueva cotización', icon: FileCheck,    href: '/admin/ventas/nueva-venta?type=quote',   color: 'text-amber-600 bg-amber-50'    },
              { label: 'Ver inventario',   icon: Package,      href: '/admin/ventas/inventario',               color: 'text-blue-600 bg-blue-50'      },
            ].map(item => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
