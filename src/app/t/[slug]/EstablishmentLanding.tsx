'use client'

import { useState } from 'react'
import { Users, CalendarClock, CalendarCheck, UtensilsCrossed } from 'lucide-react'
import { CustomerFlow } from './CustomerFlow'
import AppointmentCheckin from './AppointmentCheckin'

interface Props {
  establishment: {
    id: string
    name: string
    slug: string
    brand_id: string
    features: { queue?: boolean; appointments?: boolean; surveys?: boolean; menu?: boolean } | null
    brands: { name: string; logo_url: string | null; data_policy_text: string | null; form_fields: any[] | null }
  }
  visitReasons: any[]
  promotions: any[]
}

type View = 'landing' | 'queue' | 'checkin'

export function EstablishmentLanding({ establishment, visitReasons, promotions }: Props) {
  const [view, setView] = useState<View>('landing')
  const primaryColor = (establishment.brands as any)?.primary_color ?? '#6366f1'

  const features = establishment.features ?? { queue: true }
  const hasAppointments = !!features.appointments
  const hasMenu = !!features.menu
  const multipleFeatures = hasAppointments || hasMenu

  if (!multipleFeatures || view === 'queue') {
    return (
      <CustomerFlow
        establishment={establishment as any}
        visitReasons={visitReasons}
        promotions={promotions}
      />
    )
  }

  if (view === 'checkin') {
    return <AppointmentCheckin establishment={establishment} onBack={() => setView('landing')} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="py-10 text-center text-white" style={{ backgroundColor: primaryColor }}>
        <p className="text-lg font-medium opacity-80">{establishment.brands.name}</p>
        <h1 className="text-3xl font-bold mt-1">{establishment.name}</h1>
      </div>

      {/* Body */}
      <div className="max-w-sm mx-auto p-6 flex flex-col gap-3 mt-4 w-full">
        {/* Always: Tomar turno */}
        <button
          onClick={() => setView('queue')}
          className="bg-white border-2 border-indigo-100 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left w-full cursor-pointer"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Tomar turno</p>
            <p className="text-sm text-gray-500 mt-0.5">Únete a la fila de atención</p>
          </div>
        </button>

        {/* Reservar una cita */}
        {hasAppointments && (
          <a
            href={`/book/${establishment.slug}`}
            className="bg-white border-2 border-purple-100 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-400 hover:bg-purple-50 transition-all text-left w-full cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <CalendarClock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Reservar una cita</p>
              <p className="text-sm text-gray-500 mt-0.5">Agenda tu próxima visita</p>
            </div>
          </a>
        )}

        {/* Tengo una cita */}
        {hasAppointments && (
          <button
            onClick={() => setView('checkin')}
            className="bg-white border-2 border-green-100 rounded-2xl p-4 flex items-center gap-4 hover:border-green-400 hover:bg-green-50 transition-all text-left w-full cursor-pointer"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Cumplir mi cita</p>
              <p className="text-sm text-gray-500 mt-0.5">Check-in para tu cita programada</p>
            </div>
          </button>
        )}

        {/* Ver el menú */}
        {hasMenu && (
          <a
            href={`/order/${establishment.slug}`}
            className="bg-white border-2 border-amber-100 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-400 hover:bg-amber-50 transition-all text-left w-full cursor-pointer"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Ver el menú</p>
              <p className="text-sm text-gray-500 mt-0.5">Realiza un pedido anticipado</p>
            </div>
          </a>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-300 mt-auto pb-6">Powered by TurnApp</p>
    </div>
  )
}
