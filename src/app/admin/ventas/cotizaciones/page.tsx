import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { CotizacionesManager } from './CotizacionesManager'

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const [quotesRes, estRes, brandRes, waRes, waDefaultRes] = await Promise.allSettled([
    supabase.from('sales')
      .select('id, status, total, subtotal, discount, created_at, establishment_id, customer_id, notes, sent_at, sent_to_email, opened_at, customers(name, email, phone)')
      .eq('brand_id', brandId).eq('type', 'quote')
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
    supabase.from('brands').select('name').eq('id', brandId).single(),
    supabase.from('wa_templates').select('category, body').eq('brand_id', brandId),
    supabase.from('wa_default_templates').select('category, body'),
  ])

  const quotes = quotesRes.status === 'fulfilled' ? (quotesRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []
  const brandName = brandRes.status === 'fulfilled' ? (brandRes.value as any).data?.name ?? '' : ''
  const waDefaultMap = Object.fromEntries((waDefaultRes.status === 'fulfilled' ? waDefaultRes.value.data ?? [] : []).map((d: any) => [d.category, d.body]))
  const waBrandMap   = Object.fromEntries((waRes.status === 'fulfilled' ? waRes.value.data ?? [] : []).map((t: any) => [t.category, t.body]))
  const waTemplates = Object.entries({ ...waDefaultMap, ...waBrandMap }).map(([category, body]) => ({ category, body: body as string }))

  return <CotizacionesManager brandId={brandId} quotes={quotes as any[]} establishments={establishments} waTemplates={waTemplates} brandName={brandName} />
}
