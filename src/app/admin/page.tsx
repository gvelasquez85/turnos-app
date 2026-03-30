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

  // For superadmin, load all brands
  const { data: brands } = await supabase.from('brands').select('id, name').eq('active', true)

  return (
    <EstablishmentsManager
      establishments={establishments || []}
      brands={brands || []}
      defaultBrandId={profile?.brand_id || null}
    />
  )
}
