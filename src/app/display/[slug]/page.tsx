import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DisplayScreen } from './DisplayScreen'

export default async function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: est } = await supabase
    .from('establishments')
    .select('*, brands(name, logo_url), display_configs(*)')
    .eq('slug', slug)
    .single()

  if (!est) notFound()

  // Get active promotions
  const { data: promos } = await supabase
    .from('promotions')
    .select('*')
    .eq('establishment_id', est.id)
    .eq('active', true)
    .order('created_at')

  return (
    <DisplayScreen
      establishment={est as any}
      config={(est as any).display_configs?.[0] ?? null}
      promotions={promos || []}
    />
  )
}
