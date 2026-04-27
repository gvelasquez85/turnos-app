import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { CotizacionesManager } from './CotizacionesManager'

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) redirect('/admin')
  if (profile.role === 'superadmin' && !profile.brand_id) redirect('/superadmin')

  const brandId = profile.brand_id as string

  let isExpired = false, expiredAt: string | null = null
  const { data: sub } = await supabase.from('module_subscriptions')
    .select('status, trial_expires_at, expires_at')
    .eq('brand_id', brandId).eq('module_key', 'sales').maybeSingle()
  if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
    isExpired = true; expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
  }

  const [{ data: quotes }, { data: establishments }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, status, total, created_at, establishment_id, customer_id, notes, customers(name)')
      .eq('brand_id', brandId)
      .eq('type', 'quote')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Ventas e Inventario" expiredAt={expiredAt}>
      <CotizacionesManager
        brandId={brandId}
        quotes={(quotes ?? []) as any[]}
        establishments={establishments ?? []}
      />
    </TrialExpiredGate>
  )
}
