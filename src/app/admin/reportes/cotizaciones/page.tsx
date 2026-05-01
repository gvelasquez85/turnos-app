import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { ReporteCotizaciones } from './ReporteCotizaciones'

export default async function ReporteCotizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const since90 = new Date(Date.now() - 90 * 86400000).toISOString()
  const [quotesRes, quoteItemsRes] = await Promise.allSettled([
    supabase.from('sales')
      .select('id, status, total, created_at, customers(name)')
      .eq('brand_id', brandId).eq('type', 'quote')
      .gte('created_at', since90)
      .order('created_at', { ascending: false }),
    supabase.from('sale_items')
      .select('product_name, qty, line_total, sales!inner(brand_id, type)')
      .eq('sales.brand_id', brandId).eq('sales.type', 'quote'),
  ])

  const quotes = quotesRes.status === 'fulfilled' ? (quotesRes.value.data ?? []) : []
  const quoteItems = quoteItemsRes.status === 'fulfilled' ? (quoteItemsRes.value.data ?? []) : []

  return <ReporteCotizaciones quotes={quotes as any[]} quoteItems={quoteItems as any[]} />
}
