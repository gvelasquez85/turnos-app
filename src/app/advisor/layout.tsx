import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(name), establishments(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['advisor', 'brand_admin', 'manager', 'superadmin'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <AppShell
      role={profile.role as 'superadmin' | 'brand_admin' | 'manager' | 'advisor'}
      fullName={profile.full_name}
      email={profile.email}
      brandName={(profile.brands as any)?.name ?? null}
      establishmentName={(profile.establishments as any)?.name ?? null}
    >
      {children}
    </AppShell>
  )
}
