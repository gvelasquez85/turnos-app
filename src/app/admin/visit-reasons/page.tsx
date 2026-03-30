import { createClient } from '@/lib/supabase/server'
import { VisitReasonsManager } from './VisitReasonsManager'

export default async function VisitReasonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('brand_id, establishment_id, role').eq('id', user!.id).single()

  const estQuery = supabase.from('establishments').select('id, name').eq('active', true)
  if (profile?.role !== 'superadmin' && profile?.brand_id) estQuery.eq('brand_id', profile.brand_id)
  const { data: establishments } = await estQuery

  const { data: reasons } = await supabase
    .from('visit_reasons')
    .select('*, establishments(name)')
    .in('establishment_id', (establishments || []).map(e => e.id))
    .order('sort_order')

  return <VisitReasonsManager establishments={establishments || []} reasons={reasons || []} />
}
