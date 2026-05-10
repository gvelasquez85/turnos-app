import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { VentasDashboard } from './VentasDashboard'

export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const since = new Date(Date.now() - 30 * 86400000).toISOString()

  const SALE_FIELDS = 'id, type, status, total, subtotal, discount, notes, fulfillment_type, source_quote_id, created_at, establishment_id, customer_id, customers(name, email, phone)'

  const [salesRes, estRes, pendingRes, brandRes, waRes, waDefaultRes] = await Promise.allSettled([
    supabase.from('sales')
      .select(SALE_FIELDS)
      .eq('brand_id', brandId).eq('type', 'sale').gte('created_at', since)
      .order('created_at', { ascending: false }).limit(50),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
    supabase.from('sales')
      .select(SALE_FIELDS)
      .eq('brand_id', brandId).eq('type', 'sale').eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase.from('brands').select('name').eq('id', brandId).single(),
    supabase.from('wa_templates').select('category, body').eq('brand_id', brandId),
    supabase.from('wa_default_templates').select('category, body'),
  ])

  // Fallback query if fulfillment_type column doesn't exist yet (migration not run)
  let recentSales: any[] = salesRes.status === 'fulfilled' ? (salesRes.value.data ?? []) : []
  let pendingSales: any[] = pendingRes.status === 'fulfilled' ? (pendingRes.value.data ?? []) : []

  if (salesRes.status === 'rejected' || (salesRes.status === 'fulfilled' && salesRes.value.error)) {
    const FALLBACK = 'id, type, status, total, subtotal, discount, notes, source_quote_id, created_at, establishment_id, customer_id, customers(name, email, phone)'
    const [fb1, fb2] = await Promise.allSettled([
      supabase.from('sales').select(FALLBACK).eq('brand_id', brandId).eq('type', 'sale').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      supabase.from('sales').select(FALLBACK).eq('brand_id', brandId).eq('type', 'sale').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    recentSales = fb1.status === 'fulfilled' ? (fb1.value.data ?? []) : []
    pendingSales = fb2.status === 'fulfilled' ? (fb2.value.data ?? []) : []
  }

  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []
  const brandName = brandRes.status === 'fulfilled' ? (brandRes.value as any).data?.name ?? '' : ''
  const waDefaultMap = Object.fromEntries((waDefaultRes.status === 'fulfilled' ? waDefaultRes.value.data ?? [] : []).map((d: any) => [d.category, d.body]))
  const waBrandMap   = Object.fromEntries((waRes.status === 'fulfilled' ? waRes.value.data ?? [] : []).map((t: any) => [t.category, t.body]))
  const waTemplates = Object.entries({ ...waDefaultMap, ...waBrandMap }).map(([category, body]) => ({ category, body: body as string }))

  return <VentasDashboard brandId={brandId} recentSales={recentSales as any[]} pendingSales={pendingSales as any[]} establishments={establishments} waTemplates={waTemplates} brandName={brandName} />
}
