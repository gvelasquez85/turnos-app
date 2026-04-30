import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Updates inventory when a sale is created.
 * Decrements product stock and creates stock_movement records.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { saleId, brandId } = await req.json().catch(() => ({}))
  if (!saleId || !brandId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load sale_items
  const { data: items } = await service
    .from('sale_items')
    .select('product_id, product_name, qty')
    .eq('sale_id', saleId)

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, msg: 'No hay items en la venta' })
  }

  // Decrement stock for each item
  for (const item of items) {
    if (!item.product_id) continue

    const { data: product } = await service
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()

    if (!product) continue

    const newStock = Math.max(0, product.stock - Math.ceil(item.qty))

    // Update product stock
    await service.from('products')
      .update({ stock: newStock })
      .eq('id', item.product_id)

    // Create stock movement record
    await service.from('stock_movements').insert({
      product_id: item.product_id,
      brand_id: brandId,
      type: 'sale',
      qty_change: -Math.ceil(item.qty),
      qty_after: newStock,
      reference_id: saleId,
    })
  }

  return NextResponse.json({ ok: true, msg: 'Inventario actualizado' })
}
