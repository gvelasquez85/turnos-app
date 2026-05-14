import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { saleId } = await req.json().catch(() => ({}))
  if (!saleId) return NextResponse.json({ error: 'Falta saleId' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Validate brand ownership
  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })

  // Load sale
  const { data: sale } = await service.from('sales').select('id, brand_id').eq('id', saleId).single()
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (profile.role !== 'superadmin' && sale.brand_id !== profile.brand_id)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  // Load sale_items with product info
  const { data: items } = await service
    .from('sale_items')
    .select('id, product_id, qty')
    .eq('sale_id', saleId)

  const links: string[] = []

  for (const item of items ?? []) {
    if (!item.product_id) continue
    const { data: product } = await service
      .from('products')
      .select('product_type, digital_url, download_limit')
      .eq('id', item.product_id)
      .single()

    if (!product || product.product_type !== 'digital' || !product.digital_url) continue

    // Create one download token per qty (e.g. qty=2 = 2 separate links)
    for (let i = 0; i < Math.max(1, item.qty); i++) {
      const { data: dl } = await service
        .from('digital_downloads')
        .insert({
          brand_id: sale.brand_id,
          sale_id: saleId,
          sale_item_id: item.id,
          product_id: item.product_id,
          max_downloads: product.download_limit ?? 3,
          digital_url: product.digital_url,
        })
        .select('token')
        .single()

      if (dl?.token) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.turnflow.com.co'
        links.push(`${appUrl}/api/download/${dl.token}`)
      }
    }
  }

  return NextResponse.json({ ok: true, links })
}
