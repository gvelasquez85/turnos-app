import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile || !['brand_admin', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { brandId } = await req.json().catch(() => ({}))
  const effectiveBrandId = brandId || profile.brand_id
  if (!effectiveBrandId) return NextResponse.json({ error: 'Falta brandId' }, { status: 400 })

  // Validate ownership
  if (profile.role !== 'superadmin' && effectiveBrandId !== profile.brand_id)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Call the seed function
  const { error } = await service.rpc('seed_puc_for_brand', { p_brand_id: effectiveBrandId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
