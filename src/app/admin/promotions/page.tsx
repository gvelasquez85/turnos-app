import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PromotionsManager } from './PromotionsManager'

export default async function PromotionsPage() {
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

  // Cargar promociones
  const estIds = establishments.map(e => e.id)
  let promotions: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase
      .from('promotions')
      .select('*, establishments(name)')
      .in('establishment_id', estIds)
      .order('created_at', { ascending: false })
    promotions = data || []
  }

  return (
    <PromotionsManager
      brands={brands || []}
      defaultBrandId={profile.brand_id || null}
      establishments={establishments}
      promotions={promotions}
    />
  )
}
