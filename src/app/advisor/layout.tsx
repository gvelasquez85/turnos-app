import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(name, active_modules), establishments(name, slug)')
    .eq('id', user.id)
    .single()

  if (!profile || !['advisor', 'brand_admin', 'manager', 'superadmin'].includes(profile.role)) {
    redirect('/login')
  }

  const brandId = (profile as any).brand_id
  const rawModules: Record<string, boolean> = (profile.brands as any)?.active_modules ?? {}

  // Verify queue subscription status against module_subscriptions (source of truth)
  // brand.active_modules may be stale — subscription expiry takes precedence
  let verifiedModules = { ...rawModules }
  if (brandId) {
    const { data: subs } = await supabase
      .from('module_subscriptions')
      .select('module_key, status')
      .eq('brand_id', brandId)
      .in('status', ['active', 'trialing'])

    const activeSubs = new Set((subs ?? []).map((s: any) => s.module_key))

    // For paid modules (queue, appointments, surveys, menu), only show if sub is active
    for (const mod of ['queue', 'appointments', 'surveys', 'menu']) {
      verifiedModules[mod] = activeSubs.has(mod)
    }
  }

  return (
    <AppShell
      role={profile.role as 'superadmin' | 'brand_admin' | 'manager' | 'advisor'}
      fullName={profile.full_name}
      email={profile.email}
      brandName={(profile.brands as any)?.name ?? null}
      establishmentName={(profile.establishments as any)?.name ?? null}
      establishmentSlug={(profile.establishments as any)?.slug ?? null}
      activeModules={verifiedModules}
    >
      {children}
    </AppShell>
  )
}
