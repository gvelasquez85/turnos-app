import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { VentasDashboard } from './VentasDashboard'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }
  if (profile.role === 'superadmin' && !profile.brand_id) redirect('/superadmin')

  const brandId = profile.brand_id as string

  // Check sales module subscription
  let isExpired = false
  let expiredAt: string | null = null
  const { data: sub } = await supabase
    .from('module_subscriptions')
    .select('status, trial_expires_at, expires_at')
    .eq('brand_id', brandId)
    .eq('module_key', 'sales')
    .maybeSingle()
  if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
    isExpired = true
    expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
  }

  // Load recent sales (last 30 days)
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const [{ data: recentSales }, { data: establishments }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, type, status, total, created_at, establishment_id, customer_id, customers(name)')
      .eq('brand_id', brandId)
      .eq('type', 'sale')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('establishments')
      .select('id, name')
      .eq('brand_id', brandId)
      .eq('active', true)
      .order('name'),
  ])

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Ventas e Inventario" expiredAt={expiredAt}>
      <VentasDashboard
        brandId={brandId}
        recentSales={(recentSales ?? []) as any[]}
        establishments={establishments ?? []}
      />
    </TrialExpiredGate>
  )
}
