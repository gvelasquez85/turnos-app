import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

/**
 * POST /api/billing/update-seats
 * Actualiza max_establishments y max_advisors de la membresía activa.
 * Solo permite aumentar (nunca bajar por debajo del uso real actual).
 *
 * Body: { newEst: number, newAdv: number }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()
  if (!profile?.brand_id)
    return NextResponse.json({ error: 'Sin marca asignada' }, { status: 403 })

  const brandId = profile.brand_id
  const body = await req.json()
  const { newEst, newAdv } = body as { newEst: number; newAdv: number }

  if (!newEst || !newAdv || newEst < 1 || newAdv < 1)
    return NextResponse.json({ error: 'Valores inválidos' }, { status: 400 })

  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verificar uso actual (no permitir bajar por debajo del uso real)
  const [{ count: estCount }, { count: advCount }] = await Promise.all([
    service.from('establishments').select('id', { count: 'exact', head: true }).eq('brand_id', brandId),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).neq('role', 'brand_admin'),
  ])

  if (newEst < (estCount ?? 1))
    return NextResponse.json({ error: `No puedes bajar a ${newEst} sucursal${newEst !== 1 ? 'es' : ''} — tienes ${estCount} activas` }, { status: 400 })
  if (newAdv < (advCount ?? 0))
    return NextResponse.json({ error: `No puedes bajar a ${newAdv} usuarios — tienes ${advCount} activos` }, { status: 400 })
  if (newAdv < newEst * 2)
    return NextResponse.json({ error: `Cada sucursal incluye 2 usuarios (mínimo ${newEst * 2} para ${newEst} sucursal${newEst !== 1 ? 'es' : ''})` }, { status: 400 })

  const { data: membership } = await service
    .from('memberships')
    .select('id, plan, max_establishments, max_advisors')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership)
    return NextResponse.json({ error: 'Sin membresía' }, { status: 404 })

  const { error } = await service
    .from('memberships')
    .update({
      max_establishments: newEst,
      max_advisors: newAdv,
      // Si era free y está ampliando, pasa a standard
      plan: membership.plan === 'free' && (newEst > 1 || newAdv > 2) ? 'standard' : membership.plan,
    })
    .eq('id', membership.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, newEst, newAdv })
}
