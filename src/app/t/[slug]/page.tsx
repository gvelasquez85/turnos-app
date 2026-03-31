import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerFlow } from './CustomerFlow'

export default async function TicketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar establecimiento por slug
  const { data: establishment } = await supabase
    .from('establishments')
    .select('*, brands(name, logo_url)')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!establishment) notFound()

  // Cargar motivos de visita activos (por marca)
  const { data: visitReasons } = await supabase
    .from('visit_reasons')
    .select('*')
    .eq('brand_id', (establishment as any).brand_id)
    .eq('active', true)
    .order('sort_order')

  // Cargar promociones vigentes
  const now = new Date().toISOString()
  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('establishment_id', establishment.id)
    .eq('active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)

  return (
    <CustomerFlow
      establishment={establishment as any}
      visitReasons={visitReasons || []}
      promotions={promotions || []}
    />
  )
}
