import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId, checkModuleAccess } from '@/lib/serverBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import FacturacionDashboard from './FacturacionDashboard'

export default async function FacturacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const moduleAccess = await checkModuleAccess(supabase, brandId, 'facturacion')

  // Load fiscal config
  const { data: fiscalConfig } = await supabase
    .from('fiscal_configs')
    .select('*')
    .eq('brand_id', brandId)
    .maybeSingle()

  // Load recent documents
  const { data: recentDocs } = await supabase
    .from('electronic_documents')
    .select('id, document_type, prefix, consecutive, customer_name, total, status, created_at')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Load active resolution
  const { data: resolution } = await supabase
    .from('invoice_resolutions')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .eq('document_type', 'invoice')
    .maybeSingle()

  // Count documents this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const { count: monthCount } = await supabase
    .from('electronic_documents')
    .select('id', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .gte('created_at', startOfMonth.toISOString())

  return (
    <TrialExpiredGate isExpired={moduleAccess.isExpired} moduleLabel="Facturación Electrónica" expiredAt={moduleAccess.expiredAt}>
      <FacturacionDashboard
        brandId={brandId}
        fiscalConfig={fiscalConfig}
        recentDocs={recentDocs ?? []}
        resolution={resolution}
        monthCount={monthCount ?? 0}
      />
    </TrialExpiredGate>
  )
}
