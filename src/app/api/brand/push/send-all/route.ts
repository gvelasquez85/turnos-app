import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function getFcmServerKey(): Promise<string | null> {
  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await service
      .from('system_settings')
      .select('value')
      .eq('key', 'FIREBASE_SERVER_KEY')
      .single()
    if (data?.value) return data.value
  } catch {}
  return process.env.FIREBASE_SERVER_KEY ?? null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['superadmin', 'brand_admin', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body, brandId, imageUrl } = await req.json()
  if (!title || !body) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }

  const targetBrandId = profile.role === 'superadmin' ? (brandId ?? null) : profile.brand_id
  if (!targetBrandId) {
    return NextResponse.json({ error: 'brandId required for superadmin' }, { status: 400 })
  }

  const FCM_SERVER_KEY = await getFcmServerKey()
  if (!FCM_SERVER_KEY) {
    return NextResponse.json({ error: 'FCM not configured' }, { status: 503 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all customers in this brand with FCM tokens
  const { data: customers, error } = await service
    .from('customers')
    .select('id, name, fcm_token')
    .eq('brand_id', targetBrandId)
    .not('fcm_token', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!customers || customers.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, skipped: 0, message: 'No customers with push tokens' })
  }

  const tokens = customers.map(c => c.fcm_token as string).filter(Boolean)
  let sent = 0
  let failed = 0

  // FCM supports up to 1000 registration_ids per request
  const BATCH_SIZE = 500
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE)
    const payload: Record<string, unknown> = {
      registration_ids: batch,
      notification: { title, body, icon: '/icon-192.png' },
      data: { type: 'campaign' },
    }
    if (imageUrl) (payload.notification as Record<string, unknown>).image = imageUrl

    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${FCM_SERVER_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    sent += result.success ?? 0
    failed += result.failure ?? 0
  }

  return NextResponse.json({ sent, failed, skipped: customers.length - tokens.length, total: customers.length })
}
