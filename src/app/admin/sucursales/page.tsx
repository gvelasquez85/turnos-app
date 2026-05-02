import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EstablishmentsManager } from '../EstablishmentsManager'
import { getLimits } from '@/lib/planLimits'
import { getVerifiedActiveModules } from '@/lib/serverBrandContext'

export default async function SucursalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('brand_id, role, brands(active_modules)').eq('id', user.id).single()

  if (!profile) redirect('/login')

  const query = supabase.from('establishments').select('*').order('created_at')
  if (profile.role !== 'superadmin' && profile.brand_id) {
    query.eq('brand_id', profile.brand_id)
  }
  const { data: establishments } = await query

  const brandId = (profile as any).brand_id
  const activeModules = brandId
    ? await getVerifiedActiveModules(supabase, brandId, (profile as any).brands?.active_modules ?? null)
    : null

  // Only fetch queue stats if brand has queue module active
  const hasQueue = !!(activeModules?.queue)

  const estIds = (establishments || []).map((e: any) => e.id)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let ticketStats: Record<string, { waiting: number; today: number }> = {}
  if (hasQueue && estIds.length > 0) {
    const { data: stats } = await supabase
      .from('tickets')
      .select('establishment_id, status, created_at')
      .in('establishment_id', estIds)
      .or(`status.in.(waiting,in_progress),and(status.eq.done,created_at.gte.${todayStart.toISOString()})`)
    for (const t of stats || []) {
      if (!ticketStats[t.establishment_id]) ticketStats[t.establishment_id] = { waiting: 0, today: 0 }
      if (t.status === 'waiting' || t.status === 'in_progress') ticketStats[t.establishment_id].waiting++
      if (t.status === 'done') ticketStats[t.establishment_id].today++
    }
  }

  const { data: brands } = await supabase.from('brands').select('id, name, slug').eq('active', true)

  const { data: membership } = brandId
    ? await supabase.from('memberships').select('plan, max_establishments, max_advisors')
        .eq('brand_id', brandId).single()
    : { data: null }

  const limits = getLimits((membership as any)?.plan ?? 'free')
  const maxEstablishments = (membership as any)?.max_establishments ?? limits.maxEstablishments

  return (
    <EstablishmentsManager
      establishments={establishments || []}
      brands={brands || []}
      defaultBrandId={brandId || null}
      ticketStats={ticketStats}
      hasQueue={hasQueue}
      isSuperAdmin={profile.role === 'superadmin'}
      maxEstablishments={maxEstablishments}
    />
  )
}
