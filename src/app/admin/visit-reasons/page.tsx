import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitReasonsManager } from './VisitReasonsManager'

export default async function VisitReasonsPage() {
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

  // Cargar todos los motivos accesibles
  const brandIds = (brands || []).map(b => b.id)
  let reasons: any[] = []
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('visit_reasons')
      .select('*')
      .in('brand_id', brandIds)
      .order('sort_order')
    reasons = data || []
  }

  return (
    <VisitReasonsManager
      brands={brands || []}
      defaultBrandId={profile.brand_id || null}
      reasons={reasons}
    />
  )
}
