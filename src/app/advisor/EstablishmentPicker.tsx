'use client'
import { useState } from 'react'
import { QueueBoard } from './QueueBoard'
import { Store, ChevronDown } from 'lucide-react'
import type { AdvisorField } from '@/types/database'

type EstWithBrand = {
  id: string
  name: string
  slug: string
  brand_id: string
  brands: { name: string } | null
}

interface Props {
  establishments: EstWithBrand[]
  allFields: AdvisorField[]
  advisorId: string
}

export function EstablishmentPicker({ establishments, allFields, advisorId }: Props) {
  const autoId = establishments.length === 1 ? establishments[0].id : ''
  const [selectedId, setSelectedId] = useState(autoId)

  const selectedEst = establishments.find(e => e.id === selectedId)
  const fields = allFields.filter(f => f.brand_id === selectedEst?.brand_id)

  if (selectedId && selectedEst) {
    return (
      <div>
        {/* Selector en la parte superior si hay más de uno */}
        {establishments.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 mb-5 flex items-center gap-3">
            <Store size={16} className="text-indigo-500 shrink-0" />
            <div className="relative flex-1 max-w-xs">
              <select
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                {establishments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.brands?.name ? `${e.brands.name} — ` : ''}{e.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        <QueueBoard
          establishmentId={selectedId}
          establishmentSlug={selectedEst.slug}
          advisorId={advisorId}
          advisorFields={fields}
        />
      </div>
    )
  }

  // Sin selección — mostrar picker grande
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Cola de atención</h1>
        <p className="text-sm text-gray-500 mt-0.5">Selecciona el establecimiento a monitorear</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {establishments.map(est => (
          <button
            key={est.id}
            onClick={() => setSelectedId(est.id)}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 p-5 text-left transition-all group"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200">
              <Store size={20} className="text-indigo-600" />
            </div>
            <p className="font-semibold text-gray-900">{est.name}</p>
            {est.brands?.name && (
              <p className="text-xs text-gray-500 mt-0.5">{est.brands.name}</p>
            )}
          </button>
        ))}
      </div>

      {establishments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <Store size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No hay establecimientos activos disponibles.</p>
          <a href="/admin" className="text-indigo-600 text-sm underline mt-2 inline-block">
            Crear establecimientos
          </a>
        </div>
      )}
    </div>
  )
}
