import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DisplayConfig } from './DisplayConfig'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'

export default async function DisplayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const brandsQuery = supabase.from('brands').select('id, name').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  const estQuery = supabase.from('establishments').select('id, name, slug, brand_id').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    estQuery.eq('brand_id', profile.brand_id)
  }
  const { data: establishments } = await estQuery

  const estIds = (establishments || []).map(e => e.id)
  let displayConfigs: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase.from('display_configs').select('*').in('establishment_id', estIds)
    displayConfigs = data || []
  }

  // Check if display module trial has expired (superadmin always has access)
  let displayExpired = false
  let displayExpiredAt: string | null = null
  if (profile.role !== 'superadmin' && profile.brand_id) {
    const { data: sub } = await supabase
      .from('module_subscriptions')
      .select('status, trial_expires_at, expires_at')
      .eq('brand_id', profile.brand_id)
      .eq('module_key', 'display')
      .maybeSingle()
    if (sub?.status === 'expired') {
      displayExpired = true
      displayExpiredAt = sub.trial_expires_at ?? sub.expires_at ?? null
    }
  }

  return (
    <TrialExpiredGate
      isExpired={displayExpired}
      moduleLabel="Pantalla TV"
      expiredAt={displayExpiredAt}
    >
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Pantalla TV</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configura la pantalla TV de cada sucursal</p>
        </div>
        <DisplayConfig
          brands={brands || []}
          establishments={establishments || []}
          displayConfigs={displayConfigs}
          defaultBrandId={profile.brand_id || null}
        />
      </div>
    </TrialExpiredGate>
  )
}
