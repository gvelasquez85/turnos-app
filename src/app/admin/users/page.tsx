import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandUsersManager } from './BrandUsersManager'

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

  // Cargar usuarios de la marca
  const { data: users } = await supabase
    .from('profiles')
    .select('*, establishments(name)')
    .eq('brand_id', brandId)
    .neq('role', 'brand_admin')   // brand_admin lo gestiona el superadmin
    .neq('role', 'superadmin')
    .order('created_at')

  // Cargar establecimientos de la marca
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, name')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('name')

  return (
    <BrandUsersManager
      users={users || []}
      establishments={establishments || []}
      brandId={brandId}
    />
  )
}
