import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { CRMDashboard } from './CRMDashboard'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const [customersRes, establishmentsRes] = await Promise.allSettled([
    supabase
      .from('customers')
      .select('id, name, phone, email, document_id, first_visit_at, last_visit_at, total_visits, establishment_ids, celular, canal_contacto, ultima_compra, intereses, cumpleanos')
      .eq('brand_id', brandId)
      .order('last_visit_at', { ascending: false }),
    supabase
      .from('establishments')
      .select('id, name')
      .eq('brand_id', brandId)
      .eq('active', true)
      .order('name'),
  ])

  const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data ?? []) : []
  const establishments = establishmentsRes.status === 'fulfilled' ? (establishmentsRes.value.data ?? []) : []

  return (
    <CRMDashboard
      customers={customers as any[]}
      establishments={establishments ?? []}
      brandId={brandId}
    />
  )
}
