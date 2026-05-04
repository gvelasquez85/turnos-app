import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { CRMDashboard } from './CRMDashboard'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const [customersRes, establishmentsRes, brandRes, waRes, waDefaultRes] = await Promise.allSettled([
    supabase
      .from('customers')
      .select('id, name, phone, email, document_id, first_visit_at, last_visit_at, total_visits, establishment_ids, celular, canal_contacto, ultima_compra, intereses, cumpleanos')
      .eq('brand_id', brandId)
      .order('last_visit_at', { ascending: false }),
    supabase
      .from('establishments')
      .select('id, name')
      .eq('brand_id', brandId)
      .eq('active', true)
      .order('name'),
    supabase
      .from('brands')
      .select('business_type, name')
      .eq('id', brandId)
      .single(),
    supabase.from('wa_templates').select('category, body').eq('brand_id', brandId),
    supabase.from('wa_default_templates').select('category, body'),
  ])

  const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data ?? []) : []
  const establishments = establishmentsRes.status === 'fulfilled' ? (establishmentsRes.value.data ?? []) : []
  const brand = brandRes.status === 'fulfilled' ? brandRes.value.data : null
  const waDefaultMap = Object.fromEntries((waDefaultRes.status === 'fulfilled' ? waDefaultRes.value.data ?? [] : []).map((d: any) => [d.category, d.body]))
  const waBrandMap   = Object.fromEntries((waRes.status === 'fulfilled' ? waRes.value.data ?? [] : []).map((t: any) => [t.category, t.body]))
  const waTemplates = Object.entries({ ...waDefaultMap, ...waBrandMap }).map(([category, body]) => ({ category, body: body as string }))

  return (
    <CRMDashboard
      customers={customers as any[]}
      establishments={establishments ?? []}
      brandId={brandId}
      businessType={(brand as any)?.business_type ?? 'otros'}
      waTemplates={waTemplates}
      brandName={(brand as any)?.name ?? ''}
    />
  )
}
