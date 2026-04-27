import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { ReporteClientes } from './ReporteClientes'

export default async function ReporteClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  if (!profile.brand_id) return <NoBrandContext />

  const brandId = profile.brand_id as string

  const [customersRes, estRes] = await Promise.allSettled([
    supabase.from('customers')
      .select('id, name, total_visits, first_visit_at, last_visit_at, establishment_ids')
      .eq('brand_id', brandId).order('created_at', { ascending: false }),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return <ReporteClientes customers={customers as any[]} establishments={establishments} />
}
