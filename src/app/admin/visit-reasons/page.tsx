import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitReasonsManager } from './VisitReasonsManager'

export default async function VisitReasonsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()

  // For superadmin without a brand, we can't show reasons — redirect to brands
  if (!profile?.brand_id && profile?.role !== 'superadmin') redirect('/')

  // Superadmin sees all brands; brand_admin sees only their brand
  let brandId = profile?.brand_id

  // If superadmin with no brand assigned, fetch the first brand as default
  if (!brandId && profile?.role === 'superadmin') {
    const { data: brands } = await supabase.from('brands').select('id').limit(1)
    brandId = brands?.[0]?.id || null
  }

  if (!brandId) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay marcas configuradas. <a href="/superadmin" className="text-indigo-600 underline">Crea una marca primero.</a>
      </div>
    )
  }

  const { data: reasons } = await supabase
    .from('visit_reasons')
    .select('*')
    .eq('brand_id', brandId)
    .order('sort_order')

  return <VisitReasonsManager brandId={brandId} reasons={reasons || []} />
}
