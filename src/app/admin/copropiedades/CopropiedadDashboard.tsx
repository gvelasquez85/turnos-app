'use client'

import { Building, Home, DoorOpen, Calendar, FileText, Settings, AlertTriangle, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

interface Props {
  brandId: string
  config: any | null
  unitCount: number
  spaceCount: number
  totalFees: number
  paidFees: number
  pendingFeeCount: number
  upcomingMeetings: { id: string; meeting_type: string; title: string; scheduled_date: string; scheduled_time: string; status: string }[]
}

const MEETING_TYPES: Record<string, string> = {
  asamblea_ordinaria: 'Asamblea Ordinaria',
  asamblea_extraordinaria: 'Asamblea Extraordinaria',
  consejo: 'Consejo de Administración',
}

export default function CopropiedadDashboard({ brandId, config, unitCount, spaceCount, totalFees, paidFees, pendingFeeCount, upcomingMeetings }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const needsConfig = !config
  const collectionRate = totalFees > 0 ? Math.round((paidFees / totalFees) * 100) : 0

  const navCards = [
    { href: '/admin/copropiedades/inmuebles', label: 'Inmuebles', desc: 'Gestión de unidades y propietarios', icon: Home, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { href: '/admin/copropiedades/cuotas', label: 'Cuotas', desc: 'Administración y cobro de cuotas', icon: DollarSign, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { href: '/admin/copropiedades/espacios', label: 'Espacios comunes', desc: 'Reserva y gestión de zonas comunes', icon: DoorOpen, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { href: '/admin/copropiedades/asambleas', label: 'Asambleas', desc: 'Reuniones, quorum, votaciones y actas', icon: Users, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building size={22} className="text-indigo-600" /> {config?.copropiedad_name || 'Copropiedades'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestión integral de la copropiedad</p>
      </div>

      {needsConfig && (
        <Link href="/admin/copropiedades/inmuebles" className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Configura tu copropiedad</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Carga los inmuebles y coeficientes para comenzar</p>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Inmuebles</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{unitCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Recaudo del mes</p>
          <p className={`text-lg font-bold mt-1 ${collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
            {collectionRate}%
          </p>
          <p className="text-[10px] text-gray-400">{fmt(paidFees)} / {fmt(totalFees)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cuotas pendientes</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingFeeCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Zonas comunes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{spaceCount}</p>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {navCards.map(card => (
          <Link key={card.href} href={card.href}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{card.label}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-12">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-600" /> Próximas reuniones
          </p>
          <div className="space-y-2">
            {upcomingMeetings.map(m => (
              <Link key={m.id} href="/admin/copropiedades/asambleas"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.title}</p>
                  <p className="text-xs text-gray-400">{MEETING_TYPES[m.meeting_type] || m.meeting_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-indigo-600">{new Date(m.scheduled_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-gray-400">{m.scheduled_time?.slice(0, 5)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
