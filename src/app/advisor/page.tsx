import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueueBoard } from './QueueBoard'
import { EstablishmentPicker } from './EstablishmentPicker'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id, role, establishment_id')
    .eq('id', user.id)
    .single()

  // Check queue module subscription (required for advisor access)
  let isQueueExpired = false
  let queueExpiredAt: string | null = null
  if (profile?.role !== 'superadmin' && profile?.brand_id) {
    const { data: sub } = await supabase
      .from('module_subscriptions')
      .select('status, trial_expires_at, expires_at')
      .eq('brand_id', profile.brand_id)
      .eq('module_key', 'queue')
      .maybeSingle()
    if (!sub || sub.status === 'expired') {
      isQueueExpired = true
      queueExpiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
    }
  }

  // Cargar campos personalizados si hay establecimiento asignado fijo
  if (profile?.establishment_id) {
    const [{ data: advisorFields }, { data: establishment }] = await Promise.all([
      supabase
        .from('advisor_fields')
        .select('*')
        .eq('active', true)
        .order('sort_order'),
      supabase
        .from('establishments')
        .select('id, name, slug, brand_id')
        .eq('id', profile.establishment_id)
        .single(),
    ])

    return (
      <TrialExpiredGate isExpired={isQueueExpired} moduleLabel="Colas de espera" expiredAt={queueExpiredAt}>
        <QueueBoard
          establishmentId={profile.establishment_id}
          establishmentSlug={establishment?.slug || ''}
          advisorId={user.id}
          advisorFields={advisorFields || []}
        />
      </TrialExpiredGate>
    )
  }

  // brand_admin / superadmin sin establecimiento fijo → mostrar selector
  if (profile?.role === 'brand_admin' || profile?.role === 'superadmin') {
    // Cargar establecimientos accesibles
    const estQuery = supabase
      .from('establishments')
      .select('id, name, slug, brand_id, brands(name)')
      .eq('active', true)
      .order('name')

    if (profile.role === 'brand_admin' && profile.brand_id) {
      estQuery.eq('brand_id', profile.brand_id)
    }

    const { data: establishments } = await estQuery

    // Cargar todos los campos del brand
    const brandIds = [...new Set((establishments || []).map((e: any) => e.brand_id))]
    let allFields: any[] = []
    if (brandIds.length > 0) {
      const { data } = await supabase
        .from('advisor_fields')
        .select('*')
        .in('brand_id', brandIds)
        .eq('active', true)
        .order('sort_order')
      allFields = data || []
    }

    return (
      <TrialExpiredGate isExpired={isQueueExpired} moduleLabel="Colas de espera" expiredAt={queueExpiredAt}>
        <EstablishmentPicker
          establishments={(establishments || []) as any}
          allFields={allFields}
          advisorId={user.id}
        />
      </TrialExpiredGate>
    )
  }

  // Advisor sin establecimiento asignado
  return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-lg font-medium">Sin establecimiento asignado</p>
      <p className="text-sm mt-1">Contacta al administrador para asignarte un establecimiento.</p>
    </div>
  )
}
