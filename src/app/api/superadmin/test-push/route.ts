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

  // Find the most recent ticket for this email that has a push_subscription
  const { data: tickets, error: ticketError } = await service
    .from('tickets')
    .select('id, queue_number, customer_name, push_subscription, customer_email')
    .eq('customer_email', to)
    .order('created_at', { ascending: false })
    .limit(10)

  if (ticketError) {
    return NextResponse.json({ ok: false, error: ticketError.message })
  }

  // Pick the most recent one that actually has a push token
  const ticket = (tickets ?? []).find(t => {
    const s = t.push_subscription as { token?: string } | null
    return s?.token
  })

  if (!ticket) {
    return NextResponse.json({
      ok: false,
      error: `No se encontró ningún ticket con push registrado para ${to}`,
    })
  }

  const sub = ticket.push_subscription as { token?: string }
  const fcmToken = sub?.token
  if (!fcmToken) {
    return NextResponse.json({ ok: false, error: 'Ticket encontrado pero sin token FCM' })
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
        title: '🔔 Push de prueba — TurnApp',
        body: `Hola ${ticket.customer_name || to}, las notificaciones push están funcionando.`,
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
      ? `Push enviado a ${ticket.customer_name || to} (ticket #${ticket.queue_number})`
      : 'FCM respondió con error',
    diagnostics: {
      http_status: httpStatus,
      fcm_success: result.success,
      fcm_failure: result.failure,
      fcm_results: JSON.stringify(result.results ?? []),
      token_preview: fcmToken.slice(0, 20) + '…',
      customer: ticket.customer_name,
      ticket_id: ticket.id,
    },
  })
}
