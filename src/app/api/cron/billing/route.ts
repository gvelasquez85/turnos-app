import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createTransaction, getTransaction } from '@/lib/wompi'
import {
  calcMonthlyTotalBilling, toCents, generateBillingReference,
  nextBillingDate, periodEnd, fromCents, formatCurrency,
  type BillingCurrency,
} from '@/lib/billing-cop'

/**
 * GET /api/cron/billing
 *
 * Cron diario — corre a las 10:00 UTC (5 AM Colombia).
 * Configurado en vercel.json: "0 10 * * *"
 *
 * Acciones:
 *   1. Cobrar membresías vencidas (next_billing_at <= now)
 *   2. Reintentar pagos fallidos durante los 7 días de gracia (1 intento/día)
 *   3. Suspender cuentas que llevan > 8 días sin pagar
 *   4. Enviar emails de notificación según el día de atraso
 */
export async function GET(req: NextRequest) {
  // Proteger con CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const now = new Date()
  const results = { billed: 0, retried: 0, suspended: 0, errors: [] as string[] }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. COBRAR MEMBRESÍAS VENCIDAS
  // ────────────────────────────────────────────────────────────────────────────
  const { data: due } = await service
    .from('memberships')
    .select('id, brand_id, max_establishments, max_advisors, wompi_payment_source_id, wompi_customer_email, billing_anchor_day, billing_currency')
    .eq('billing_status', 'active')
    .not('wompi_payment_source_id', 'is', null)
    .lte('next_billing_at', now.toISOString())

  for (const m of due ?? []) {
    try {
      await chargeAndUpdate(service, m, now)
      results.billed++
    } catch (e) {
      results.errors.push(`billed:${m.brand_id}:${(e as Error).message}`)
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. REINTENTAR PAGOS EN GRACIA (días 1–7, 1 intento por día)
  // ────────────────────────────────────────────────────────────────────────────
  const { data: pastDue } = await service
    .from('memberships')
    .select('id, brand_id, max_establishments, max_advisors, wompi_payment_source_id, wompi_customer_email, billing_currency, billing_anchor_day, past_due_since, past_due_attempts, past_due_last_attempt_at')
    .eq('billing_status', 'past_due')
    .not('wompi_payment_source_id', 'is', null)
    .lt('past_due_attempts', 7)

  for (const m of pastDue ?? []) {
    // Solo reintentar si no lo hemos intentado hoy
    const lastAttempt = m.past_due_last_attempt_at ? new Date(m.past_due_last_attempt_at) : null
    const hoursSinceLastAttempt = lastAttempt
      ? (now.getTime() - lastAttempt.getTime()) / 3_600_000
      : 999

    if (hoursSinceLastAttempt < 23) continue

    try {
      await retryCharge(service, m, now)
      results.retried++
    } catch (e) {
      results.errors.push(`retry:${m.brand_id}:${(e as Error).message}`)
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. SUSPENDER CUENTAS DESPUÉS DE 8 DÍAS
  // ────────────────────────────────────────────────────────────────────────────
  const suspendCutoff = new Date(now)
  suspendCutoff.setDate(suspendCutoff.getDate() - 8)

  const { data: toSuspend } = await service
    .from('memberships')
    .select('id, brand_id, wompi_customer_email')
    .eq('billing_status', 'past_due')
    .lte('past_due_since', suspendCutoff.toISOString())

  for (const m of toSuspend ?? []) {
    await service
      .from('memberships')
      .update({ billing_status: 'suspended' })
      .eq('id', m.id)

    await sendBillingEmail(m.wompi_customer_email, 'suspended', { brandId: m.brand_id })
    results.suspended++
  }

  console.log('[cron/billing]', results)
  return NextResponse.json({ ok: true, ...results })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function chargeAndUpdate(service: any, m: any, now: Date) {
  const currency = (m.billing_currency ?? 'COP') as BillingCurrency

  // Calcular monto actual — solo módulos 'active', trial = gratis
  const { data: modSubs } = await service
    .from('module_subscriptions')
    .select('price_monthly')
    .eq('brand_id', m.brand_id)
    .eq('status', 'active')

  const numPaidModules = (modSubs ?? []).filter((s: any) => (s.price_monthly ?? 0) > 0).length
  const amount = calcMonthlyTotalBilling(m.max_establishments ?? 1, m.max_advisors ?? 2, numPaidModules, currency)

  if (amount === 0) return // plan gratuito, nada que cobrar

  const amountCents = toCents(amount)
  const reference = generateBillingReference(m.brand_id)
  const anchorDay = m.billing_anchor_day ?? now.getDate()
  const nextBilling = nextBillingDate(anchorDay, now)

  // Registrar transacción pendiente
  const { data: txn } = await service
    .from('billing_transactions')
    .insert({
      brand_id: m.brand_id,
      membership_id: m.id,
      wompi_reference: reference,
      amount: amountCents,
      currency,
      status: 'pending',
      payment_source_id: parseInt(m.wompi_payment_source_id),
      customer_email: m.wompi_customer_email,
      period_start: now.toISOString().slice(0, 10),
      period_end: periodEnd(nextBilling).toISOString().slice(0, 10),
    })
    .select('id')
    .single()

  const wompiTxn = await createTransaction({
    paymentSourceId: parseInt(m.wompi_payment_source_id),
    amountCents,
    currency,
    reference,
    customerEmail: m.wompi_customer_email,
  })

  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : wompiTxn.status === 'PENDING' ? 'pending'
    : 'error'

  await service
    .from('billing_transactions')
    .update({ wompi_transaction_id: wompiTxn.id, status: txnStatus, error_reason: wompiTxn.error?.reason ?? null })
    .eq('id', txn.id)

  if (wompiTxn.status === 'APPROVED' || wompiTxn.status === 'PENDING') {
    await service.from('memberships').update({
      last_billed_at: now.toISOString(),
      last_billing_amount: amountCents,
      next_billing_at: nextBilling.toISOString(),
      billing_status: 'active',
      past_due_attempts: 0,
      past_due_since: null,
    }).eq('id', m.id)

    await sendBillingEmail(m.wompi_customer_email, 'approved', {
      amount: formatCurrency(amount, currency),
      nextDate: nextBilling.toLocaleDateString('es-CO'),
    })
  } else {
    // Primer fallo → entrar en gracia
    await service.from('memberships').update({
      billing_status: 'past_due',
      past_due_since: now.toISOString(),
      past_due_attempts: 1,
      past_due_last_attempt_at: now.toISOString(),
    }).eq('id', m.id)

    await sendBillingEmail(m.wompi_customer_email, 'failed_day1', { brandId: m.brand_id })
  }
}

async function retryCharge(service: any, m: any, now: Date) {
  const currency = (m.billing_currency ?? 'COP') as BillingCurrency
  const pastDueSince = new Date(m.past_due_since)
  const daysPastDue = Math.floor((now.getTime() - pastDueSince.getTime()) / 86_400_000)

  // Solo módulos 'active', trial = gratis
  const { data: modSubs } = await service
    .from('module_subscriptions')
    .select('price_monthly')
    .eq('brand_id', m.brand_id)
    .eq('status', 'active')

  const numPaidModules = (modSubs ?? []).filter((s: any) => (s.price_monthly ?? 0) > 0).length
  const amount = calcMonthlyTotalBilling(m.max_establishments ?? 1, m.max_advisors ?? 2, numPaidModules, currency)
  const amountCents = toCents(amount)
  const reference = generateBillingReference(m.brand_id)
  const anchorDay = m.billing_anchor_day ?? now.getDate()

  const { data: txn } = await service
    .from('billing_transactions')
    .insert({
      brand_id: m.brand_id,
      membership_id: m.id,
      wompi_reference: reference,
      amount: amountCents,
      currency,
      status: 'pending',
      payment_source_id: parseInt(m.wompi_payment_source_id),
      customer_email: m.wompi_customer_email,
    })
    .select('id')
    .single()

  const wompiTxn = await createTransaction({
    paymentSourceId: parseInt(m.wompi_payment_source_id),
    amountCents,
    currency,
    reference,
    customerEmail: m.wompi_customer_email,
  })

  const txnStatus = wompiTxn.status === 'APPROVED' ? 'approved'
    : wompiTxn.status === 'DECLINED' ? 'declined'
    : 'error'

  await service
    .from('billing_transactions')
    .update({ wompi_transaction_id: wompiTxn.id, status: txnStatus })
    .eq('id', txn.id)

  if (wompiTxn.status === 'APPROVED' || wompiTxn.status === 'PENDING') {
    const nextBilling = nextBillingDate(anchorDay, now)
    await service.from('memberships').update({
      billing_status: 'active',
      last_billed_at: now.toISOString(),
      last_billing_amount: amountCents,
      next_billing_at: nextBilling.toISOString(),
      past_due_since: null,
      past_due_attempts: 0,
      past_due_last_attempt_at: null,
    }).eq('id', m.id)

    await sendBillingEmail(m.wompi_customer_email, 'approved', {
      amount: formatCurrency(fromCents(amountCents), currency),
      nextDate: nextBilling.toLocaleDateString('es-CO'),
    })
  } else {
    const newAttempts = (m.past_due_attempts ?? 0) + 1
    await service.from('memberships').update({
      past_due_attempts: newAttempts,
      past_due_last_attempt_at: now.toISOString(),
    }).eq('id', m.id)

    // Emails de advertencia según días en mora
    if (daysPastDue >= 5) {
      await sendBillingEmail(m.wompi_customer_email, 'warning_suspension', {
        daysLeft: 8 - daysPastDue,
        brandId: m.brand_id,
      })
    } else {
      await sendBillingEmail(m.wompi_customer_email, 'retry_failed', {
        attempt: newAttempts,
        brandId: m.brand_id,
      })
    }
  }
}

// ─── Emails de facturación ────────────────────────────────────────────────────
// Reemplazar con Resend/SendGrid según el servicio que uses.
// Por ahora loguea en consola; conectar un servicio de email es trivial.

type EmailType = 'approved' | 'failed_day1' | 'retry_failed' | 'warning_suspension' | 'suspended'

async function sendBillingEmail(to: string | null, type: EmailType, data: Record<string, any> = {}) {
  if (!to) return

  const subjects: Record<EmailType, string> = {
    approved:            '✅ Pago recibido — TurnFlow',
    failed_day1:         '⚠️ No pudimos procesar tu pago — TurnFlow',
    retry_failed:        '⚠️ Intento de cobro fallido — TurnFlow',
    warning_suspension:  '🚨 Tu cuenta será suspendida pronto — TurnFlow',
    suspended:           '🔴 Cuenta suspendida — TurnFlow',
  }

  // TODO: conectar Resend, SendGrid u otro proveedor
  // Ejemplo con Resend:
  // await resend.emails.send({ from: 'billing@turnflow.co', to, subject: subjects[type], html: buildEmailHtml(type, data) })

  console.log(`[billing/email] TO:${to} TYPE:${type}`, data, '| Subject:', subjects[type])
}
