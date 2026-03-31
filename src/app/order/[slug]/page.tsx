import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderFlow } from './OrderFlow'

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: est } = await supabase
    .from('establishments')
    .select('id, name, brand_id, brands(name, logo_url)')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!est) notFound()

  const { data: menu } = await supabase
    .from('menus')
    .select('*, menu_categories(*, menu_items(*))')
    .eq('establishment_id', est.id)
    .eq('active', true)
    .order('created_at')
    .limit(1)
    .single()

  return (
    <OrderFlow
      establishment={est as any}
      menu={menu as any}
    />
  )
}
