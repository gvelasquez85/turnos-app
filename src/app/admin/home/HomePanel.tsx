'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, ShoppingCart, Package, FileCheck,
  ArrowRight, Sparkles, Bell, ChevronRight, MessageSquare,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react'

interface Props {
  brandName: string
  businessType: string
  primaryColor: string
  userName: string
  revenueToday: number
  revenueWeek: number
  countToday: number
  totalClients: number
  inactiveClients: { id: string; name: string; phone: string | null; updated_at: string }[]
  openQuotes: { id: string; total: number; created_at: string; customers: any }[]
  lowStock: { id: string; name: string; stock: number }[]
}

const VOCAB: Record<string, { service: string; client: string; agenda: string }> = {
  belleza:     { service: 'servicio', client: 'clienta', agenda: 'cita' },
  restaurante: { service: 'plato', client: 'cliente', agenda: 'pedido' },
  ferreteria:  { service: 'trabajo', client: 'cliente', agenda: 'orden' },
  tienda:      { service: 'venta', client: 'cliente', agenda: 'venta' },
  servicios:   { service: 'servicio', client: 'cliente', agenda: 'cita' },
  otros:       { service: 'venta', client: 'cliente', agenda: 'pedido' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function daysAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomePanel({
  brandName, businessType, primaryColor, userName,
  revenueToday, revenueWeek, countToday, totalClients,
  inactiveClients, openQuotes, lowStock,
}: Props) {
  const v = VOCAB[businessType] || VOCAB.otros
  const firstName = userName.split(' ')[0]
  const [dismissed, setDismissed] = useState<string[]>([])

  const actions: { key: string; icon: React.ElementType; color: string; text: string; sub: string; href: string }[] = []

  if (inactiveClients.length > 0) {
    const first = inactiveClients[0]
    const days = daysAgo(first.updated_at)
    actions.push({
      key: 'inactive',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-700',
      text: `${inactiveClients.length} ${v.client}${inactiveClients.length > 1 ? 's' : ''} ${inactiveClients.length > 1 ? 'pueden' : 'puede'} volver a comprarte`,
      sub: `${first.name} lleva ${days} días sin volver`,
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
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">{greeting()}, <strong className="text-gray-600">{firstName}</strong></p>
        <h1 className="text-2xl font-black text-gray-900 mt-0.5">Hoy en {brandName}</h1>
      </div>

      {/* KPIs del día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Ventas hoy</p>
          <p className="text-xl font-black text-gray-900">{fmt(revenueToday)}</p>
          <p className="text-xs text-gray-400 mt-1">{countToday} {countToday === 1 ? 'registro' : 'registros'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Esta semana</p>
          <p className="text-xl font-black text-gray-900">{fmt(revenueWeek)}</p>
          <p className="text-xs text-gray-400 mt-1">últimos 7 días</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Tus clientes</p>
          <p className="text-xl font-black text-gray-900">{totalClients}</p>
          <p className="text-xs text-gray-400 mt-1">en tu base</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Por recuperar</p>
          <p className="text-xl font-black text-emerald-600">{inactiveClients.length}</p>
          <p className="text-xs text-gray-400 mt-1">{v.client}s inactivos</p>
        </div>
      </div>

      {/* Acciones sugeridas */}
      {visibleActions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-indigo-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones para hoy</p>
          </div>
          <div className="space-y-2">
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
                  <Link
                    href={action.href}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
                  >
                    Ver <ChevronRight size={12} />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {visibleActions.length === 0 && (
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

      {/* Accesos rápidos */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: `Nueva ${v.agenda}`, icon: ShoppingCart, href: '/admin/ventas/nueva-venta', color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Agregar cliente', icon: Users, href: '/admin/clientes', color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Nueva cotización', icon: FileCheck, href: '/admin/ventas/nueva-venta?type=quote', color: 'text-amber-600 bg-amber-50' },
            { label: 'Ver inventario', icon: Package, href: '/admin/ventas/inventario', color: 'text-blue-600 bg-blue-50' },
          ].map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col items-start gap-2 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon size={17} />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* IA: Mensaje sugerido */}
      {inactiveClients.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Sugerencia IA</p>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {inactiveClients[0].name} lleva {daysAgo(inactiveClients[0].updated_at)} días sin volver
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Es un buen momento para escribirle. ¿Quieres que generemos un mensaje para WhatsApp?
          </p>
          <Link
            href={`/admin/clientes?action=message&clientId=${inactiveClients[0].id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <MessageSquare size={13} />
            Generar mensaje
          </Link>
        </div>
      )}

    </div>
  )
}
