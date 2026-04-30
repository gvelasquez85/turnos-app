import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function ResponderQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}) {
  const { id } = await params
  const { action } = await searchParams

  if (!id || !['accept', 'reject'].includes(action ?? '')) {
    redirect(`/cotizacion/${id}`)
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  // Load quote before updating (need brand_id, customer_id, etc.)
  const { data: quote } = await service
    .from('sales')
    .select('id, brand_id, establishment_id, customer_id, total, subtotal, discount, notes')
    .eq('id', id)
    .eq('type', 'quote')
    .in('status', ['sent', 'draft'])
    .maybeSingle()

  if (quote) {
    // Update quote status
    await service.from('sales').update({ status: newStatus }).eq('id', id)

    // If accepted → auto-create a pending sale for review
    if (newStatus === 'accepted') {
      const { data: newSale } = await service.from('sales').insert({
        brand_id: quote.brand_id,
        establishment_id: quote.establishment_id,
        customer_id: quote.customer_id,
        type: 'sale',
        status: 'pending',
        total: quote.total,
        subtotal: quote.subtotal ?? quote.total,
        discount: quote.discount ?? 0,
        notes: `[Por revisar] Desde cotización #${id.slice(-6).toUpperCase()}${quote.notes ? `\n${quote.notes}` : ''}`,
        source_quote_id: id,
      }).select().single()

      // Update inventory based on quote items
      if (newSale?.id) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.turnflow.co'
          await fetch(`${appUrl}/api/admin/sales/update-inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saleId: newSale.id, brandId: quote.brand_id }),
          })
        } catch {}
      }
    }
  }

  redirect(`/cotizacion/${id}`)
}
