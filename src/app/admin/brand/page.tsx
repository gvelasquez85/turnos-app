import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandSettings } from './BrandSettings'

export default async function BrandSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id) redirect('/admin')

  const brand = profile.brands as any

  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: moduleSubscriptions } = await supabase
    .from('module_subscriptions')
    .select('*')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })

  const { data: marketplaceModules } = await supabase
    .from('marketplace_modules')
    .select('module_key, label, price_monthly, price_per_user, price_per_user_amount')
    .or('is_visible_to_brands.eq.true,is_coming_soon.eq.true')

  return (
    <BrandSettings
      brand={brand}
      membership={membership || null}
      moduleSubscriptions={moduleSubscriptions || []}
      availableModules={marketplaceModules || []}
    />
  )
}
