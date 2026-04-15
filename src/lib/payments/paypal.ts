import type { PaymentProvider } from './types'

export const paypalProvider: PaymentProvider = {
  config: {
    name: 'paypal',
    displayName: 'PayPal',
    supportedCurrencies: ['USD'],
    logoUrl: 'https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png',
  },
}

export async function getPayPalAccessToken(): Promise<string> {
  const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
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
