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

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) redirect('/')

  // Cargar marcas accesibles
  const brandsQuery = supabase.from('brands').select('id, name, slug').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  const brandIds = (brands || []).map(b => b.id)

  // Cargar establecimientos
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

  // Cargar promociones: brand-scoped + establishment-scoped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let promotions: any[] = []
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('promotions')
      .select('*, establishments(name)')
      .in('brand_id', brandIds)
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
