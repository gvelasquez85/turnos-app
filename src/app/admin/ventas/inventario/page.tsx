import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { InventarioManager } from './InventarioManager'

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const [productsRes, estRes] = await Promise.allSettled([
    supabase.from('products').select('*').eq('brand_id', brandId).order('name'),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const products = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return <InventarioManager brandId={brandId} products={products as any[]} establishments={establishments} />
}
