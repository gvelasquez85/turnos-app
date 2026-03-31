import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BookingForm } from './BookingForm'

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: est } = await supabase
    .from('establishments')
    .select('*, brands(name, logo_url)')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!est) notFound()

  const { data: reasons } = await supabase
    .from('visit_reasons')
    .select('id, name, description')
    .eq('brand_id', (est as any).brands ? (est as any).brand_id : '')
    .eq('active', true)
    .order('sort_order')

  return (
    <BookingForm
      establishment={est as any}
      visitReasons={reasons || []}
    />
  )
}
