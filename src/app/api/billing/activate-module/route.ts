import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { createPaymentSource, createTransaction } from '@/lib/wompi'
import { toCents, generateBillingReference, nextBillingDate, periodEnd, type BillingCurrency } from '@/lib/billing-cop'

/**
 * POST /api/billing/activate-module
 * Cobra el módulo con Wompi y activa la suscripción mensual.
 *
 * Body (nuevo medio de pago):
 *   { moduleKey, priceMonthly, cardToken, acceptanceToken, personalDataToken, currency? }
 *
 * Body (tarjeta ya guardada):
 *   { moduleKey, priceMonthly, useStoredCard: true, currency? }
 */
export async function POST(req: NextRequest) {
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
  const customerEmail = user.email!

  const body = await req.json() as {
    moduleKey: string
    priceMonthly: number
    cardToken?: string
    acceptanceToken?: string
    personalDataToken?: string
    useStoredCard?: boolean
    currency?: BillingCurrency
  }

  const { moduleKey, priceMonthly, currency = 'COP', useStoredCard } = body

  if (!moduleKey || !priceMonthly)
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })

  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── Obtener membresía (para payment source almacenado) ─────────────────────
  const { data: membership } = await service
    .from('memberships')
    .select('id, wompi_payment_source_id, wompi_customer_email, billing_anchor_day')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let paymentSourceId: number

  if (useStoredCard) {
    // Usar tarjeta ya guardada en la membresía
    if (!membership?.wompi_payment_source_id)
      return NextResponse.json({ error: 'No hay tarjeta guardada. Ingresa una nueva.' }, { status: 400 })
    paymentSourceId = Number(membership.wompi_payment_source_id)
  } else {
    // Registrar nueva tarjeta
    const { cardToken, acceptanceToken, personalDataToken } = body
    if (!cardToken || !acceptanceToken || !personalDataToken)
      return NextResponse.json({ error: 'Faltan datos de tarjeta' }, { status: 400 })

    let src
    try {
      src = await createPaymentSource({ cardToken, customerEmail, acceptanceToken, personalDataToken })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la tarjeta'
      return NextResponse.json({ error: msg }, { status: 422 })
    }
    paymentSourceId = src.id

    // Guardar en membresía si no tenía una aún
    if (membership && !membership.wompi_payment_source_id) {
      await service
        .from('memberships')
        .update({
          wompi_payment_source_id: String(src.id),
          wompi_customer_email: customerEmail,
        })
        .eq('id', membership.id)
    }
  }

  // ── Cobrar el módulo ───────────────────────────────────────────────────────
  const amountCents = toCents(priceMonthly)
  const reference = generateBillingReference(brandId)
  const now = new Date()

  const { data: txn } = await service
    .from('billing_transactions')
    .insert({
      brand_id: brandId,
      membership_id: membership?.id ?? null,
      wompi_reference: reference,
      amount: amountCents,
      currency,
      status: 'pending',
      payment_source_id: paymentSourceId,
      customer_email: customerEmail,
      period_start: now.toISOString().slice(0, 10),
      period_end: periodEnd(nextBillingDate(now.getDate(), now)).toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  let wompiTxn
  try {
    wompiTxn = await createTransaction({
      paymentSourceId,
      amountCents,
      currency,
      reference,
      customerEmail,
    })
  } catch (err) {
    await service.from('billing_transactions')
      .update({ status: 'error', error_reason: err instanceof Error ? err.message : 'error' })
      .eq('id', txn!.id)
    const msg = err instanceof Error ? err.message : 'El cobro fue rechazado'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : wompiTxn.status === 'PENDING' ? 'pending'
    : 'error'

  await service.from('billing_transactions')
    .update({ wompi_transaction_id: wompiTxn.id, status: txnStatus, error_reason: wompiTxn.error?.reason ?? null })
    .eq('id', txn!.id)

  if (wompiTxn.status === 'DECLINED' || wompiTxn.status === 'ERROR')
    return NextResponse.json({ error: wompiTxn.error?.reason ?? 'Tarjeta rechazada' }, { status: 422 })

  // ── Activar suscripción del módulo ────────────────────────────────────────
  const anchorDay = membership?.billing_anchor_day ?? now.getDate()
  const expiresAt = nextBillingDate(anchorDay, now).toISOString()

  const { data: sub } = await service
    .from('module_subscriptions')
    .upsert({
      brand_id: brandId,
      module_key: moduleKey,
      status: 'active',
      activated_at: now.toISOString(),
      expires_at: expiresAt,
      price_monthly: priceMonthly,
      trial_started_at: now.toISOString(),
      trial_expires_at: null,
    }, { onConflict: 'brand_id,module_key' })
    .select()
    .single()

  // Actualizar active_modules en la marca
  const { data: brandData } = await service.from('brands').select('active_modules').eq('id', brandId).single()
  const activeModules = { ...(brandData?.active_modules ?? {}), [moduleKey]: true }
  await service.from('brands').update({ active_modules: activeModules }).eq('id', brandId)

  return NextResponse.json({ ok: true, expiresAt, sub, transactionStatus: wompiTxn.status })
}
