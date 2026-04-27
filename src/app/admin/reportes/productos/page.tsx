import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { ReporteProductos } from './ReporteProductos'

export default async function ReporteProductosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? '')) redirect('/admin')
  if (profile.role === 'superadmin' && !profile.brand_id) redirect('/superadmin')

  const brandId = profile.brand_id as string

  let isExpired = false, expiredAt: string | null = null
  const { data: sub } = await supabase.from('module_subscriptions')
    .select('status, trial_expires_at, expires_at')
    .eq('brand_id', brandId).eq('module_key', 'sales').maybeSingle()
  if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
    isExpired = true; expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
  }

  // Get sale items joined with products
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('product_id, product_name, qty, line_total, sales!inner(brand_id, type, status, created_at)')
    .eq('sales.brand_id', brandId)
    .eq('sales.type', 'sale')
    .eq('sales.status', 'completed')

  const { data: products } = await supabase
    .from('products').select('id, name, stock, min_stock, price, category').eq('brand_id', brandId).eq('active', true)

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Ventas e Inventario" expiredAt={expiredAt}>
      <ReporteProductos
        saleItems={(saleItems ?? []) as any[]}
        products={products ?? []}
      />
    </TrialExpiredGate>
  )
}
