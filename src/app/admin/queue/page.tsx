import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandQueueMonitor } from './BrandQueueMonitor'

export default async function QueueMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) redirect('/')

  // Cargar marcas (superadmin ve todas, brand_admin solo la suya)
  const brandsQuery = supabase.from('brands').select('id, name').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  // Cargar todos los establecimientos relevantes
  const estQuery = supabase.from('establishments').select('id, name, brand_id').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    estQuery.eq('brand_id', profile.brand_id)
  }
  const { data: establishments } = await estQuery

  return (
    <BrandQueueMonitor
      brands={brands || []}
      establishments={establishments || []}
      defaultBrandId={profile.brand_id || null}
    />
  )
}
