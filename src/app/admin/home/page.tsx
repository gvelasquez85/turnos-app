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

  // Fetch sales for the last 48 h (2 days) so timezone offsets don't cut off "today's" sales.
  // HomePanel is a client component and will filter to "today" using browser-local time,
  // exactly like VentasDashboard does with toDateString().
  const since48h  = new Date(Date.now() - 48 * 3600000).toISOString()
  const since7d   = new Date(Date.now() - 7  * 86400000).toISOString()
  const since30d  = new Date(Date.now() - 30 * 86400000).toISOString()

  const [brandRes, salesRecentRes, salesWeekRes, inactiveClientsRes,
         openQuotesRes, lowStockRes, totalClientsRes] = await Promise.allSettled([

    supabase.from('brands')
      .select('id, name, business_type, onboarding_completed, primary_color')
      .eq('id', brandId).single(),

    // Last 48 h — all non-cancelled (client will filter to today in browser timezone)
    supabase.from('sales')
      .select('id, total, status, type, created_at')
      .eq('brand_id', brandId).eq('type', 'sale')
      .neq('status', 'cancelled')
      .gte('created_at', since48h),

    // Last 7 days — all non-cancelled
    supabase.from('sales')
      .select('id, total, status, created_at')
      .eq('brand_id', brandId).eq('type', 'sale')
      .neq('status', 'cancelled')
      .gte('created_at', since7d),

    // Clientes inactivos > 30 días
    supabase.from('customers')
      .select('id, name, phone, updated_at')
      .eq('brand_id', brandId)
      .lt('updated_at', since30d)
      .not('phone', 'is', null)
      .order('updated_at', { ascending: true })
      .limit(10),

    // Cotizaciones abiertas > 2 días sin respuesta
    supabase.from('sales')
      .select('id, total, created_at, customers(name)')
      .eq('brand_id', brandId).eq('type', 'quote')
      .in('status', ['draft', 'sent'])
      .lt('created_at', new Date(Date.now() - 2 * 86400000).toISOString())
      .order('created_at', { ascending: true })
      .limit(8),

    // Productos con stock bajo
    supabase.from('products')
      .select('id, name, stock, stock_min')
      .eq('brand_id', brandId)
      .eq('product_type', 'physical')
      .gt('stock', 0)
      .lte('stock', 5)
      .order('stock', { ascending: true })
      .limit(5),

    // Total clientes
    supabase.from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId),
  ])

  // ── Appointments module ─────────────────────────────────────────────────────
  const { data: apptSub } = brandId
    ? await supabase.from('module_subscriptions')
        .select('status')
        .eq('brand_id', brandId)
        .eq('module_key', 'appointments')
        .in('status', ['active', 'trial', 'trialing'])
        .maybeSingle()
    : { data: null }
  const hasAppointments = !!apptSub

  let appointments: { id: string; status: string; scheduled_at: string; customer_name: string }[] = []
  if (hasAppointments) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const weekEnd    = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7)

    const { data: ests } = await supabase.from('establishments')
      .select('id').eq('brand_id', brandId).eq('active', true)
    const estIds = (ests ?? []).map((e: { id: string }) => e.id)

    const apptData = estIds.length > 0
      ? await supabase.from('appointments')
          .select('id, status, scheduled_at, customer_name')
          .in('establishment_id', estIds)
          .gte('scheduled_at', todayStart.toISOString())
          .lte('scheduled_at', weekEnd.toISOString())
          .order('scheduled_at')
      : { data: [] }
    appointments = (apptData.data ?? []) as typeof appointments
  }

  const brand          = brandRes.status === 'fulfilled' ? brandRes.value.data : null
  const salesRecent    = salesRecentRes.status === 'fulfilled' ? (salesRecentRes.value.data ?? []) : []
  const salesWeek      = salesWeekRes.status === 'fulfilled' ? (salesWeekRes.value.data ?? []) : []
  const inactiveClients = inactiveClientsRes.status === 'fulfilled' ? (inactiveClientsRes.value.data ?? []) : []
  const openQuotes     = openQuotesRes.status === 'fulfilled' ? (openQuotesRes.value.data ?? []) : []
  const lowStock       = lowStockRes.status === 'fulfilled' ? (lowStockRes.value.data ?? []) : []
  const totalClients   = totalClientsRes.status === 'fulfilled' ? (totalClientsRes.value.count ?? 0) : 0

  return (
    <HomePanel
      brandName={(brand as any)?.name ?? ''}
      businessType={(brand as any)?.business_type ?? 'otros'}
      primaryColor={(brand as any)?.primary_color ?? '#6366f1'}
      userName={profile.full_name ?? user.email ?? ''}
      salesRecent={salesRecent as any[]}
      salesWeek={salesWeek as any[]}
      totalClients={totalClients}
      inactiveClients={inactiveClients as any[]}
      openQuotes={openQuotes as any[]}
      lowStock={lowStock as any[]}
      hasAppointments={hasAppointments}
      appointments={appointments}
    />
  )
}
