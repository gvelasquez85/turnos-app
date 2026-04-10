import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandFormConfigWrapper } from '../BrandFormConfigWrapper'

export default async function BrandFormConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/')
  }

  // Load all accessible brands with their form configs
  const brandsQuery = supabase
    .from('brands')
    .select('id, name, form_fields, data_policy_text')
    .eq('active', true)
    .order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Formulario del cliente</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configura los campos adicionales y la política de datos que verán tus clientes al registrar su turno</p>
      </div>
      <BrandFormConfigWrapper
        brands={(brands || []).map(b => ({
          id: b.id,
          name: b.name,
          form_fields: (b as any).form_fields || [],
          data_policy_text: (b as any).data_policy_text || null,
        }))}
        defaultBrandId={profile.brand_id || null}
      />
    </div>
  )
}
