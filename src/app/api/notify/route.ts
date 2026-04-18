import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getServiceAccount, sendFCMMessage } from '@/lib/fcm'

export async function POST(req: NextRequest) {
  const { ticketId } = await req.json()
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 })

  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, queue_number, customer_name, push_subscription, customer_email, establishment_id, establishments(name)')
    .eq('id', ticketId)
    .single()

  if (!ticket) return NextResponse.json({ error: 'ticket not found' }, { status: 404 })

  const establishmentName = (ticket.establishments as any)?.name ?? ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const waitingRoomUrl = `${appUrl}/espera/${ticket.id}`

  // ── Buscar FCM token: ticket primero, luego customers ────────────────────────
  let fcmToken: string | undefined

  const sub = ticket.push_subscription as { token?: string } | null
  if (sub?.token) fcmToken = sub.token

  if (!fcmToken && ticket.customer_email) {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: customer } = await service
      .from('customers')
      .select('fcm_token')
      .eq('email', ticket.customer_email)
      .not('fcm_token', 'is', null)
      .order('fcm_token_updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (customer?.fcm_token) fcmToken = customer.fcm_token
  }

  // ── Enviar push con FCM V1 API ───────────────────────────────────────────────
  let pushed = false
  if (fcmToken) {
    const serviceAccount = await getServiceAccount()
    if (serviceAccount) {
      const result = await sendFCMMessage({
        token: fcmToken,
        title: '¡Es tu turno! 🔔',
        body: `Turno ${ticket.queue_number} — ${establishmentName} te está llamando`,
        data: {
          ticketId: ticket.id,
          url: waitingRoomUrl,
        },
        serviceAccount,
      })
      pushed = result.success
    }
  }

  return NextResponse.json({ ok: true, pushed, waitingRoomUrl })
}
