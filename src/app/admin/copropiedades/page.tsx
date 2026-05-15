import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId, checkModuleAccess } from '@/lib/serverBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import CopropiedadDashboard from './CopropiedadDashboard'

export default async function CopropiedadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const moduleAccess = await checkModuleAccess(supabase, brandId, 'copropiedades')

  const { data: config } = await supabase
    .from('copropiedad_configs').select('*').eq('brand_id', brandId).maybeSingle()

  const { count: unitCount } = await supabase
    .from('copropiedad_units').select('id', { count: 'exact', head: true }).eq('brand_id', brandId)

  const { count: spaceCount } = await supabase
    .from('copropiedad_spaces').select('id', { count: 'exact', head: true }).eq('brand_id', brandId)

  // Pending fees this month
  const currentPeriod = new Date().toISOString().slice(0, 7)
  const { data: feeStats } = await supabase
    .from('copropiedad_fees')
    .select('status, total_amount, paid_amount')
    .eq('brand_id', brandId)
    .eq('period', currentPeriod)

  const totalFees = feeStats?.reduce((s, f) => s + f.total_amount, 0) ?? 0
  const paidFees = feeStats?.reduce((s, f) => s + f.paid_amount, 0) ?? 0
  const pendingFeeCount = feeStats?.filter(f => f.status !== 'paid').length ?? 0

  // Upcoming meetings
  const { data: upcomingMeetings } = await supabase
    .from('copropiedad_meetings')
    .select('id, meeting_type, title, scheduled_date, scheduled_time, status')
    .eq('brand_id', brandId)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date')
    .limit(3)

  return (
    <TrialExpiredGate isExpired={moduleAccess.isExpired} moduleLabel="Copropiedades" expiredAt={moduleAccess.expiredAt}>
      <CopropiedadDashboard
        brandId={brandId}
        config={config}
        unitCount={unitCount ?? 0}
        spaceCount={spaceCount ?? 0}
        totalFees={totalFees}
        paidFees={paidFees}
        pendingFeeCount={pendingFeeCount}
        upcomingMeetings={upcomingMeetings ?? []}
      />
    </TrialExpiredGate>
  )
}
