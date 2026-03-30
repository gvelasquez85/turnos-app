import { createClient } from '@/lib/supabase/server'
import { BrandsManager } from './BrandsManager'

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('*, establishments(count)').order('created_at', { ascending: false })
  return <BrandsManager brands={brands || []} />
}
