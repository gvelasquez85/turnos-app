import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './OnboardingWizard'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id, full_name').eq('id', user.id).single()

  if (!profile?.brand_id) redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) redirect('/admin')

  const { data: brand } = await supabase
    .from('brands').select('id, name, business_type, onboarding_completed').eq('id', brandId).single()

  // If already completed, redirect to home
  if ((brand as any)?.onboarding_completed) redirect('/admin/home')

  return (
    <OnboardingWizard
      brandId={brandId}
      brandName={(brand as any)?.name ?? ''}
      userName={profile.full_name ?? user.email ?? ''}
    />
  )
}
