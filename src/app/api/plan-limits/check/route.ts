import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanDef } from '@/lib/planLimits'

/**
 * GET /api/plan-limits/check?resource=clients|products|sales
 * Returns { allowed: boolean, current: number, max: number | null, plan: string }
 */
export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get('resource')
  if (!resource || !['clients', 'products', 'sales'].includes(resource)) {
    return NextResponse.json({ error: 'Invalid resource' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id) {
    return NextResponse.json({ error: 'Sin marca' }, { status: 400 })
  }

  const brandId = profile.brand_id

  // Get plan
  const { data: mem } = await supabase
    .from('memberships')
    .select('plan')
    .eq('brand_id', brandId)
    .single()

  const planDef = getPlanDef(mem?.plan)

  let current = 0
  let max: number | null = null

  if (resource === 'clients') {
    const { count } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
    current = count ?? 0
    max = planDef.maxClients
  } else if (resource === 'products') {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .eq('active', true)
    current = count ?? 0
    max = planDef.maxProducts
  } else if (resource === 'sales') {
    // Count sales this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { count } = await supabase
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId)
      .gte('created_at', monthStart)
    current = count ?? 0
    max = planDef.maxSalesPerMonth
  }

  const allowed = max === null || current < max

  return NextResponse.json({
    allowed,
    current,
    max,
    plan: planDef.key,
  })
}
