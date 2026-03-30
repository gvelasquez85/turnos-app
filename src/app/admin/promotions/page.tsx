import { createClient } from '@/lib/supabase/server'
import { PromotionsManager } from './PromotionsManager'

export default async function PromotionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user!.id).single()

  const estQuery = supabase.from('establishments').select('id, name').eq('active', true)
  if (profile?.role !== 'superadmin' && profile?.brand_id) estQuery.eq('brand_id', profile.brand_id)
  const { data: establishments } = await estQuery

  const { data: promotions } = await supabase
    .from('promotions')
    .select('*, establishments(name)')
    .in('establishment_id', (establishments || []).map(e => e.id))
    .order('created_at', { ascending: false })

  return <PromotionsManager establishments={establishments || []} promotions={promotions || []} />
}
