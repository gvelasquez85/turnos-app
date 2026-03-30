import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Schema no aplicado o tabla no existe
  if (error && error.code !== 'PGRST116') {
    redirect('/setup')
  }

  // Sin perfil aún
  if (!profile) redirect('/setup')

  if (profile.role === 'superadmin') redirect('/superadmin')
  if (profile.role === 'brand_admin') redirect('/admin')
  redirect('/advisor')
}
