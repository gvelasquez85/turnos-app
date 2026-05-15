import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId, checkModuleAccess } from '@/lib/serverBrandContext'
import CuotasManager from './CuotasManager'

export default async function CuotasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: units } = await supabase
    .from('copropiedad_units').select('id, unit_number, coeficiente, owner_name, owner_email')
    .eq('brand_id', brandId).eq('is_active', true).order('unit_number')

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const { data: fees } = await supabase
    .from('copropiedad_fees').select('*')
    .eq('brand_id', brandId).order('period', { ascending: false }).limit(500)

  return <CuotasManager brandId={brandId} units={units ?? []} fees={fees ?? []} currentPeriod={currentPeriod} />
}
