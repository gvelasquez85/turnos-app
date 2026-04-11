import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Called after user returns from PayPal approval — saves subscription info and new seat counts
export async function POST(req: NextRequest) {
  const { subscriptionId, amount, newEst, newAdv } = await req.json()
  if (!subscriptionId || !amount) {
    return NextResponse.json({ error: 'subscriptionId and amount required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id) {
    return NextResponse.json({ error: 'No brand found' }, { status: 404 })
  }

  const updatePayload: Record<string, unknown> = {
    paypal_subscription_id: subscriptionId,
    subscribed_amount: amount,
    status: 'active',
  }
  if (newEst) updatePayload.max_establishments = newEst
  if (newAdv) updatePayload.max_advisors = newAdv

  const { error } = await supabase
    .from('memberships')
    .update(updatePayload)
    .eq('brand_id', profile.brand_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
