import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/tickets/:id
 * Get a single ticket by ID. Must belong to the authenticated brand.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, queue_number, customer_name, status, created_at, attended_at, establishment_id, establishments(name, brand_id), visit_reasons(name)')
    .eq('id', id)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404, headers: API_CORS_HEADERS })
  }

  if ((ticket.establishments as any)?.brand_id !== auth.brandId) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404, headers: API_CORS_HEADERS })
  }

  return NextResponse.json({
    data: {
      id: ticket.id,
      queue_number: ticket.queue_number,
      customer_name: ticket.customer_name,
      status: ticket.status,
      establishment_id: ticket.establishment_id,
      establishment_name: (ticket.establishments as any)?.name ?? null,
      visit_reason: (ticket.visit_reasons as any)?.name ?? null,
      created_at: ticket.created_at,
      attended_at: ticket.attended_at ?? null,
    },
  }, { headers: API_CORS_HEADERS })
}
