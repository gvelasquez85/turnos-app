import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId, checkModuleAccess } from '@/lib/serverBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import CopilotConfig from './CopilotConfig'

export default async function CopilotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const moduleAccess = await checkModuleAccess(supabase, brandId, 'ai_copilot')

  const { data: config } = await supabase
    .from('ai_configs').select('*').eq('brand_id', brandId).maybeSingle()

  const today = new Date().toISOString().slice(0, 10)
  const { data: usageRow } = await supabase
    .from('ai_usage').select('query_count').eq('brand_id', brandId).eq('usage_date', today).maybeSingle()

  return (
    <TrialExpiredGate isExpired={moduleAccess.isExpired} moduleLabel="Copilot IA" expiredAt={moduleAccess.expiredAt}>
      <CopilotConfig brandId={brandId} config={config} usedToday={usageRow?.query_count ?? 0} />
    </TrialExpiredGate>
  )
}
