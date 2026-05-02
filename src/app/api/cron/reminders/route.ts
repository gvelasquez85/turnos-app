import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/cron/reminders
 *
 * Cron diario — corre a las 12:00 UTC (7 AM Colombia).
 * Configurado en vercel.json: "0 12 * * *"
 *
 * Acciones:
 *   1. Detectar clientes inactivos > 30 días y crear recordatorio
 *   2. Detectar cotizaciones sin respuesta > 3 días
 *   3. Detectar productos con stock bajo (stock <= stock_min o <= 3)
 *   4. Escribir alertas en la tabla `brand_alerts` para mostrar en el home
 */

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Verify cron secret to prevent unauthorized calls
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET || ''
  if (!secret) return true // allow if no secret set (dev)
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, number> = {
    inactiveAlerts: 0,
    quoteAlerts: 0,
    stockAlerts: 0,
    brandsProcessed: 0,
  }

  // Get all active brands
  const { data: brands } = await service
    .from('brands')
    .select('id, name, business_type')
    .eq('active', true)

  if (!brands?.length) return NextResponse.json({ ok: true, results })

  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const since3 = new Date(now.getTime() - 3 * 86400000).toISOString()

  for (const brand of brands) {
    results.brandsProcessed++

    // ── 1. Clientes inactivos > 30 días ──────────────────────────────
    const { data: inactiveCustomers, count: inactiveCount } = await service
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .lt('updated_at', since30)
      .not('phone', 'is', null)

    if ((inactiveCount ?? 0) > 0) {
      await upsertAlert(brand.id, 'inactive_clients', {
        count: inactiveCount,
        message: `${inactiveCount} cliente${(inactiveCount ?? 0) > 1 ? 's' : ''} ${(inactiveCount ?? 0) > 1 ? 'pueden' : 'puede'} volver a comprarte`,
        sub: `No han visitado en más de 30 días`,
        href: '/admin/clientes',
        priority: 'medium',
      })
      results.inactiveAlerts++
    } else {
      await clearAlert(brand.id, 'inactive_clients')
    }

    // ── 2. Cotizaciones sin respuesta > 3 días ───────────────────────
    const { count: openQuotesCount } = await service
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brand.id)
      .eq('type', 'quote')
      .in('status', ['draft', 'sent'])
      .lt('created_at', since3)

    if ((openQuotesCount ?? 0) > 0) {
      await upsertAlert(brand.id, 'open_quotes', {
        count: openQuotesCount,
        message: `${openQuotesCount} cotización${(openQuotesCount ?? 0) > 1 ? 'es' : ''} sin respuesta`,
        sub: `Llevan más de 3 días esperando`,
        href: '/admin/ventas/cotizaciones',
        priority: 'high',
      })
      results.quoteAlerts++
    } else {
      await clearAlert(brand.id, 'open_quotes')
    }

    // ── 3. Stock bajo ────────────────────────────────────────────────
    const { data: lowStockItems } = await service
      .from('products')
      .select('id, name, stock, stock_min')
      .eq('brand_id', brand.id)
      .eq('product_type', 'physical')
      .gt('stock', 0)
      .lte('stock', 5)

    const lowCount = lowStockItems?.length ?? 0
    if (lowCount > 0) {
      const first = lowStockItems![0]
      await upsertAlert(brand.id, 'low_stock', {
        count: lowCount,
        message: `${lowCount} producto${lowCount > 1 ? 's' : ''} con poco inventario`,
        sub: `${first.name}: quedan ${first.stock} unidades`,
        href: '/admin/ventas/inventario',
        priority: 'medium',
      })
      results.stockAlerts++
    } else {
      await clearAlert(brand.id, 'low_stock')
    }
  }

  return NextResponse.json({ ok: true, results })
}

async function upsertAlert(brandId: string, type: string, data: Record<string, unknown>) {
  await service.from('brand_alerts').upsert({
    brand_id: brandId,
    alert_type: type,
    data,
    updated_at: new Date().toISOString(),
    resolved: false,
  }, { onConflict: 'brand_id,alert_type' })
}

async function clearAlert(brandId: string, type: string) {
  await service.from('brand_alerts')
    .update({ resolved: true, updated_at: new Date().toISOString() })
    .eq('brand_id', brandId)
    .eq('alert_type', type)
}
