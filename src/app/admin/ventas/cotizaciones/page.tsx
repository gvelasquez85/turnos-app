import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { CotizacionesManager } from './CotizacionesManager'

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  if (!profile.brand_id) return <NoBrandContext />

  const brandId = profile.brand_id as string

  const [quotesRes, estRes] = await Promise.allSettled([
    supabase.from('sales')
      .select('id, status, total, created_at, establishment_id, customer_id, notes, customers(name)')
      .eq('brand_id', brandId).eq('type', 'quote')
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const quotes = quotesRes.status === 'fulfilled' ? (quotesRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return <CotizacionesManager brandId={brandId} quotes={quotes as any[]} establishments={establishments} />
}
