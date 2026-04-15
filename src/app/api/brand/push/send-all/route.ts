import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getServiceAccount, sendFCMBatch } from '@/lib/fcm'

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
    return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 })
  }

  const targetBrandId = profile.role === 'superadmin' ? (brandId ?? null) : profile.brand_id
  if (!targetBrandId) {
    return NextResponse.json({ error: 'brandId requerido para superadmin' }, { status: 400 })
  }

  const serviceAccount = await getServiceAccount()
  if (!serviceAccount) {
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT no configurada' }, { status: 503 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener todos los clientes con token FCM para esta marca
  const { data: customers, error } = await service
    .from('customers')
    .select('id, name, fcm_token')
    .eq('brand_id', targetBrandId)
    .not('fcm_token', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!customers || customers.length === 0) {
    return NextResponse.json({
      sent: 0, failed: 0, skipped: 0, total: 0,
      message: 'No hay clientes con push habilitado',
    })
  }

  const tokens = customers.map(c => c.fcm_token as string).filter(Boolean)

  const result = await sendFCMBatch({
    tokens,
    title,
    body,
    icon: imageUrl || '/icon-192.png',
    data: { type: 'campaign' },
    serviceAccount,
  })

  return NextResponse.json({
    sent: result.sent,
    failed: result.failed,
    skipped: customers.length - tokens.length,
    total: customers.length,
    errors: result.errors,
  })
}
