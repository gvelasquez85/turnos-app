import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CRMDashboard } from './CRMDashboard'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }

  const brandId = profile.brand_id

  // Load customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, email, document_id, first_visit_at, last_visit_at, total_visits, establishment_ids')
    .eq('brand_id', brandId)
    .order('last_visit_at', { ascending: false })

  // Load establishments for filter
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, name')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('name')

  // Check trial expiry
  let isExpired = false
  let expiredAt: string | null = null
  if (profile.role !== 'superadmin') {
    const { data: sub } = await supabase
      .from('module_subscriptions')
      .select('status, trial_expires_at, expires_at')
      .eq('brand_id', brandId)
      .eq('module_key', 'crm')
      .maybeSingle()
    if (sub?.status === 'expired') {
      isExpired = true
      expiredAt = sub.trial_expires_at ?? sub.expires_at ?? null
    }
  }

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Clientes CRM" expiredAt={expiredAt}>
      <CRMDashboard
        customers={customers ?? []}
        establishments={establishments ?? []}
        brandId={brandId}
      />
    </TrialExpiredGate>
  )
}
