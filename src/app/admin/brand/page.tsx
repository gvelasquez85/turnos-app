import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { BrandSettings } from './BrandSettings'

export default async function BrandSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()

  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: moduleSubscriptions } = await supabase
    .from('module_subscriptions')
    .select('*')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  const { data: marketplaceModules } = await supabase
    .from('marketplace_modules')
    .select('module_key, label, price_monthly, price_per_user, price_per_user_amount')
    .or('is_visible_to_brands.eq.true,is_coming_soon.eq.true')

  const { count: estCount } = await supabase
    .from('establishments')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)

  const { count: advCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .neq('role', 'brand_admin')

  return (
    <BrandSettings
      brand={brand}
      membership={membership ?? null}
      moduleSubscriptions={moduleSubscriptions ?? []}
      availableModules={marketplaceModules ?? []}
      currentEstablishments={estCount ?? 1}
      currentAdvisors={advCount ?? 0}
      isSuperAdmin={profile.role === 'superadmin'}
    />
  )
}
