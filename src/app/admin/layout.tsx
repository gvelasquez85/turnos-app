import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { getVerifiedActiveModules } from '@/lib/serverBrandContext'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let profile: any = null
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, brands(name, active_modules), establishments(name, slug)')
      .eq('id', user.id)
      .single()
    if (!error && data) {
      profile = data
    } else {
      // Fallback si el join de brands falla (columna faltante, RLS, etc.)
      const { data: fallback } = await supabase
        .from('profiles')
        .select('*, establishments(name, slug)')
        .eq('id', user.id)
        .single()
      profile = fallback
    }
  }

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role)) redirect('/')

  // Redirect brand_admin / manager to onboarding if brand not set up
  if (['brand_admin', 'manager'].includes(profile.role)) {
    if (!(profile as any).brand_id) {
      // No brand at all → must go through onboarding to create one
      redirect('/onboarding')
    }
    const { data: brandCheck } = await supabase
      .from('brands')
      .select('onboarding_completed')
      .eq('id', (profile as any).brand_id)
      .single()
    if (!brandCheck || brandCheck.onboarding_completed !== true) {
      redirect('/onboarding')
    }
  }

  const brandId = (profile as any).brand_id

  let plan = 'free'
  if (brandId) {
    const { data: mem } = await supabase
      .from('memberships')
      .select('plan')
      .eq('brand_id', brandId)
      .single()
    if (mem?.plan) plan = mem.plan
  }

  const activeModules = await getVerifiedActiveModules(
    supabase,
    brandId,
    (profile.brands as any)?.active_modules ?? null,
  )

  return (
    <AppShell
      role={profile.role as 'superadmin' | 'brand_admin' | 'manager' | 'advisor'}
      fullName={profile.full_name}
      email={profile.email}
      brandName={(profile.brands as any)?.name ?? null}
      establishmentName={(profile.establishments as any)?.name ?? null}
      establishmentSlug={(profile.establishments as any)?.slug ?? null}
      activeModules={activeModules}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
