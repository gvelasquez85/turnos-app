import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Generates a journal entry automatically from a sale.
 * Called conditionally when the brand has accounting module active
 * and auto_entries_on_sale = true in accounting_settings.
 *
 * Does NOT modify the sales table — only creates entries in accounting tables.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 403 })

  const { saleId, brandId } = await req.json().catch(() => ({}))
  const effectiveBrandId = brandId || profile.brand_id
  if (!saleId || !effectiveBrandId) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })

  // Validate ownership
  if (profile.role !== 'superadmin' && effectiveBrandId !== profile.brand_id)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Check settings
  const { data: settings } = await service
    .from('accounting_settings')
    .select('*')
    .eq('brand_id', effectiveBrandId)
    .single()

  if (!settings?.auto_entries_on_sale) {
    return NextResponse.json({ ok: false, reason: 'auto_entries_on_sale disabled' })
  }

  // Check if entry already exists for this sale
  const { data: existing } = await service
    .from('journal_entries')
    .select('id')
    .eq('brand_id', effectiveBrandId)
    .eq('source_type', 'sale')
    .eq('source_id', saleId)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, reason: 'already_exists', entryId: existing.id })

  // Load sale data (READ only — never writes)
  const { data: sale } = await service
    .from('sales')
    .select('id, total, subtotal, discount, status, type, created_at, customers(name)')
    .eq('id', saleId)
    .single()

  if (!sale || sale.type !== 'sale') {
    return NextResponse.json({ ok: false, reason: 'not_a_sale' })
  }

  // Get or create current period
  const saleDate = new Date(sale.created_at)
  const year = saleDate.getFullYear()
  const month = saleDate.getMonth() + 1

  let { data: period } = await service
    .from('accounting_periods')
    .select('id')
    .eq('brand_id', effectiveBrandId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (!period) {
    const { data: newPeriod } = await service.from('accounting_periods').insert({
      brand_id: effectiveBrandId,
      year,
      month,
      status: 'open',
    }).select('id').single()
    period = newPeriod
  }

  if (!period) return NextResponse.json({ error: 'No se pudo crear período' }, { status: 500 })

  // Determine accounts
  const salesAccount = settings.default_sales_account || '4135'
  const cashAccount = settings.default_cash_account || '110505'
  const taxAccount = settings.default_tax_account || '240801'

  // Calculate tax (assume 19% IVA if total > subtotal)
  const subtotal = sale.subtotal ?? sale.total
  const taxAmount = sale.total - subtotal
  const customerName = (sale.customers as any)?.name ?? 'Cliente'

  // Create journal entry
  const { data: entry, error: entryErr } = await service.from('journal_entries').insert({
    brand_id: effectiveBrandId,
    period_id: period.id,
    entry_date: saleDate.toISOString().split('T')[0],
    description: `Venta — ${customerName}`,
    source_type: 'sale',
    source_id: saleId,
    status: 'posted',
    posted_at: new Date().toISOString(),
    created_by: user.id,
  }).select('id').single()

  if (entryErr || !entry) {
    return NextResponse.json({ error: entryErr?.message || 'Error creando asiento' }, { status: 500 })
  }

  // Build lines
  const lines: any[] = [
    // Debit: Cash/Bank for total received
    { journal_entry_id: entry.id, brand_id: effectiveBrandId, account_code: cashAccount, debit: sale.total, credit: 0, description: 'Ingreso por venta' },
    // Credit: Sales revenue for subtotal
    { journal_entry_id: entry.id, brand_id: effectiveBrandId, account_code: salesAccount, debit: 0, credit: subtotal, description: 'Ingreso operacional' },
  ]

  // If there's tax, credit tax payable
  if (taxAmount > 0) {
    lines[1].credit = subtotal // Adjust sales to subtotal
    lines.push({
      journal_entry_id: entry.id, brand_id: effectiveBrandId, account_code: taxAccount, debit: 0, credit: taxAmount, description: 'IVA generado',
    })
  }

  await service.from('journal_entry_lines').insert(lines)

  return NextResponse.json({ ok: true, entryId: entry.id })
}
