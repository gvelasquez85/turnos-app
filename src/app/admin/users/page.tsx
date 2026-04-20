import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandUsersManager } from './BrandUsersManager'
import { getLimits } from '@/lib/planLimits'

export default async function BrandUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  // Solo brand_admin y superadmin gestionan usuarios de marca
  if (!profile || !['brand_admin', 'superadmin'].includes(profile.role)) redirect('/')

  // Superadmin sin marca asignada → usa superadmin/users
  if (profile.role === 'superadmin' && !profile.brand_id) redirect('/superadmin/users')

  const brandId = profile.brand_id!

  // Usar admin client para bypass de RLS — la autorización ya fue verificada arriba
  const admin = await createAdminClient()

  // Cargar usuarios de la marca (sin filtrar brand_admin para mostrarlos todos)
  const { data: users } = await admin
    .from('profiles')
    .select('*, establishments(name)')
    .eq('brand_id', brandId)
    .neq('role', 'superadmin')
    .order('created_at')

  // Cargar establecimientos de la marca
  const { data: establishments } = await admin
    .from('establishments')
    .select('id, name')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('name')

  const { data: membership } = await admin
    .from('memberships')
    .select('plan, max_advisors')
    .eq('brand_id', brandId)
    .single()

  const limits = getLimits(membership?.plan ?? 'free')
  const maxAdvisors = membership?.max_advisors ?? limits.maxAdvisors

  // Contar usuarios por sucursal para mostrar límite en la UI
  const estUserCounts: Record<string, number> = {}
  for (const u of users ?? []) {
    if (u.establishment_id && u.role !== 'brand_admin') {
      estUserCounts[u.establishment_id] = (estUserCounts[u.establishment_id] ?? 0) + 1
    }
  }

  // Calcular slots adicionales disponibles
  const numEst = establishments?.length ?? 1
  const includedSlots = numEst * 2
  const extraPaidSlots = Math.max(0, maxAdvisors - includedSlots)
  const currentAdvisors = (users ?? []).filter(u => u.role !== 'brand_admin' && u.role !== 'superadmin').length
  const currentExtraUsers = Math.max(0, currentAdvisors - includedSlots)
  const availableExtraSlots = Math.max(0, extraPaidSlots - currentExtraUsers)

  return (
    <BrandUsersManager
      users={users || []}
      establishments={establishments || []}
      brandId={brandId}
      maxAdvisors={maxAdvisors}
      estUserCounts={estUserCounts}
      availableExtraSlots={availableExtraSlots}
    />
  )
}
