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

  const exportData: Record<string, unknown[]> = {}

  // Export data based on module
  if (['queue', 'colas'].includes(moduleKey)) {
    const { data: tickets } = await service.from('tickets')
      .select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10000)
    const { data: reasons } = await service.from('visit_reasons').select('*').eq('brand_id', brandId)
    exportData.tickets = tickets ?? []
    exportData.visit_reasons = reasons ?? []
  }

  if (['appointments', 'citas'].includes(moduleKey)) {
    const { data: appointments } = await service.from('appointments')
      .select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10000)
    exportData.appointments = appointments ?? []
  }

  if (['surveys', 'encuestas'].includes(moduleKey)) {
    const { data: surveys } = await service.from('surveys').select('*').eq('brand_id', brandId)
    const { data: responses } = await service.from('survey_responses')
      .select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10000)
    exportData.surveys = surveys ?? []
    exportData.survey_responses = responses ?? []
  }

  if (['sales', 'ventas'].includes(moduleKey)) {
    const { data: sales } = await service.from('sales')
      .select('*, sale_items(*)').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10000)
    const { data: products } = await service.from('products').select('*').eq('brand_id', brandId)
    exportData.sales = sales ?? []
    exportData.products = products ?? []
  }

  if (['clientes', 'crm'].includes(moduleKey)) {
    const { data: customers } = await service.from('customers')
      .select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(10000)
    const { data: tags } = await service.from('customer_tags').select('*')
      .in('customer_id', (customers ?? []).map((c: any) => c.id))
    exportData.customers = customers ?? []
    exportData.customer_tags = tags ?? []
  }

  if (['menu'].includes(moduleKey)) {
    const { data: menus } = await service.from('menus').select('*').eq('brand_id', brandId)
    exportData.menus = menus ?? []
  }

  return NextResponse.json({
    ok: true,
    module: moduleKey,
    brand_id: brandId,
    exported_at: new Date().toISOString(),
    data: exportData,
  })
}
