import { createClient } from '@/lib/supabase/server'
import { EstablishmentsManager } from './EstablishmentsManager'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user!.id).single()

  const query = supabase.from('establishments').select('*').order('created_at')
  if (profile?.role !== 'superadmin' && profile?.brand_id) {
    query.eq('brand_id', profile.brand_id)
  }
  const { data: establishments } = await query

  // Stats de tickets: en espera + atendidos hoy por establecimiento
  const estIds = (establishments || []).map(e => e.id)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  let ticketStats: Record<string, { waiting: number; today: number }> = {}
  if (estIds.length > 0) {
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

  // For superadmin, load all brands (including slug for auto-prefixing establishment slugs)
  const { data: brands } = await supabase.from('brands').select('id, name, slug').eq('active', true)

  return (
    <EstablishmentsManager
      establishments={establishments || []}
      brands={brands || []}
      defaultBrandId={profile?.brand_id || null}
      ticketStats={ticketStats}
      isSuperAdmin={profile?.role === 'superadmin'}
    />
  )
}
