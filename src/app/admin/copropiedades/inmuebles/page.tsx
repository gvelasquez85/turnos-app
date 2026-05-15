import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import InmueblesManager from './InmueblesManager'

export default async function InmueblesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: units } = await supabase
    .from('copropiedad_units')
    .select('*')
    .eq('brand_id', brandId)
    .order('unit_number')

  const { data: config } = await supabase
    .from('copropiedad_configs').select('*').eq('brand_id', brandId).maybeSingle()

  return <InmueblesManager brandId={brandId} units={units ?? []} config={config} />
}
