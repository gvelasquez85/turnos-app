import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileSettings } from './ProfileSettings'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, brand_id, establishment_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // For advisor/manager: load available establishments so they can switch
  let establishments: { id: string; name: string }[] = []
  if (profile.role === 'advisor' || profile.role === 'manager') {
    const q = supabase.from('establishments').select('id, name').eq('active', true).order('name')
    if (profile.brand_id) q.eq('brand_id', profile.brand_id)
    const { data } = await q
    establishments = data || []
  }

  return (
    <ProfileSettings
      userId={user.id}
      fullName={profile.full_name || ''}
      email={profile.email}
      role={profile.role}
      currentEstablishmentId={profile.establishment_id || null}
      establishments={establishments}
    />
  )
}
