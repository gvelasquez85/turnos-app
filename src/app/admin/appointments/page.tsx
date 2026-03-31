import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentsManager } from './AppointmentsManager'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id, establishment_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'brand_admin', 'manager', 'advisor'].includes(profile.role)) redirect('/')

  // Brands
  const brandsQuery = supabase.from('brands').select('id, name').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) brandsQuery.eq('id', profile.brand_id)
  const { data: brands } = await brandsQuery

  // Establishments
  const estQuery = supabase.from('establishments').select('id, name, brand_id, slug').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) estQuery.eq('brand_id', profile.brand_id)
  if (profile.role === 'advisor' && profile.establishment_id) estQuery.eq('id', profile.establishment_id)
  const { data: establishments } = await estQuery

  // Visit reasons
  const brandIds = (brands || []).map(b => b.id)
  let visitReasons: { id: string; name: string; brand_id: string }[] = []
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('visit_reasons')
      .select('id, name, brand_id')
      .in('brand_id', brandIds)
      .eq('active', true)
      .order('name')
    visitReasons = data || []
  }

  // Advisors
  const advisorQuery = supabase.from('profiles').select('id, full_name, establishment_id').eq('role', 'advisor')
  if (profile.role !== 'superadmin' && profile.brand_id) advisorQuery.eq('brand_id', profile.brand_id)
  const { data: advisors } = await advisorQuery

  // Appointments for this week + 7 days
  const from = new Date(); from.setDate(from.getDate() - 1)
  const to = new Date(); to.setDate(to.getDate() + 14)
  const estIds = (establishments || []).map(e => e.id)

  let appointments: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase
      .from('appointments')
      .select('*, establishments(name), visit_reasons(name), profiles(full_name)')
      .in('establishment_id', estIds)
      .gte('scheduled_at', from.toISOString())
      .lte('scheduled_at', to.toISOString())
      .order('scheduled_at')
    appointments = data || []
  }

  return (
    <AppointmentsManager
      appointments={appointments}
      establishments={establishments || []}
      brands={brands || []}
      visitReasons={visitReasons}
      advisors={advisors || []}
      defaultBrandId={profile.brand_id || null}
      defaultEstId={profile.establishment_id || null}
    />
  )
}
