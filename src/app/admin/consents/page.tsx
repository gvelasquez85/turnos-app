import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConsentsManager } from './ConsentsManager'

export default async function ConsentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile || !['superadmin', 'brand_admin', 'manager'].includes(profile.role)) redirect('/')

  let brandsQuery = supabase.from('brands').select('id, name')
  if (profile.brand_id) brandsQuery = brandsQuery.eq('id', profile.brand_id)
  const { data: brands } = await brandsQuery.order('name')

  const { data: consents } = await supabase
    .from('data_consents')
    .select('*, establishments(name), tickets(queue_number)')
    .order('consented_at', { ascending: false })
    .limit(200)

  return (
    <ConsentsManager
      consents={consents || []}
      brands={brands || []}
      defaultBrandId={profile.brand_id || null}
    />
  )
}
