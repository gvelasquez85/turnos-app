import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { VentasDashboard } from './VentasDashboard'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const [salesRes, estRes, pendingRes] = await Promise.allSettled([
    supabase.from('sales')
      .select('id, type, status, total, created_at, establishment_id, customer_id, customers(name)')
      .eq('brand_id', brandId).eq('type', 'sale').gte('created_at', since)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
    supabase.from('sales')
      .select('id, type, status, total, notes, created_at, establishment_id, customer_id, customers(name)')
      .eq('brand_id', brandId).eq('type', 'sale').eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const recentSales = salesRes.status === 'fulfilled' ? (salesRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []
  const pendingSales = pendingRes.status === 'fulfilled' ? (pendingRes.value.data ?? []) : []

  return <VentasDashboard brandId={brandId} recentSales={recentSales as any[]} pendingSales={pendingSales as any[]} establishments={establishments} />
}
