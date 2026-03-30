import { createClient } from '@/lib/supabase/server'
import { AdvisorFieldsManager } from './AdvisorFieldsManager'

export default async function AdvisorFieldsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user!.id).single()

  const estQuery = supabase.from('establishments').select('id, name').eq('active', true)
  if (profile?.role !== 'superadmin' && profile?.brand_id) estQuery.eq('brand_id', profile.brand_id)
  const { data: establishments } = await estQuery

  const { data: fields } = await supabase
    .from('advisor_fields')
    .select('*, establishments(name)')
    .in('establishment_id', (establishments || []).map(e => e.id))
    .order('sort_order')

  return <AdvisorFieldsManager establishments={establishments || []} fields={fields || []} />
}
