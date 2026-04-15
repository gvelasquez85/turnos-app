import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getServiceAccount, sendFCMMessage } from '@/lib/fcm'

export async function POST(req: NextRequest) {
  const { to } = await req.json()
  if (!to) return NextResponse.json({ ok: false, error: 'email requerido' }, { status: 400 })

  const serviceAccount = await getServiceAccount()
  if (!serviceAccount) {
    return NextResponse.json({
      ok: false,
      error: 'FIREBASE_SERVICE_ACCOUNT no configurada. Ve a Integraciones → Firebase → Service Account JSON.',
    }, { status: 503 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar en tabla customers (token registrado desde CustomerFlow)
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
  let source = ''

  if (customer?.fcm_token) {
    fcmToken = customer.fcm_token
    customerName = customer.name || to
    source = 'customers table'
  } else {
    // 2. Fallback: buscar en tickets por customer_email
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
      source = `ticket #${ticket.queue_number}`
    }
  }

  if (!fcmToken) {
    // Diagnóstico útil: cuántos tickets tiene pero sin token
    const { count } = await service
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('customer_email', to)

    return NextResponse.json({
      ok: false,
      error: `No se encontró token push para ${to}.`,
      diagnostics: {
        hint: count && count > 0
          ? `El cliente tiene ${count} ticket(s) pero ninguno con push aceptado. El cliente debe abrir el link de turno y aceptar las notificaciones.`
          : 'No se encontró ningún ticket con ese email. Verifica que el email sea correcto.',
        tickets_found: count ?? 0,
        solution: 'El cliente debe ir a /t/[sucursal], tomar un turno y aceptar las notificaciones push cuando el navegador lo pida.',
      },
    })
  }

  const result = await sendFCMMessage({
    token: fcmToken,
    title: '🔔 Push de prueba — TurnFlow',
    body: `Hola ${customerName}, las notificaciones push están funcionando.`,
    data: { test: 'true' },
    serviceAccount,
  })

  return NextResponse.json({
    ok: result.success,
    message: result.success
      ? `Push enviado a ${customerName} (${source})`
      : 'FCM respondió con error',
    diagnostics: {
      success: result.success,
      fcm_message_id: result.messageId ?? null,
      fcm_error: result.error ?? null,
      token_preview: fcmToken.slice(0, 20) + '…',
      customer: customerName,
      source,
    },
  })
}
