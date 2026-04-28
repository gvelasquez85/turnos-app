import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { ReporteVentas } from './ReporteVentas'

export default async function ReporteVentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  if (!profile.brand_id) return <NoBrandContext />

  const brandId = profile.brand_id as string

  const [salesRes, estRes] = await Promise.allSettled([
    supabase.from('sales')
      .select('id, type, status, total, subtotal, discount, created_at, establishment_id, customer_id, customers(name)')
      .eq('brand_id', brandId).eq('type', 'sale').order('created_at', { ascending: false }),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const sales = salesRes.status === 'fulfilled' ? (salesRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return <ReporteVentas sales={sales as any[]} establishments={establishments} />
}
