import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { createPaymentSource, createTransaction } from '@/lib/wompi'
import {
  calcMonthlyTotalBilling, toCents, generateBillingReference, nextBillingDate, periodEnd,
  type BillingCurrency,
} from '@/lib/billing-cop'

/**
 * POST /api/billing/setup-card
 * Guarda una tarjeta tokenizada y realiza el primer cobro inmediato.
 *
 * Body: {
 *   cardToken        string   — token generado por Wompi en el cliente
 *   acceptanceToken  string   — token de T&C de Wompi
 *   personalDataToken string  — token de autorización de datos
 *   currency?        'COP'|'USD'  — default 'COP'
 * }
 */
export async function POST(req: NextRequest) {
  // ── Autenticación ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()
  if (!profile?.brand_id)
    return NextResponse.json({ error: 'Sin marca asignada' }, { status: 403 })

  const brandId = profile.brand_id

  // ── Body ───────────────────────────────────────────────────────────────────
  const body = await req.json()
  const { cardToken, acceptanceToken, personalDataToken, currency = 'COP', newEst, newAdv } = body as {
    cardToken: string
    acceptanceToken: string
    personalDataToken: string
    currency?: BillingCurrency
    newEst?: number   // asientos deseados (opcional — sobreescribe los de la membresía)
    newAdv?: number
  }

  if (!cardToken || !acceptanceToken || !personalDataToken)
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })

  // ── Service client para operaciones de billing ─────────────────────────────
  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── Membresía actual ───────────────────────────────────────────────────────
  const { data: membership } = await service
    .from('memberships')
    .select('id, max_establishments, max_advisors')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership)
    return NextResponse.json({ error: 'Sin membresía activa' }, { status: 404 })

  // Si el cliente eligió más asientos antes de registrar la tarjeta, actualizar membresía primero
  if (newEst && newAdv && (newEst !== membership.max_establishments || newAdv !== membership.max_advisors)) {
    await service
      .from('memberships')
      .update({ max_establishments: newEst, max_advisors: newAdv })
      .eq('id', membership.id)
    membership.max_establishments = newEst
    membership.max_advisors = newAdv
  }

  // ── Módulos de pago activos ────────────────────────────────────────────────
  // Solo 'active' — trial = período gratuito, no se factura
  const { data: modSubs } = await service
    .from('module_subscriptions')
    .select('module_key, price_monthly')
    .eq('brand_id', brandId)
    .eq('status', 'active')

  const numPaidModules = (modSubs ?? []).filter(m => (m.price_monthly ?? 0) > 0).length

  // ── Cálculo de monto ───────────────────────────────────────────────────────
  const amount = calcMonthlyTotalBilling(
    membership.max_establishments ?? 1,
    membership.max_advisors ?? 2,
    numPaidModules,
    currency,
  )

  // Plan gratuito dentro de límites → no requiere pago
  if (amount === 0)
    return NextResponse.json({ error: 'Plan gratuito no requiere medio de pago' }, { status: 400 })

  const amountCents = toCents(amount)

  // ── Email del usuario ──────────────────────────────────────────────────────
  const customerEmail = user.email!

  // ── Crear fuente de pago en Wompi ──────────────────────────────────────────
  let paymentSource
  try {
    paymentSource = await createPaymentSource({
      cardToken,
      customerEmail,
      acceptanceToken,
      personalDataToken,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al guardar la tarjeta'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  // ── Primer cobro inmediato ─────────────────────────────────────────────────
  const reference = generateBillingReference(brandId)
  const now = new Date()

  // Registrar transacción pendiente
  const { data: txn } = await service
    .from('billing_transactions')
    .insert({
      brand_id: brandId,
      membership_id: membership.id,
      wompi_reference: reference,
      amount: amountCents,
      currency,
      status: 'pending',
      payment_source_id: paymentSource.id,
      customer_email: customerEmail,
      period_start: now.toISOString().slice(0, 10),
      period_end: periodEnd(nextBillingDate(now.getDate(), now)).toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  let wompiTxn
  try {
    wompiTxn = await createTransaction({
      paymentSourceId: paymentSource.id,
      amountCents,
      currency,
      reference,
      customerEmail,
    })
  } catch (err: unknown) {
    // Cobro fallido → marcar transacción y no guardar fuente de pago
    await service
      .from('billing_transactions')
      .update({ status: 'error', error_reason: err instanceof Error ? err.message : 'error', wompi_transaction_id: null })
      .eq('id', txn!.id)
    const msg = err instanceof Error ? err.message : 'El cobro fue rechazado'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  // ── Actualizar transacción con resultado ───────────────────────────────────
  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : wompiTxn.status === 'PENDING' ? 'pending'
    : 'error'

  await service
    .from('billing_transactions')
    .update({
      wompi_transaction_id: wompiTxn.id,
      status: txnStatus,
      error_reason: wompiTxn.error?.reason ?? null,
    })
    .eq('id', txn!.id)

  if (wompiTxn.status === 'DECLINED' || wompiTxn.status === 'ERROR') {
    return NextResponse.json(
      { error: wompiTxn.error?.reason ?? 'Tarjeta rechazada' },
      { status: 422 },
    )
  }

  // ── Guardar fuente de pago + próxima fecha de cobro ───────────────────────
  const anchorDay = now.getDate()
  const nextBilling = nextBillingDate(anchorDay, now)

  await service
    .from('memberships')
    .update({
      plan: 'standard',                                   // ya no es plan gratuito
      wompi_payment_source_id: String(paymentSource.id),
      wompi_customer_email: customerEmail,
      billing_currency: currency,
      billing_anchor_day: anchorDay,
      last_billed_at: now.toISOString(),
      last_billing_amount: amountCents,
      next_billing_at: nextBilling.toISOString(),
      billing_status: 'active',
      past_due_attempts: 0,
      past_due_since: null,
    })
    .eq('id', membership.id)

  return NextResponse.json({
    ok: true,
    transactionStatus: wompiTxn.status,
    nextBillingAt: nextBilling.toISOString(),
    amountCents,
    currency,
  })
}
