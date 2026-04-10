'use client'
import { useEffect, useState } from 'react'
import { useBrandStore } from '@/stores/brandStore'
import { Building2 } from 'lucide-react'
import { BrandFormConfig } from './BrandFormConfig'

interface BrandWithConfig {
  id: string
  name: string
  form_fields: any[]
  data_policy_text: string | null
}

interface Props {
  brands: BrandWithConfig[]
  defaultBrandId: string | null
}

export function BrandFormConfigWrapper({ brands, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  const effectiveBrandId = storeBrandId || defaultBrandId || ''
  const activeBrand = brands.find(b => b.id === effectiveBrandId)

  // Track key to force remount when brand changes (resets form state)
  const [configKey, setConfigKey] = useState(effectiveBrandId)

  useEffect(() => {
    setConfigKey(effectiveBrandId)
  }, [effectiveBrandId])

  if (!effectiveBrandId || !activeBrand) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
        <Building2 size={32} className="mx-auto mb-3 text-amber-400" />
        <p className="font-semibold text-amber-800">Selecciona una marca</p>
        <p className="text-sm text-amber-600 mt-1">Elige una marca en el selector del menú lateral para ver y editar su formulario.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Active brand indicator */}
      <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Building2 size={15} className="text-white" />
        </div>
        <div>
          <p className="text-xs text-indigo-500 font-medium uppercase tracking-wide">Editando formulario de</p>
          <p className="text-sm font-bold text-indigo-900">{activeBrand.name}</p>
        </div>
        {brands.length > 1 && (
          <p className="ml-auto text-xs text-indigo-400">Cambia la marca desde el selector del menú lateral</p>
        )}
      </div>

      <BrandFormConfig
        key={configKey}
        brandId={activeBrand.id}
        initialFields={activeBrand.form_fields}
        initialPolicy={activeBrand.data_policy_text}
      />
    </div>
  )
}
