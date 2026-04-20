import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/LandingPage'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Autenticado → redirigir al dashboard correspondiente
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') redirect('/setup')
    if (!profile) redirect('/setup')

    if (profile.role === 'superadmin') redirect('/superadmin')
    if (profile.role === 'brand_admin') redirect('/admin')
    if (profile.role === 'manager') redirect('/admin')
    if (profile.role === 'reporting') redirect('/reports')
    redirect('/advisor')
  }

  // No autenticado → mostrar landing page
  return <LandingPage />
}
