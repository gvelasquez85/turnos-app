import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { ReportsDashboard } from '@/app/reports/ReportsDashboard'

export default async function ReporteAtencionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, establishment_id, brands(active_modules)')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) redirect('/admin')
  if (profile.role === 'superadmin' && !profile.brand_id) redirect('/superadmin')

  const brandId = profile.brand_id as string

  // Check queue module
  let isExpired = false, expiredAt: string | null = null
  const { data: sub } = await supabase.from('module_subscriptions')
    .select('status, trial_expires_at, expires_at')
    .eq('brand_id', brandId).eq('module_key', 'queue').maybeSingle()
  if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
    isExpired = true; expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
  }

  const moduleObj: Record<string, boolean> = (profile?.brands as any)?.active_modules || {}
  const activeModules = Object.keys(moduleObj).filter(k => moduleObj[k] === true)

  const { data: establishments } = await supabase
    .from('establishments').select('id, name, brand_id')
    .eq('brand_id', brandId).eq('active', true)

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Colas de espera" expiredAt={expiredAt}>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reportes de atención</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estadísticas de colas de espera</p>
        </div>
        <ReportsDashboard establishments={establishments ?? []} activeModules={activeModules} />
      </div>
    </TrialExpiredGate>
  )
}
