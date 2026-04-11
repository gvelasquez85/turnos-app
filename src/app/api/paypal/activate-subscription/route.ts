import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Called after user returns from PayPal approval — saves subscription info to membership
export async function POST(req: NextRequest) {
  const { subscriptionId, amount } = await req.json()
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

  const { error } = await supabase
    .from('memberships')
    .update({
      paypal_subscription_id: subscriptionId,
      subscribed_amount: amount,
      status: 'active',
    })
    .eq('brand_id', profile.brand_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
