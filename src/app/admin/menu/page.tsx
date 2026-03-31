import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MenuBuilder } from './MenuBuilder'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'brand_admin', 'manager'].includes(profile.role)) redirect('/')

  const estQuery = supabase.from('establishments').select('id, name, brand_id, slug').eq('active', true).order('name')
  if (profile.role !== 'superadmin' && profile.brand_id) estQuery.eq('brand_id', profile.brand_id)
  const { data: establishments } = await estQuery

  const estIds = (establishments || []).map(e => e.id)
  let menus: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase
      .from('menus')
      .select('*, menu_categories(*, menu_items(*))')
      .in('establishment_id', estIds)
      .order('created_at')
    menus = data || []
  }

  // Pre-orders
  let preOrders: any[] = []
  if (estIds.length > 0) {
    const { data } = await supabase
      .from('pre_orders')
      .select('*')
      .in('establishment_id', estIds)
      .in('status', ['pending', 'received', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
    preOrders = data || []
  }

  return (
    <MenuBuilder
      establishments={establishments || []}
      menus={menus}
      preOrders={preOrders}
      defaultEstId={null}
    />
  )
}
