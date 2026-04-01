import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MembershipsAdmin } from './MembershipsAdmin'

export default async function MembershipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/admin')

  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, brands(name, slug)')
    .order('created_at', { ascending: false })

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug')
    .eq('active', true)
    .order('name')

  return <MembershipsAdmin memberships={memberships || []} brands={brands || []} />
}
