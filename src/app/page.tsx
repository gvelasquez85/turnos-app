import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LandingPage } from '@/components/LandingPage'
import { getSiteContent } from '@/lib/siteContent'

/**
 * Comportamiento según dominio:
 *
 *  www.turnflow.com.co  → Siempre muestra el landing, con o sin sesión.
 *  app.turnflow.com.co  → Si hay sesión → dashboard. Si no → /login.
 *  localhost / preview  → Igual que app (modo desarrollo).
 */
export default async function Home() {
  const headersList = await headers()
  const hostname = headersList.get('host') ?? ''

  const isWww = hostname.startsWith('www.') && !hostname.startsWith('app.')
  const isApex = !hostname.startsWith('www.') && !hostname.startsWith('app.')
    && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
    && !hostname.endsWith('.vercel.app')

  // En www o el dominio apex en producción → siempre landing
  if (isWww || isApex) {
    const content = await getSiteContent()
    return <LandingPage content={content} />
  }

  // En app.*, localhost o Vercel preview → comportamiento de app
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/setup')

  if (['brand_admin', 'manager'].includes(profile.role) && !profile.brand_id) {
    redirect('/onboarding')
  }

  if (profile.role === 'superadmin') redirect('/superadmin')
  if (profile.role === 'reporting') redirect('/reports')
  if (profile.role === 'advisor') redirect('/advisor')

  // brand_admin | manager
  if (!profile.brand_id) redirect('/onboarding')
  redirect('/admin')
}
