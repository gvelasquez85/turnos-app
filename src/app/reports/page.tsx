import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsDashboard } from './ReportsDashboard'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, brand_id, establishment_id, brands(active_modules)').eq('id', user.id).single()

  const activeModules = (profile?.brands as any)?.active_modules || []

  // Load establishments the user can see (include brand_id for client-side filtering)
  const estQuery = supabase.from('establishments').select('id, name, brand_id').eq('active', true)
  if (profile?.role === 'advisor' && profile.establishment_id) {
    estQuery.eq('id', profile.establishment_id)
  } else if (profile?.role === 'brand_admin' && profile.brand_id) {
    estQuery.eq('brand_id', profile.brand_id)
  }
  const { data: establishments } = await estQuery

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Estadísticas de atención al cliente</p>
      </div>
      <ReportsDashboard establishments={establishments || []} activeModules={activeModules} />
    </div>
  )
}
