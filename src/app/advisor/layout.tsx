import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { getVerifiedActiveModules } from '@/lib/serverBrandContext'

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
    >
      {children}
    </AppShell>
  )
}
