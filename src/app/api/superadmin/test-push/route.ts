import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function getFcmServerKey(): Promise<string | null> {
  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  const { to } = await req.json()
  if (!to) return NextResponse.json({ ok: false, error: 'email requerido' }, { status: 400 })

  const FCM_SERVER_KEY = await getFcmServerKey()
  if (!FCM_SERVER_KEY) {
    return NextResponse.json({ ok: false, error: 'FIREBASE_SERVER_KEY no configurada' }, { status: 503 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // First try customers table (has fcm_token from CRM)
  const { data: customer } = await service
    .from('customers')
    .select('id, name, fcm_token, email')
    .eq('email', to)
    .not('fcm_token', 'is', null)
    .order('fcm_token_updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let fcmToken: string | undefined
  let customerName: string = to
  let ticketInfo = ''

  if (customer?.fcm_token) {
    fcmToken = customer.fcm_token
    customerName = customer.name || to
    ticketInfo = 'desde tabla customers'
  } else {
    // Fallback: search tickets by customer_email
    const { data: tickets } = await service
      .from('tickets')
      .select('id, queue_number, customer_name, push_subscription, customer_email')
      .eq('customer_email', to)
      .order('created_at', { ascending: false })
      .limit(10)

    const ticket = (tickets ?? []).find(t => {
      const s = t.push_subscription as { token?: string } | null
      return s?.token
    })

    if (ticket) {
      const sub = ticket.push_subscription as { token?: string }
      fcmToken = sub?.token
      customerName = ticket.customer_name || to
      ticketInfo = `ticket #${ticket.queue_number}`
    }
  }

  if (!fcmToken) {
    return NextResponse.json({
      ok: false,
      error: `No se encontró token push para ${to}. El cliente debe haber aceptado notificaciones en al menos un turno.`,
    })
  }

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify({
      to: fcmToken,
      notification: {
        title: '🔔 Push de prueba — TurnFlow',
        body: `Hola ${customerName}, las notificaciones push están funcionando.`,
        icon: '/icon-192.png',
      },
      data: { test: 'true' },
    }),
  })

  const result = await res.json()
  const httpStatus = res.status

  return NextResponse.json({
    ok: httpStatus === 200 && result.success === 1,
    message: httpStatus === 200 && result.success === 1
      ? `Push enviado a ${customerName} (${ticketInfo})`
      : 'FCM respondió con error',
    diagnostics: {
      http_status: httpStatus,
      fcm_success: result.success,
      fcm_failure: result.failure,
      fcm_results: JSON.stringify(result.results ?? []),
      token_preview: fcmToken.slice(0, 20) + '…',
      customer: customerName,
      source: ticketInfo,
    },
  })
}
