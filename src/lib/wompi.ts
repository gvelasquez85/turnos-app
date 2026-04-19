/**
 * Cliente Wompi API
 * Docs: https://docs.wompi.co/docs/colombia/
 *
 * Env vars requeridos (server-side):
 *   WOMPI_PRIVATE_KEY       prv_prod_...
 *   WOMPI_EVENTS_SECRET     prod_events_...
 *
 * Env vars requeridos (client-side via NEXT_PUBLIC_):
 *   NEXT_PUBLIC_WOMPI_PUBLIC_KEY   pub_prod_...
 *   NEXT_PUBLIC_WOMPI_ENV          production | sandbox
 */

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === 'sandbox'
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface WompiAcceptanceData {
  acceptanceToken: string
  acceptancePermalink: string
  personalDataToken: string
  personalDataPermalink: string
}

export interface WompiPaymentSource {
  id: number
  type: 'CARD'
  token: string
  status: 'AVAILABLE' | 'INVALID' | string
  customer_email: string
}

export type WompiTransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR'

export interface WompiTransaction {
  id: string
  status: WompiTransactionStatus
  reference: string
  amount_in_cents: number
  currency: 'COP' | 'USD'
  payment_method_type: string
  payment_source_id?: number
  customer_email?: string
  error?: { type: string; reason: string }
  created_at: string
  finalized_at: string | null
}

// ─── Helper de request ────────────────────────────────────────────────────────

async function wompiRequest<T>(
  path: string,
  options: RequestInit = {},
  key: string,
): Promise<T> {
  const res = await fetch(`${WOMPI_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  const json = await res.json()

  if (!res.ok) {
    const msg =
      (json?.error?.messages as string[] | undefined)?.join(', ') ??
      json?.error?.reason ??
      json?.error?.type ??
      `Wompi HTTP ${res.status}`
    throw new Error(msg)
  }

  return (json.data ?? json) as T
}

// ─── Tokens de aceptación (merchant info) ─────────────────────────────────────

/**
 * Obtiene los tokens de aceptación requeridos antes de mostrar el formulario
 * de tarjeta. Usa la llave PÚBLICA (puede llamarse desde el servidor también).
 */
export async function getAcceptanceTokens(): Promise<WompiAcceptanceData> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!
  const merchant = await wompiRequest<{
    presigned_acceptance: { acceptance_token: string; permalink: string }
    presigned_personal_data_auth: { acceptance_token: string; permalink: string }
  }>(`/merchants/${publicKey}`, {}, publicKey)

  return {
    acceptanceToken: merchant.presigned_acceptance.acceptance_token,
    acceptancePermalink: merchant.presigned_acceptance.permalink,
    personalDataToken: merchant.presigned_personal_data_auth.acceptance_token,
    personalDataPermalink: merchant.presigned_personal_data_auth.permalink,
  }
}

// ─── Fuentes de pago (tarjeta tokenizada) ─────────────────────────────────────

/**
 * Crea una fuente de pago a partir de un card_token generado en el cliente.
 * Requiere llave PRIVADA.
 */
export async function createPaymentSource(opts: {
  cardToken: string
  customerEmail: string
  acceptanceToken: string
  personalDataToken: string
}): Promise<WompiPaymentSource> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY!
  return wompiRequest<WompiPaymentSource>(
    '/payment_sources',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'CARD',
        token: opts.cardToken,
        customer_email: opts.customerEmail,
        acceptance_token: opts.acceptanceToken,
        accept_personal_auth: opts.personalDataToken,
      }),
    },
    privateKey,
  )
}

// ─── Transacciones ────────────────────────────────────────────────────────────

/**
 * Cobra a una fuente de pago guardada.
 * amountCents: monto en CENTAVOS (COP × 100)
 */
export async function createTransaction(opts: {
  paymentSourceId: number
  amountCents: number
  currency: 'COP' | 'USD'
  reference: string
  customerEmail: string
}): Promise<WompiTransaction> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY!
  return wompiRequest<WompiTransaction>(
    '/transactions',
    {
      method: 'POST',
      body: JSON.stringify({
        amount_in_cents: opts.amountCents,
        currency: opts.currency,
        payment_method: {
          type: 'PAYMENT_SOURCE',
          payment_source_id: opts.paymentSourceId,
          installments: 1,
        },
        reference: opts.reference,
        customer_email: opts.customerEmail,
      }),
    },
    privateKey,
  )
}

/** Consulta el estado de una transacción por ID. */
export async function getTransaction(transactionId: string): Promise<WompiTransaction> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY!
  return wompiRequest<WompiTransaction>(`/transactions/${transactionId}`, {}, privateKey)
}

// ─── Verificación de webhook ──────────────────────────────────────────────────

import crypto from 'crypto'

/**
 * Verifica la firma del webhook de Wompi.
 * Header: X-Event-Checksum
 * Checksum = SHA256(rawBody + eventsSecret)
 */
export function verifyWompiWebhook(rawBody: string, checksum: string): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET!
  if (!secret) return false
  const computed = crypto
    .createHash('sha256')
    .update(rawBody + secret)
    .digest('hex')
  return computed === checksum
}
