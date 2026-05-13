'use client'

import { useState } from 'react'
import { Users, FileText, Lock } from 'lucide-react'
import { ClientesManager } from './ClientesManager'
import LeadFormsManager from './LeadFormsManager'
import Link from 'next/link'

interface Props {
  customers: any[]
  establishments: { id: string; name: string }[]
  brandId: string
  businessType: string
  waTemplates: { category: string; body: string }[]
  brandName: string
  hasLeadForms?: boolean
}

export default function ClientesPageWrapper(props: Props) {
  const [tab, setTab] = useState<'clientes' | 'formularios'>('clientes')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-4 w-fit">
        <button
          onClick={() => setTab('clientes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'clientes'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users size={14} /> Clientes
        </button>
        <button
          onClick={() => setTab('formularios')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'formularios'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText size={14} /> Formularios de captura
          {!props.hasLeadForms && <Lock size={12} className="text-gray-400" />}
        </button>
      </div>

      {tab === 'clientes' ? (
        <ClientesManager
          customers={props.customers}
          establishments={props.establishments}
          brandId={props.brandId}
          businessType={props.businessType}
          waTemplates={props.waTemplates}
          brandName={props.brandName}
        />
      ) : props.hasLeadForms ? (
        <LeadFormsManager brandId={props.brandId} />
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Formularios de captura de leads</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-1">
            Crea formularios personalizados para capturar leads desde pautas, redes sociales o tu pagina web.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Los contactos se agregan automaticamente a tu base de clientes.
          </p>
          <p className="text-2xl font-bold text-indigo-600 mb-4">$19.900 <span className="text-sm font-normal text-gray-400">/ mes</span></p>
          <Link
            href="/admin/marketplace"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Activar en Marketplace
          </Link>
        </div>
      )}
    </div>
  )
}
