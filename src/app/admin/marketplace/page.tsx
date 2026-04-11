import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketplaceClient } from './MarketplaceClient'

export default async function MarketplacePage() {
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

  // Superadmin manages modules from their own dedicated page
  if (profile.role === 'superadmin') {
    redirect('/superadmin/marketplace')
  }

  const brandId = profile.brand_id as string | null

  // Load marketplace modules: visible ones + coming-soon ones (shown as preview to brands)
  const modulesQuery = supabase
    .from('marketplace_modules')
    .select('*')
    .order('sort_order')
  if (profile.role !== 'superadmin') {
    // Brand users see modules that are enabled OR marked as coming soon
    modulesQuery.or('is_visible_to_brands.eq.true,is_coming_soon.eq.true')
  }
  const { data: marketplaceModules } = await modulesQuery

  // Load this brand's subscriptions
  const { data: rawSubscriptions } = brandId
    ? await supabase
        .from('module_subscriptions')
        .select('*')
        .eq('brand_id', brandId)
    : { data: [] }

  // Auto-expire any trials that have passed their trial_expires_at
  let subscriptions = rawSubscriptions ?? []
  if (brandId && subscriptions.length > 0) {
    const now = new Date().toISOString()
    const expiredTrials = subscriptions.filter(
      s => s.status === 'trial' && s.trial_expires_at && s.trial_expires_at < now
    )
    if (expiredTrials.length > 0) {
      await supabase
        .from('module_subscriptions')
        .update({ status: 'expired' })
        .in('id', expiredTrials.map(s => s.id))

      // Deactivate in brand's active_modules
      const { data: brand } = await supabase
        .from('brands')
        .select('active_modules')
        .eq('id', brandId)
        .single()
      if (brand) {
        const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}) }
        for (const s of expiredTrials) updated[s.module_key] = false
        await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
      }
      // Reflect in local array
      subscriptions = subscriptions.map(s =>
        expiredTrials.find(e => e.id === s.id) ? { ...s, status: 'expired' } : s
      )
    }
  }

  // Load brand data (active_modules + country)
  const { data: brand } = brandId
    ? await supabase
        .from('brands')
        .select('id, name, active_modules, country')
        .eq('id', brandId)
        .single()
    : { data: null }

  // Load membership for pricing display
  const { data: membership } = brandId
    ? await supabase
        .from('memberships')
        .select('max_establishments, max_advisors')
        .eq('brand_id', brandId)
        .eq('status', 'active')
        .single()
    : { data: null }

  return (
    <MarketplaceClient
      brandId={brandId ?? ''}
      brandModules={(brand as any)?.active_modules ?? {}}
      brandCountry={(brand as any)?.country ?? 'Colombia'}
      subscriptions={subscriptions}
      modules={marketplaceModules || []}
      isSuperadmin={profile.role === 'superadmin'}
      maxEstablishments={(membership as any)?.max_establishments ?? 1}
      maxAdvisors={(membership as any)?.max_advisors ?? 1}
    />
  )
}
