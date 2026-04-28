import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { ReporteProductos } from './ReporteProductos'

export default async function ReporteProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  const [productsRes, saleItemsRes] = await Promise.allSettled([
    supabase.from('products').select('id, name, stock, min_stock, price, category').eq('brand_id', brandId).eq('active', true),
    supabase.from('sale_items')
      .select('product_id, product_name, qty, line_total, sales!inner(brand_id, type, status, created_at)')
      .eq('sales.brand_id', brandId).eq('sales.type', 'sale').eq('sales.status', 'completed'),
  ])

  const products = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []
  const saleItems = saleItemsRes.status === 'fulfilled' ? (saleItemsRes.value.data ?? []) : []

  return <ReporteProductos saleItems={saleItems as any[]} products={products as any[]} />
}
