/**
 * GET /api/espera/[ticketId]
 * Endpoint público para polling de sala de espera.
 * Usa service role para bypasear RLS — la página /espera no tiene sesión.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ticket, error } = await service
    .from('tickets')
    .select('id, status, queue_number, establishment_id')
    .eq('id', ticketId)
    .single()

  if (error || !ticket) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const { count: ahead } = await service
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('establishment_id', ticket.establishment_id)
    .eq('status', 'waiting')
    .lt('queue_number', ticket.queue_number)

  return NextResponse.json(
    { status: ticket.status, ahead: ahead ?? 0 },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
