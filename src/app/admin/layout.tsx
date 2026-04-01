import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(name, active_modules), establishments(name, slug)')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) redirect('/')

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

  return (
    <AppShell
      role={profile.role as 'superadmin' | 'brand_admin' | 'manager'}
      fullName={profile.full_name}
      email={profile.email}
      brandName={(profile.brands as any)?.name ?? null}
      establishmentName={(profile.establishments as any)?.name ?? null}
      establishmentSlug={(profile.establishments as any)?.slug ?? null}
      activeModules={(profile.brands as any)?.active_modules ?? undefined}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
