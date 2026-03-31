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

  if (!profile || !['brand_admin', 'superadmin'].includes(profile.role)) redirect('/')

  // Cargar marcas accesibles
  const brandsQuery = supabase.from('brands').select('id, name, slug').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  // Cargar establecimientos accesibles (con brand_id para filtrar en cliente)
  const brandIds = (brands || []).map(b => b.id)
  let establishments: { id: string; name: string; brand_id: string }[] = []
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('establishments')
      .select('id, name, brand_id')
      .in('brand_id', brandIds)
      .eq('active', true)
      .order('name')
    establishments = data || []
  }

  // Cargar campos
  const estIds = establishments.map(e => e.id)
  let fields: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase
      .from('advisor_fields')
      .select('*, establishments(name)')
      .in('establishment_id', estIds)
      .order('sort_order')
    fields = data || []
  }

  return (
    <AdvisorFieldsManager
      brands={brands || []}
      defaultBrandId={profile.brand_id || null}
      establishments={establishments}
      fields={fields}
    />
  )
}
