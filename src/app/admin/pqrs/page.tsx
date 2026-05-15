import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId, checkModuleAccess } from '@/lib/serverBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import PQRSDashboard from './PQRSDashboard'

export default async function PQRSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const moduleAccess = await checkModuleAccess(supabase, brandId, 'pqrs')

  // Load config
  const { data: config } = await supabase
    .from('pqrs_configs').select('*').eq('brand_id', brandId).maybeSingle()

  // Load cases with stats
  const { data: cases } = await supabase
    .from('pqrs_cases')
    .select('id, radicado, requester_name, category, subject, status, priority, sla_due_date, sla_breached, assigned_to, created_at')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <TrialExpiredGate isExpired={moduleAccess.isExpired} moduleLabel="PQRS" expiredAt={moduleAccess.expiredAt}>
      <PQRSDashboard brandId={brandId} config={config} cases={cases ?? []} />
    </TrialExpiredGate>
  )
}
