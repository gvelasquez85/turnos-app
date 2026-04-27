'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  ShoppingCart, TrendingUp, Package, FileCheck,
  ArrowRight, DollarSign, Clock, CheckCircle, XCircle,
} from 'lucide-react'

interface Sale {
  id: string
  type: string
  status: string
  total: number
  created_at: string
  establishment_id: string | null
  customer_id: string | null
  customers: { name: string } | null
}

interface Establishment { id: string; name: string }

interface Props {
  brandId: string
  recentSales: Sale[]
  establishments: Establishment[]
}

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

export function VentasDashboard({ recentSales, establishments }: Props) {
  const estMap = Object.fromEntries(establishments.map(e => [e.id, e.name]))

  const completedSales = recentSales.filter(s => s.status === 'completed')
  const totalRevenue = completedSales.reduce((s, x) => s + (x.total ?? 0), 0)
  const avgTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0

  // Today's sales
  const todayStr = new Date().toDateString()
  const todaySales = completedSales.filter(s => new Date(s.created_at).toDateString() === todayStr)
  const todayRevenue = todaySales.reduce((s, x) => s + (x.total ?? 0), 0)

  return (
    <div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Ingresos (30d)', value: fmt(totalRevenue), icon: DollarSign, color: 'bg-emerald-100 text-emerald-700', sub: `${completedSales.length} ventas` },
          { label: 'Hoy', value: fmt(todayRevenue), icon: TrendingUp, color: 'bg-blue-100 text-blue-700', sub: `${todaySales.length} ventas hoy` },
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

      {/* Recent sales */}
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
            {recentSales.slice(0, 15).map(sale => (
              <div key={sale.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  sale.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {sale.status === 'completed' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sale.customers?.name ?? 'Cliente sin registrar'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sale.establishment_id ? estMap[sale.establishment_id] ?? '' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{fmt(sale.total ?? 0)}</p>
                  <p className="text-[10px] text-gray-400">{fmtDate(sale.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
