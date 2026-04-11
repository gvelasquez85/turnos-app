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

// Cancels a PayPal subscription without touching membership status in our system
export async function POST(req: NextRequest) {
  const { subscriptionId } = await req.json()
  if (!subscriptionId) {
    return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 })
  }

  try {
    const token = await getAccessToken()
    await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Plan amount changed — new subscription created' }),
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PayPal cancel-subscription error', err)
    return NextResponse.json({ error: 'PayPal error' }, { status: 500 })
  }
}
