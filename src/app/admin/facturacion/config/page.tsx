import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import FiscalConfig from './FiscalConfig'

export default async function FiscalConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: config } = await supabase
    .from('fiscal_configs')
    .select('*')
    .eq('brand_id', brandId)
    .maybeSingle()

  // Load DIAN catalogs for dropdowns
  const { data: docTypes } = await supabase
    .from('dian_document_types').select('code, name').order('code')

  const { data: taxResponsibilities } = await supabase
    .from('dian_tax_responsibilities').select('code, name').order('code')

  const { data: departments } = await supabase
    .from('dian_departments').select('code, name').order('name')

  const { data: municipalities } = await supabase
    .from('dian_municipalities').select('code, name, department_code').order('name')

  return (
    <FiscalConfig
      brandId={brandId}
      config={config}
      docTypes={docTypes ?? []}
      taxResponsibilities={taxResponsibilities ?? []}
      departments={departments ?? []}
      municipalities={municipalities ?? []}
    />
  )
}
