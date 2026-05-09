import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }

  // If brand exists and onboarding already complete → skip to home
  if (profile.brand_id) {
    const { data: brand } = await supabase
      .from('brands')
      .select('onboarding_completed')
      .eq('id', profile.brand_id)
      .single()
    if (brand?.onboarding_completed) redirect('/admin/home')
  }

  // Show wizard — works with or without an existing brand_id
  return (
    <OnboardingWizard
      userId={user.id}
      brandId={profile.brand_id ?? null}
      userName={profile.full_name ?? user.email ?? ''}
    />
  )
}
