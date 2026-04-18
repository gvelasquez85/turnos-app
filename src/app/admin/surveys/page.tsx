import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SurveyManager } from './SurveyManager'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'

export default async function SurveysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const brandsQuery = supabase.from('brands').select('id, name').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    brandsQuery.eq('id', profile.brand_id)
  }
  const { data: brands } = await brandsQuery

  const templatesQuery = supabase.from('survey_templates').select('*').order('created_at', { ascending: false })
  if (profile.role !== 'superadmin' && profile.brand_id) {
    templatesQuery.eq('brand_id', profile.brand_id)
  }
  const { data: templates } = await templatesQuery

  // Check trial expiry
  let isExpired = false
  let expiredAt: string | null = null
  if (profile.role !== 'superadmin' && profile.brand_id) {
    const { data: sub } = await supabase
      .from('module_subscriptions')
      .select('status, trial_expires_at, expires_at')
      .eq('brand_id', profile.brand_id)
      .eq('module_key', 'surveys')
      .maybeSingle()
    if (sub?.status === 'expired') {
      isExpired = true
      expiredAt = sub.trial_expires_at ?? sub.expires_at ?? null
    }
  }

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Encuestas" expiredAt={expiredAt}>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Encuestas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crea y gestiona plantillas de encuesta de satisfacción</p>
        </div>
        <SurveyManager
          brands={brands || []}
          templates={templates || []}
          defaultBrandId={profile.brand_id || null}
        />
      </div>
    </TrialExpiredGate>
  )
}
