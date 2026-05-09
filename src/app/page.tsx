import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/LandingPage'
import { getSiteContent } from '@/lib/siteContent'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Autenticado → redirigir al dashboard correspondiente
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, brand_id')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') redirect('/setup')
    if (!profile) redirect('/setup')

    // brand_admin / manager without a brand → onboarding first
    if (['brand_admin', 'manager'].includes(profile.role) && !profile.brand_id) {
      redirect('/onboarding')
    }

    if (profile.role === 'superadmin') redirect('/superadmin')
    if (profile.role === 'brand_admin') redirect('/admin')
    if (profile.role === 'manager') redirect('/admin')
    if (profile.role === 'reporting') redirect('/reports')

    // advisor without brand → also needs onboarding (shouldn't happen, but safety net)
    if (!profile.brand_id) redirect('/onboarding')
    redirect('/advisor')
  }

  // No autenticado → mostrar landing page
  const content = await getSiteContent()
  return <LandingPage content={content} />
}
