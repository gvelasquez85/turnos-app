import { NextRequest, NextResponse } from 'next/server'

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString('base64')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  const { amount, currency = 'USD', returnUrl, cancelUrl } = await req.json()

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  try {
    const token = await getAccessToken()

    // 1. Create product
    const productRes = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `product-${Date.now()}`,
      },
      body: JSON.stringify({
        name: 'TurnFlow Membresía',
        type: 'SERVICE',
        category: 'SOFTWARE',
      }),
    })
    const product = await productRes.json()

    // 2. Create billing plan
    const planRes = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `plan-${Date.now()}`,
      },
      body: JSON.stringify({
        product_id: product.id,
        name: `TurnFlow Plan $${amount}/mes`,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: { interval_unit: 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // infinite
            pricing_scheme: {
              fixed_price: { value: amount.toFixed(2), currency_code: currency },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      }),
    })
    const plan = await planRes.json()

    // 3. Create subscription
    const subRes = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `sub-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: plan.id,
        application_context: {
          brand_name: 'TurnFlow',
          locale: 'es-CO',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    })
    const sub = await subRes.json()

    const approvalLink = sub.links?.find((l: { rel: string }) => l.rel === 'approve')?.href

    return NextResponse.json({
      subscriptionId: sub.id,
      planId: plan.id,
      approvalUrl: approvalLink,
    })
  } catch (err) {
    console.error('PayPal create-subscription error', err)
    return NextResponse.json({ error: 'PayPal error' }, { status: 500 })
  }
}
