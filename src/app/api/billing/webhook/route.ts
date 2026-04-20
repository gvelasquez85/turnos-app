import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWompiWebhook } from '@/lib/wompi'
import { nextBillingDate } from '@/lib/billing-cop'

/**
 * GET /api/billing/webhook
 * Wompi verifica la URL con un GET antes de enviar eventos.
 * Responder 200 OK es suficiente.
 */
export async function GET() {
  return NextResponse.json({ ok: true })
}

/**
 * POST /api/billing/webhook
 * Recibe eventos de Wompi y actualiza el estado de las transacciones
 * y membresías en consecuencia.
 *
 * Eventos manejados:
 *   transaction.updated → APPROVED, DECLINED, VOIDED, ERROR
 *
 * URL a registrar en el dashboard de Wompi:
 *   Fase 1 (dominio único):  https://www.turnflow.com.co/api/billing/webhook
 *   Fase 2 (subdominio app): https://app.turnflow.com.co/api/billing/webhook
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const checksum = req.headers.get('x-event-checksum') ?? ''

  // ── Verificar firma ────────────────────────────────────────────────────────
  if (!verifyWompiWebhook(rawBody, checksum)) {
    console.warn('[billing/webhook] Firma inválida')
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Solo procesar eventos de transacción
  if (event.event !== 'transaction.updated') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const txnData = event.data?.transaction
  if (!txnData?.id || !txnData?.reference) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const wompiStatus: string = txnData.status // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  const ourStatus = wompiStatus === 'APPROVED' ? 'approved'
    : wompiStatus === 'DECLINED' ? 'declined'
    : wompiStatus === 'VOIDED' ? 'voided'
    : wompiStatus === 'PENDING' ? 'pending'
    : 'error'

  // ── Actualizar billing_transactions ───────────────────────────────────────
  const { data: txnRow } = await service
    .from('billing_transactions')
    .update({
      wompi_transaction_id: txnData.id,
      status: ourStatus,
      error_reason: txnData.status_message ?? null,
    })
    .eq('wompi_reference', txnData.reference)
    .select('id, brand_id, membership_id, amount')
    .maybeSingle()

  if (!txnRow) {
    // Puede ser una transacción creada desde otro origen, ignorar
    return NextResponse.json({ ok: true, unknown_reference: true })
  }

  // ── Actualizar membresía según resultado ───────────────────────────────────
  if (wompiStatus === 'APPROVED') {
    const { data: membership } = await service
      .from('memberships')
      .select('billing_anchor_day, billing_status')
      .eq('id', txnRow.membership_id)
      .maybeSingle()

    const anchorDay = membership?.billing_anchor_day ?? new Date().getDate()
    const now = new Date()
    const nextBilling = nextBillingDate(anchorDay, now)

    await service
      .from('memberships')
      .update({
        billing_status: 'active',
        last_billed_at: now.toISOString(),
        last_billing_amount: txnRow.amount,
        next_billing_at: nextBilling.toISOString(),
        past_due_since: null,
        past_due_attempts: 0,
        past_due_last_attempt_at: null,
      })
      .eq('id', txnRow.membership_id)
  }

  if (wompiStatus === 'DECLINED' || wompiStatus === 'ERROR') {
    // El cron de billing maneja los reintentos — aquí solo registramos
    console.warn(`[billing/webhook] Transacción ${txnData.id} ${wompiStatus} — brand ${txnRow.brand_id}`)
  }

  return NextResponse.json({ ok: true })
}
