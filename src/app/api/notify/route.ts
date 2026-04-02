import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function getFcmServerKey(): Promise<string | null> {
  // Try DB override first (system_settings), then fall back to env var
  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { data } = await service
      .from('system_settings')
      .select('value')
      .eq('key', 'FIREBASE_SERVER_KEY')
      .single()
    if (data?.value) return data.value
  } catch {}
  return process.env.FIREBASE_SERVER_KEY ?? null
}

export async function POST(req: NextRequest) {
  const FCM_SERVER_KEY = await getFcmServerKey()
  if (!FCM_SERVER_KEY) {
    return NextResponse.json({ error: 'FCM not configured' }, { status: 503 })
  }

  const { ticketId } = await req.json()
  if (!ticketId) return NextResponse.json({ error: 'ticketId required' }, { status: 400 })

  const supabase = await createClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, queue_number, customer_name, push_subscription, establishments(name)')
    .eq('id', ticketId)
    .single()

  if (!ticket?.push_subscription) {
    return NextResponse.json({ skipped: true })
  }

  const sub = ticket.push_subscription as { token?: string }
  const fcmToken = sub.token
  if (!fcmToken) return NextResponse.json({ skipped: true })

  const establishmentName = (ticket.establishments as any)?.name ?? 'tu establecimiento'

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: {
        title: '¡Es tu turno! 🔔',
        body: `Turno ${ticket.queue_number} — ${establishmentName} te está llamando`,
        icon: '/icon-192.png',
      },
      data: {
        ticketId: ticket.id,
        url: '/',
      },
    }),
  })

  const result = await res.json()
  return NextResponse.json({ sent: true, result })
}
