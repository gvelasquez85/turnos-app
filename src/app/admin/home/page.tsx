import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { NoBrandContext } from '@/components/NoBrandContext'
import { HomePanel } from './HomePanel'

export default async function HomeDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id, full_name').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayStr = todayStart.toISOString()
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString()
  const since60 = new Date(Date.now() - 60 * 86400000).toISOString()

  const [brandRes, salesTodayRes, salesWeekRes, inactiveClientsRes,
         openQuotesRes, lowStockRes, totalClientsRes] = await Promise.allSettled([
    // Brand info
    supabase.from('brands')
      .select('id, name, business_type, onboarding_completed, primary_color')
      .eq('id', brandId).single(),

    // Ventas de HOY — mismos status que VentasDashboard (completed/completado/entregado)
    supabase.from('sales')
      .select('id, total, status, type, created_at')
      .eq('brand_id', brandId).eq('type', 'sale')
      .in('status', ['completed', 'completado', 'entregado'])
      .gte('created_at', todayStr),

    // Ventas de los últimos 7 días — mismos status
    supabase.from('sales')
      .select('id, total, created_at')
      .eq('brand_id', brandId).eq('type', 'sale')
      .in('status', ['completed', 'completado', 'entregado'])
      .gte('created_at', since7),

    // Clientes inactivos > 30 días (tienen historial de compra pero no reciente)
    supabase.from('customers')
      .select('id, name, phone, updated_at, created_at')
      .eq('brand_id', brandId)
      .lt('updated_at', since30)
      .not('phone', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(10),

    // Cotizaciones abiertas sin respuesta > 2 días
    supabase.from('sales')
      .select('id, total, created_at, customers(name)')
      .eq('brand_id', brandId).eq('type', 'quote')
      .in('status', ['draft', 'sent'])
      .lt('created_at', new Date(Date.now() - 2 * 86400000).toISOString())
      .order('created_at', { ascending: true })
      .limit(8),

    // Productos con stock bajo (stock > 0 but <= stock_min or stock <= 3)
    supabase.from('products')
      .select('id, name, stock, stock_min')
      .eq('brand_id', brandId)
      .eq('product_type', 'physical')
      .gt('stock', 0)
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(5),

    // Total clientes activos
    supabase.from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId),
  ])

  const brand = brandRes.status === 'fulfilled' ? brandRes.value.data : null
  const salesToday = salesTodayRes.status === 'fulfilled' ? (salesTodayRes.value.data ?? []) : []
  const salesWeek = salesWeekRes.status === 'fulfilled' ? (salesWeekRes.value.data ?? []) : []
  const inactiveClients = inactiveClientsRes.status === 'fulfilled' ? (inactiveClientsRes.value.data ?? []) : []
  const openQuotes = openQuotesRes.status === 'fulfilled' ? (openQuotesRes.value.data ?? []) : []
  const lowStock = lowStockRes.status === 'fulfilled' ? (lowStockRes.value.data ?? []) : []
  const totalClients = totalClientsRes.status === 'fulfilled' ? (totalClientsRes.value.count ?? 0) : 0

  // Revenue today
  const revenueToday = salesToday.reduce((s: number, v: any) => s + (v.total ?? 0), 0)
  const revenueWeek = salesWeek.reduce((s: number, v: any) => s + (v.total ?? 0), 0)
  const countToday = salesToday.length

  return (
    <HomePanel
      brandName={(brand as any)?.name ?? ''}
      businessType={(brand as any)?.business_type ?? 'otros'}
      primaryColor={(brand as any)?.primary_color ?? '#6366f1'}
      userName={profile.full_name ?? user.email ?? ''}
      revenueToday={revenueToday}
      revenueWeek={revenueWeek}
      countToday={countToday}
      totalClients={totalClients}
      inactiveClients={inactiveClients as any[]}
      openQuotes={openQuotes as any[]}
      lowStock={lowStock as any[]}
    />
  )
}
