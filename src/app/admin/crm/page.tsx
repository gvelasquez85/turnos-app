import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { CRMDashboard } from './CRMDashboard'

export default async function CRMPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, full_name, establishments(name, slug)')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }

  const brandId = profile.brand_id

  // Load brand membership for plan gating
  const { data: membership } = await supabase
    .from('memberships')
    .select('plan, status')
    .eq('brand_id', brandId)
    .maybeSingle()

  // Load customers
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, email, document_id, first_visit_at, last_visit_at, total_visits, establishment_ids')
    .eq('brand_id', brandId)
    .order('last_visit_at', { ascending: false })

  // Load establishments for filter
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, name')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('name')

  // Load brand for AppShell
  const { data: brand } = await supabase
    .from('brands')
    .select('id, name, active_modules')
    .eq('id', brandId)
    .single()

  const establishmentInfo = Array.isArray(profile.establishments)
    ? profile.establishments[0]
    : (profile.establishments as any)

  return (
    <AppShell
      role={profile.role as any}
      fullName={profile.full_name}
      email={user.email ?? ''}
      brandName={brand?.name}
      establishmentName={establishmentInfo?.name}
      establishmentSlug={establishmentInfo?.slug}
      activeModules={brand?.active_modules ?? {}}
      plan={membership?.plan ?? 'free'}
    >
      <CRMDashboard
        customers={customers ?? []}
        establishments={establishments ?? []}
        brandId={brandId}
      />
    </AppShell>
  )
}
