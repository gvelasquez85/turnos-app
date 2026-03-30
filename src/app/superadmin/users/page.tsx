import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UsersManager } from './UsersManager'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*, brands(name), establishments(name)')
    .order('created_at', { ascending: false })

  const { data: brands } = await supabase.from('brands').select('id, name').eq('active', true)
  const { data: establishments } = await supabase.from('establishments').select('id, name, brand_id').eq('active', true)

  return <UsersManager users={users || []} brands={brands || []} establishments={establishments || []} />
}
