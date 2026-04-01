'use client'
import { useState } from 'react'
import { useBrandStore } from '@/stores/brandStore'
import { Shield, Download, Search, Check } from 'lucide-react'

interface Consent {
  id: string
  ticket_id: string | null
  establishment_id: string
  brand_id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  marketing_opt_in: boolean
  data_processing_consent: boolean
  consented_at: string
  establishments: { name: string } | null
  tickets: { queue_number: string } | null
}

interface Props {
  consents: Consent[]
  brands: { id: string; name: string }[]
  defaultBrandId: string | null
}

export function ConsentsManager({ consents, brands, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const effectiveBrandId = storeBrandId || defaultBrandId || brands[0]?.id || ''
  const [search, setSearch] = useState('')

  const filtered = consents
    .filter(c => !effectiveBrandId || c.brand_id === effectiveBrandId)
    .filter(c => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.customer_name.toLowerCase().includes(q) ||
        (c.customer_phone || '').includes(q) ||
        (c.customer_email || '').toLowerCase().includes(q)
    })

  function downloadCertificate(consentId: string) {
    window.open(`/api/consent/download?consentId=${consentId}`, '_blank')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autorizaciones de datos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} registros</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield size={40} className="mx-auto mb-3 opacity-30" />
            <p>Sin registros de consentimiento</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2">Sucursal</div>
              <div className="col-span-1 text-center">Turno</div>
              <div className="col-span-2 text-center">Autorizaciones</div>
              <div className="col-span-1">Fecha</div>
              <div className="col-span-1 text-center">PDF</div>
            </div>
            {filtered.map(c => (
              <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50 text-sm">
                <div className="col-span-3">
                  <p className="font-medium text-gray-900 truncate">{c.customer_name}</p>
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  {c.customer_phone && <p>{c.customer_phone}</p>}
                  {c.customer_email && <p className="truncate">{c.customer_email}</p>}
                </div>
                <div className="col-span-2 text-gray-600 truncate text-xs">
                  {(c.establishments as any)?.name || '—'}
                </div>
                <div className="col-span-1 text-center text-xs text-gray-500">
                  #{(c.tickets as any)?.queue_number || '—'}
                </div>
                <div className="col-span-2 flex items-center justify-center gap-2">
                  <span title="Tratamiento de datos" className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${c.data_processing_consent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c.data_processing_consent && <Check size={10} />} Datos
                  </span>
                  <span title="Marketing" className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${c.marketing_opt_in ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c.marketing_opt_in && <Check size={10} />} Mktg
                  </span>
                </div>
                <div className="col-span-1 text-xs text-gray-400">
                  {new Date(c.consented_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => downloadCertificate(c.id)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500"
                    title="Descargar certificado PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
