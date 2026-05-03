import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import { PLANS, normalizePlan, type PlanKey } from '@/lib/planLimits'

/**
 * POST /api/billing/change-plan
 * Changes the brand's membership plan to a new tier.
 * Sets max_establishments and max_advisors from the plan definition (preserving extra purchased users).
 *
 * Body: { newPlan: 'free' | 'essential' | 'business', billingCycle?: 'monthly' | 'annual' }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id)
    return NextResponse.json({ error: 'Sin marca asignada' }, { status: 403 })

  if (!['brand_admin', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { newPlan, billingCycle = 'monthly' } = body as { newPlan: string; billingCycle?: string }

  const planKey = normalizePlan(newPlan)
  if (!['free', 'essential', 'business'].includes(planKey))
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })

  const planDef = PLANS[planKey as PlanKey]
  const brandId = profile.brand_id

  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Get current membership
  const { data: membership } = await service
    .from('memberships')
    .select('id, plan, max_establishments, max_advisors, billing_status')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Verify actual usage fits within new plan limits
  const [{ count: estCount }, { count: advCount }] = await Promise.all([
    service.from('establishments').select('id', { count: 'exact', head: true }).eq('brand_id', brandId).eq('active', true),
    service.from('profiles').select('id', { count: 'exact', head: true }).eq('brand_id', brandId),
  ])

  if ((estCount ?? 0) > planDef.maxEstablishments)
    return NextResponse.json({
      error: `Tienes ${estCount} sucursal${(estCount ?? 0) !== 1 ? 'es' : ''} activa${(estCount ?? 0) !== 1 ? 's' : ''} y el plan ${planDef.name} sólo permite ${planDef.maxEstablishments}. Desactiva sucursales antes de bajar de plan.`,
    }, { status: 400 })

  // For users: allow extra users via add-on — keep max_advisors at max(plan.maxUsers, current usage)
  const newMaxAdvisors = Math.max(planDef.maxUsers, advCount ?? 0)
  const newMaxEstablishments = Math.max(planDef.maxEstablishments, estCount ?? 1)

  const updatePayload: Record<string, unknown> = {
    plan: planKey,
    max_establishments: newMaxEstablishments,
    max_advisors: newMaxAdvisors,
    billing_cycle: billingCycle,
    // If downgrading to free, clear billing status
    ...(planKey === 'free' ? { billing_status: 'none' } : {}),
  }

  let result
  if (membership) {
    const { data, error } = await service
      .from('memberships')
      .update(updatePayload)
      .eq('id', membership.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await service
      .from('memberships')
      .insert({ brand_id: brandId, status: 'active', started_at: new Date().toISOString(), ...updatePayload })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  return NextResponse.json({ ok: true, membership: result })
}
