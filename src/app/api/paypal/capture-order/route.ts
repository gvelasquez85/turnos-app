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
 * POST /api/paypal/capture-order
 * Captures an approved PayPal order and activates the module subscription.
 * Body: { orderId: string, moduleKey: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, moduleKey } = await req.json()
  if (!orderId || !moduleKey) {
    return NextResponse.json({ error: 'orderId and moduleKey required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()
  const brandId = profile?.brand_id
  if (!brandId) return NextResponse.json({ error: 'No brand' }, { status: 400 })

  try {
    // Capture the PayPal order
    const token = await getPayPalToken()
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const capture = await res.json()
    if (!res.ok || capture.status !== 'COMPLETED') {
      throw new Error(capture.message ?? `Capture status: ${capture.status}`)
    }

    // Activate the module subscription (30-day period)
    const activatedAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: subErr } = await supabase
      .from('module_subscriptions')
      .upsert({
        brand_id: brandId,
        module_key: moduleKey,
        status: 'active',
        activated_at: activatedAt,
        expires_at: expiresAt,
        trial_started_at: activatedAt,
      }, { onConflict: 'brand_id,module_key' })
    if (subErr) throw new Error(subErr.message)

    // Enable module in brand's active_modules
    const { data: brand } = await supabase
      .from('brands')
      .select('active_modules')
      .eq('id', brandId)
      .single()
    const updated = { ...((brand?.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: true }
    await supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)

    return NextResponse.json({ success: true, expiresAt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
