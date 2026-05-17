import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ModulesPerBrand from './ModulesPerBrand'

export default async function SuperadminModulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/admin')

  const { data: brands } = await supabase
    .from('brands').select('id, name, slug, active').order('name')

  const { data: allSubs } = await supabase
    .from('module_subscriptions')
    .select('id, brand_id, module_key, status, trial_expires_at, expires_at, granted_by_superadmin, created_at')
    .in('status', ['active', 'trial'])

  return <ModulesPerBrand brands={brands ?? []} subscriptions={allSubs ?? []} />
}
