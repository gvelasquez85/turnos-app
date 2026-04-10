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

  const brandId = profile.brand_id as string | null

  // Load marketplace modules visible to brands
  // Superadmin sees ALL modules; brand users see only enabled ones
  const modulesQuery = supabase
    .from('marketplace_modules')
    .select('*')
    .order('sort_order')
  if (profile.role !== 'superadmin') {
    modulesQuery.eq('is_visible_to_brands', true)
  }
  const { data: marketplaceModules } = await modulesQuery

  // Load this brand's subscriptions
  const { data: subscriptions } = brandId
    ? await supabase
        .from('module_subscriptions')
        .select('*')
        .eq('brand_id', brandId)
    : { data: [] }

  // Load brand active_modules
  const { data: brand } = brandId
    ? await supabase
        .from('brands')
        .select('id, name, active_modules, max_establishments:memberships(max_establishments), max_advisors:memberships(max_advisors)')
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
      subscriptions={subscriptions || []}
      modules={marketplaceModules || []}
      isSuperadmin={profile.role === 'superadmin'}
      maxEstablishments={(membership as any)?.max_establishments ?? 1}
      maxAdvisors={(membership as any)?.max_advisors ?? 1}
    />
  )
}
