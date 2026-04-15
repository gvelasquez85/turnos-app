import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getPayPalToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const secret = process.env.PAYPAL_SECRET!
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64')

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

/**
 * POST /api/paypal/create-order
 * Creates a PayPal order for a module activation payment.
 * Body: { moduleKey: string, amount: string, currency?: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleKey, amount, currency = 'USD' } = await req.json()
  if (!moduleKey || !amount) {
    return NextResponse.json({ error: 'moduleKey and amount required' }, { status: 400 })
  }

  try {
    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `TurnFlow módulo: ${moduleKey}`,
          amount: {
            currency_code: currency,
            value: String(parseFloat(amount).toFixed(2)),
          },
          custom_id: JSON.stringify({ moduleKey, userId: user.id }),
        }],
      }),
    })
    const order = await res.json()
    if (!res.ok) throw new Error(order.message ?? 'PayPal error')
    return NextResponse.json({ id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
