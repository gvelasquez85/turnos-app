import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkModuleAccess, getEffectiveBrandId } from '@/lib/serverBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import ContabilidadDashboard from './ContabilidadDashboard'

export default async function ContabilidadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  // Module access check
  const { isExpired, expiredAt } = await checkModuleAccess(supabase, brandId, 'contabilidad')

  // Load current period
  const now = new Date()
  const { data: currentPeriod } = await supabase
    .from('accounting_periods')
    .select('*')
    .eq('brand_id', brandId)
    .eq('year', now.getFullYear())
    .eq('month', now.getMonth() + 1)
    .maybeSingle()

  // Load recent journal entries
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('id, entry_date, description, status, source_type')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Load settings
  const { data: settings } = await supabase
    .from('accounting_settings')
    .select('*')
    .eq('brand_id', brandId)
    .maybeSingle()

  // Check if PUC is seeded
  const { count: accountCount } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)

  return (
    <TrialExpiredGate isExpired={isExpired && profile.role !== 'superadmin'} expiredAt={expiredAt} moduleLabel="Contabilidad NIIF">
      <ContabilidadDashboard
        brandId={brandId}
        currentPeriod={currentPeriod}
        recentEntries={recentEntries ?? []}
        settings={settings}
        hasPuc={(accountCount ?? 0) > 0}
      />
    </TrialExpiredGate>
  )
}
