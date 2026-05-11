'use client'

import { useState } from 'react'
import { Users, FileText } from 'lucide-react'
import { ClientesManager } from './ClientesManager'
import LeadFormsManager from './LeadFormsManager'

interface Props {
  customers: any[]
  establishments: { id: string; name: string }[]
  brandId: string
  businessType: string
  waTemplates: { category: string; body: string }[]
  brandName: string
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
      ) : (
        <LeadFormsManager brandId={props.brandId} />
      )}
    </div>
  )
}
