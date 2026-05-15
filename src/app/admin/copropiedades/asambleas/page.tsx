import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import AsambleasManager from './AsambleasManager'

export default async function AsambleasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: meetings } = await supabase
    .from('copropiedad_meetings').select('*').eq('brand_id', brandId)
    .order('scheduled_date', { ascending: false }).limit(50)

  const { data: units } = await supabase
    .from('copropiedad_units').select('id, unit_number, coeficiente, owner_name')
    .eq('brand_id', brandId).eq('is_active', true).order('unit_number')

  return <AsambleasManager brandId={brandId} meetings={meetings ?? []} units={units ?? []} />
}
