import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandFormConfig } from '../BrandFormConfig'

export default async function BrandFormConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, brands(id, data_policy_text, form_fields)')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }

  const brand = profile.brands as any

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Formulario del cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura los campos adicionales y la política de datos que verán tus clientes al registrar su turno</p>
      </div>
      <BrandFormConfig
        brandId={brand.id}
        initialFields={brand.form_fields || []}
        initialPolicy={brand.data_policy_text || null}
      />
    </div>
  )
}
