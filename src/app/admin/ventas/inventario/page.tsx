import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { NoBrandContext } from '@/components/NoBrandContext'
import { InventarioManager } from './InventarioManager'

export default async function InventarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  if (!profile.brand_id) return <NoBrandContext />

  const brandId = profile.brand_id as string

  let isExpired = false, expiredAt: string | null = null
  const { data: sub } = await supabase.from('module_subscriptions')
    .select('status, trial_expires_at, expires_at')
    .eq('brand_id', brandId).eq('module_key', 'sales').maybeSingle()
  if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
    isExpired = true; expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
  }

  const [productsRes, estRes] = await Promise.allSettled([
    supabase.from('products').select('*').eq('brand_id', brandId).order('name'),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const products = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Ventas e Inventario" expiredAt={expiredAt}>
      <InventarioManager brandId={brandId} products={products as any[]} establishments={establishments} />
    </TrialExpiredGate>
  )
}
