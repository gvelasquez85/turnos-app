import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ModuleAnalytics } from './ModuleAnalytics'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/admin')

  const [
    { data: moduleSubs },
    { data: modules },
    { data: memberships },
    { count: brandsCount },
  ] = await Promise.all([
    supabase
      .from('module_subscriptions')
      .select('*, brands(name)'),
    supabase
      .from('marketplace_modules')
      .select('*')
      .or('is_visible_to_brands.eq.true,is_coming_soon.eq.true'),
    supabase
      .from('memberships')
      .select('plan, max_advisors, status, billing_status, brand_id, brands(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('brands')
      .select('*', { count: 'exact', head: true }),
  ])

  return (
    <ModuleAnalytics
      moduleSubs={moduleSubs || []}
      modules={modules || []}
      memberships={memberships || []}
      brandsCount={brandsCount || 0}
    />
  )
}
