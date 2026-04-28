import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { QuoteDesigner } from './QuoteDesigner'

export default async function QuoteDesignerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  // Load brand info including saved template
  const { data: brand } = await supabase
    .from('brands').select('id, name, logo_url, quote_template').eq('id', brandId).single()

  return (
    <QuoteDesigner
      brandId={brandId}
      brandName={brand?.name ?? ''}
      brandLogoUrl={(brand as any)?.logo_url ?? null}
      savedTemplate={(brand as any)?.quote_template ?? null}
    />
  )
}
