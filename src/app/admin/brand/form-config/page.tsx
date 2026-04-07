import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandFormConfig } from '../BrandFormConfig'
import { Building2 } from 'lucide-react'

export default async function BrandFormConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Query profile sin join de brands (evita fallo si columnas no existen)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/')
  }

  // Si no hay marca vinculada al perfil, mostrar estado vacío (superadmin sin marca seleccionada)
  if (!profile.brand_id) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Formulario del cliente</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura los campos adicionales y la política de datos que verán tus clientes al registrar su turno</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-amber-400" />
          <p className="font-semibold text-amber-800">Selecciona una marca</p>
          <p className="text-sm text-amber-600 mt-1">Elige una marca en el selector del menú lateral para ver y editar su formulario.</p>
        </div>
      </div>
    )
  }

  // Query de brand separada para que si las columnas no existen, no rompa el perfil
  const { data: brand } = await supabase
    .from('brands')
    .select('id, data_policy_text, form_fields')
    .eq('id', profile.brand_id)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Formulario del cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura los campos adicionales y la política de datos que verán tus clientes al registrar su turno</p>
      </div>
      <BrandFormConfig
        brandId={profile.brand_id}
        initialFields={(brand as any)?.form_fields || []}
        initialPolicy={(brand as any)?.data_policy_text || null}
      />
    </div>
  )
}
