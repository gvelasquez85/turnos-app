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

  if (profile?.role !== 'superadmin') redirect('/admin')

  const { data: subscriptions } = await supabase
    .from('module_subscriptions')
    .select('*')
    .eq('brand_id', profile.brand_id)

  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, active_modules')
    .eq('id', profile.brand_id)
    .single()

  return (
    <MarketplaceClient
      brandId={profile.brand_id}
      brandModules={(brand as any)?.active_modules ?? {}}
      subscriptions={subscriptions || []}
    />
  )
}
