import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'
import { dispatchWebhooks } from '@/lib/webhooks'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/tickets
 * List tickets for the brand. All query params optional.
 *
 * Query params:
 *   status         waiting | in_progress | done | cancelled  (default: waiting,in_progress)
 *   establishment  establishment_id UUID
 *   limit          max results (default 50, max 200)
 *   offset         pagination offset (default 0)
 *
 * Response 200:
 * {
 *   "data": [ { ticket } ],
 *   "count": 12,
 *   "limit": 50,
 *   "offset": 0
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') ?? 'waiting,in_progress'
  const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
  const establishmentId = searchParams.get('establishment') ?? null
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // First get brand's establishment ids if no specific one given
  let estIds: string[] = []
  if (establishmentId) {
    estIds = [establishmentId]
  } else {
    const { data: ests } = await supabase
      .from('establishments')
      .select('id')
      .eq('brand_id', auth.brandId)
      .eq('active', true)
    estIds = (ests ?? []).map((e: any) => e.id)
  }

  if (!estIds.length) {
    return NextResponse.json({ data: [], count: 0, limit, offset }, { headers: API_CORS_HEADERS })
  }

  const query = supabase
    .from('tickets')
    .select('id, queue_number, customer_name, status, created_at, attended_at, establishment_id, establishments(name), visit_reasons(name)', { count: 'exact' })
    .in('establishment_id', estIds)
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: API_CORS_HEADERS })
  }

  const formatted = (data ?? []).map((t: any) => ({
    id: t.id,
    queue_number: t.queue_number,
    customer_name: t.customer_name,
    status: t.status,
    establishment_id: t.establishment_id,
    establishment_name: t.establishments?.name ?? null,
    visit_reason: t.visit_reasons?.name ?? null,
    created_at: t.created_at,
    attended_at: t.attended_at ?? null,
  }))

  return NextResponse.json({ data: formatted, count: count ?? 0, limit, offset }, { headers: API_CORS_HEADERS })
}

/**
 * POST /api/v1/tickets
 * Create a new ticket programmatically (e.g. from a kiosk, web form, Zapier).
 *
 * Body:
 * {
 *   "establishment_id": "uuid",          required
 *   "customer_name": "Juan Pérez",       required
 *   "visit_reason_id": "uuid",           optional
 *   "notes": "..."                       optional
 * }
 *
 * Response 201: { "data": { ticket } }
 */
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: API_CORS_HEADERS })

  const { establishment_id, customer_name, visit_reason_id, notes } = body

  if (!establishment_id || !customer_name) {
    return NextResponse.json(
      { error: 'establishment_id and customer_name are required' },
      { status: 400, headers: API_CORS_HEADERS },
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify establishment belongs to brand
  const { data: est } = await supabase
    .from('establishments')
    .select('id, name, brand_id')
    .eq('id', establishment_id)
    .eq('brand_id', auth.brandId)
    .single()

  if (!est) {
    return NextResponse.json(
      { error: 'Establishment not found or does not belong to your brand' },
      { status: 404, headers: API_CORS_HEADERS },
    )
  }

  // Generate queue number: next sequential for this establishment today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('establishment_id', establishment_id)
    .gte('created_at', todayStart.toISOString())

  const queueNumber = String((count ?? 0) + 1).padStart(3, '0')

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      establishment_id,
      customer_name: customer_name.trim(),
      queue_number: queueNumber,
      status: 'waiting',
      visit_reason_id: visit_reason_id ?? null,
      notes: notes ?? null,
    })
    .select('id, queue_number, customer_name, status, created_at, establishment_id')
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500, headers: API_CORS_HEADERS })
  }

  // Dispatch ticket.created webhook fire-and-forget
  dispatchWebhooks(auth.brandId, 'ticket.created', {
    ticket_id: ticket.id,
    queue_number: ticket.queue_number,
    customer_name: ticket.customer_name,
    status: ticket.status,
    establishment_id: ticket.establishment_id,
    establishment_name: est.name,
    created_at: ticket.created_at,
  }).catch(() => null)

  return NextResponse.json({ data: ticket }, { status: 201, headers: API_CORS_HEADERS })
}
