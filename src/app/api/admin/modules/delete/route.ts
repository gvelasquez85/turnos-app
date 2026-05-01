import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile || !['brand_admin', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { moduleKey } = await req.json().catch(() => ({}))
  if (!moduleKey) return NextResponse.json({ error: 'Falta moduleKey' }, { status: 400 })

  const brandId = profile.brand_id
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Delete subscription record (hard delete — the user explicitly chose to remove the module)
  await service.from('module_subscriptions')
    .delete()
    .eq('brand_id', brandId)
    .eq('module_key', moduleKey)

  // Remove from brand's active_modules
  const { data: brand } = await service
    .from('brands').select('active_modules').eq('id', brandId).single()
  if (brand) {
    const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}) }
    delete updated[moduleKey]
    await service.from('brands').update({ active_modules: updated }).eq('id', brandId)
  }

  return NextResponse.json({ ok: true })
}
