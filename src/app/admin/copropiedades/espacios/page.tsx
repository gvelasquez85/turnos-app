import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import EspaciosManager from './EspaciosManager'

export default async function EspaciosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: spaces } = await supabase
    .from('copropiedad_spaces').select('*').eq('brand_id', brandId).order('name')

  const { data: reservations } = await supabase
    .from('copropiedad_reservations').select('*').eq('brand_id', brandId)
    .gte('reservation_date', new Date().toISOString().slice(0, 10))
    .order('reservation_date').limit(200)

  return <EspaciosManager brandId={brandId} spaces={spaces ?? []} reservations={reservations ?? []} />
}
