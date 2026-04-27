import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  // Role check
  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) {
    redirect('/admin')
  }

  // Superadmin without a specific brand context → send to superadmin panel
  // (they manage brands from /superadmin, not from the brand-level pages)
  if (profile.role === 'superadmin' && !profile.brand_id) {
    redirect('/superadmin')
  }

  const brandId = profile.brand_id as string

  // Load customers for this brand
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, email, document_id, first_visit_at, last_visit_at, total_visits, establishment_ids, celular, canal_contacto, ultima_compra, intereses, cumpleanos')
    .eq('brand_id', brandId)
    .order('last_visit_at', { ascending: false })

  // Load establishments for filter
  const { data: establishments } = await supabase
    .from('establishments')
    .select('id, name')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('name')

  // Clientes module is now ALWAYS free and visible — no trial expiry gating
  return (
    <CRMDashboard
      customers={customers ?? []}
      establishments={establishments ?? []}
      brandId={brandId}
    />
  )
}
