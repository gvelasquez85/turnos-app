import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperadminSettings } from './SuperadminSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/admin')

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, active_modules, primary_color')
    .order('name')

  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, brands(name)')
    .order('created_at', { ascending: false })

  return <SuperadminSettings brands={brands || []} memberships={memberships || []} />
}
