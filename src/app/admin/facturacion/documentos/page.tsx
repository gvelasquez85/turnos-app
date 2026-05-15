import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import DocumentosManager from './DocumentosManager'

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: documents } = await supabase
    .from('electronic_documents')
    .select('id, document_type, prefix, consecutive, customer_name, customer_id_number, subtotal, tax_total, total, status, cufe, created_at')
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: fiscalConfig } = await supabase
    .from('fiscal_configs')
    .select('nit, environment')
    .eq('brand_id', brandId)
    .maybeSingle()

  return (
    <DocumentosManager
      brandId={brandId}
      documents={documents ?? []}
      hasConfig={!!fiscalConfig?.nit}
      environment={fiscalConfig?.environment ?? 'testing'}
    />
  )
}
