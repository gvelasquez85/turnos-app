import { createClient } from '@supabase/supabase-js'

export type WebhookEvent = 'ticket.created' | 'ticket.attended' | 'ticket.done' | 'ticket.cancelled'

interface TicketPayload {
  ticket_id: string
  queue_number: string
  customer_name: string
  status: string
  establishment_id: string
  establishment_name?: string
  visit_reason?: string
  created_at: string
  attended_at?: string | null
}

/**
 * Fire-and-forget: dispatches all active webhook URLs configured for
 * (brand_id, event) with a standard JSON payload.
 * Uses service role so it works from both server routes and internal endpoints.
 */
export async function dispatchWebhooks(
  brandId: string,
  event: WebhookEvent,
  ticket: TicketPayload,
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select('id, url')
    .eq('brand_id', brandId)
    .eq('event', event)
    .eq('active', true)

  if (!endpoints?.length) return

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    brand_id: brandId,
    data: ticket,
  })

  await Promise.allSettled(
    endpoints.map(ep =>
      fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(8000),
      }).catch(() => null), // never throw — webhooks are best-effort
    ),
  )
}
