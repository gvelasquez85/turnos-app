import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdvisorFieldsManager } from './AdvisorFieldsManager'

export default async function AdvisorFieldsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) redirect('/')

  // Cargar marcas accesibles
  const brandsQuery = supabase.from('brands').select('id, name, slug').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  // Cargar campos por brand_id (brand-scoped)
  const brandIds = (brands || []).map(b => b.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fields: any[] = []
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('advisor_fields')
      .select('*')
      .in('brand_id', brandIds)
      .order('sort_order')
    fields = data || []
  }

  return (
    <AdvisorFieldsManager
      brands={brands || []}
      defaultBrandId={profile.brand_id || null}
      fields={fields}
    />
  )
}
