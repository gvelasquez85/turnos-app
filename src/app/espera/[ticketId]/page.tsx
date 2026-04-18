import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WaitingRoom } from './WaitingRoom'

export default async function WaitingPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  const supabase = await createAdminClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, queue_number, customer_name, status, establishment_id, establishments(name, brands(name, primary_color))')
    .eq('id', ticketId)
    .single()

  if (!ticket) notFound()

  const est = (ticket.establishments as any)
  const brand = est?.brands

  // Posición inicial en la cola: tickets en espera con número menor
  const { count: ahead } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('establishment_id', ticket.establishment_id)
    .eq('status', 'waiting')
    .lt('queue_number', ticket.queue_number)

  return (
    <WaitingRoom
      ticket={{
        id: ticket.id,
        queue_number: ticket.queue_number,
        customer_name: ticket.customer_name,
        status: ticket.status as any,
        establishment_id: ticket.establishment_id,
        establishment_name: est?.name ?? '',
        brand_name: brand?.name ?? '',
        brand_color: brand?.primary_color ?? '#6366f1',
      }}
      initialAhead={ahead ?? 0}
    />
  )
}
