import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { dispatchWebhooks, type WebhookEvent } from '@/lib/webhooks'

/**
 * POST /api/internal/webhooks/dispatch
 * Called fire-and-forget from QueueBoard when a ticket changes status.
 * Authenticated via Supabase session (not API key).
 *
 * Body: { event: WebhookEvent, ticket_id: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event, ticket_id } = await req.json().catch(() => ({}))
  if (!event || !ticket_id) {
    return NextResponse.json({ error: 'event and ticket_id required' }, { status: 400 })
  }

  // Use service role to read ticket + establishment
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: ticket } = await service
    .from('tickets')
    .select('id, queue_number, customer_name, status, created_at, attended_at, establishment_id, establishments(name, brand_id), visit_reasons(name)')
    .eq('id', ticket_id)
    .single()

  if (!ticket) return NextResponse.json({ skipped: true })

  const brandId = (ticket.establishments as any)?.brand_id
  if (!brandId) return NextResponse.json({ skipped: true })

  dispatchWebhooks(brandId, event as WebhookEvent, {
    ticket_id: ticket.id,
    queue_number: ticket.queue_number,
    customer_name: ticket.customer_name,
    status: ticket.status,
    establishment_id: ticket.establishment_id,
    establishment_name: (ticket.establishments as any)?.name,
    visit_reason: (ticket.visit_reasons as any)?.name,
    created_at: ticket.created_at,
    attended_at: ticket.attended_at,
  }).catch(() => null)

  return NextResponse.json({ dispatched: true })
}
