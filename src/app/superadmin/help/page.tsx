import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HelpCmsManager from './HelpCmsManager'

export default async function HelpCmsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/admin')
  return <HelpCmsManager />
}
