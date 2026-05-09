import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { resolveTemplate } from '@/lib/quoteTemplate'
import { QuoteView } from '@/components/QuoteView'
import type { Metadata } from 'next'

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const service = getService()

  const { data: quote } = await service
    .from('sales')
    .select('id, total, brands ( name, logo_url, primary_color )')
    .eq('id', id)
    .eq('type', 'quote')
    .maybeSingle()

  if (!quote) return { title: 'Cotización no encontrada' }

  const brand = quote.brands as any
  const brandName = brand?.name ?? 'TurnFlow'
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const title = `Cotización de ${brandName} · ${fmt(quote.total)}`
  const description = `Cotización #COT-${id.slice(-6).toUpperCase()} por ${fmt(quote.total)}. Revisa los detalles y acepta en línea.`

  const images: { url: string; width?: number; height?: number; alt?: string }[] = []
  if (brand?.logo_url) {
    images.push({ url: brand.logo_url, alt: brandName })
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: brandName,
      type: 'website',
      ...(images.length > 0 && { images }),
    },
  }
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const service = getService()

  // Load quote + brand (including saved template) + establishment
  // Use * for joins to avoid errors from columns that may not exist yet in the DB
  const { data: quote } = await service
    .from('sales')
    .select(`
      id, total, subtotal, discount, notes, created_at, status, establishment_id,
      brands ( * ),
      customers ( name, email, phone ),
      establishments ( * )
    `)
    .eq('id', id)
    .eq('type', 'quote')
    .maybeSingle()

  if (!quote) notFound()

  // Load line items
  const { data: items } = await service
    .from('sale_items')
    .select('product_name, product_sku, qty, unit_price, line_total')
    .eq('sale_id', id)

  // NOTE: opened_at is tracked ONLY via the email pixel (/api/quotes/track/[id]).
  // Do NOT update it here — this page is the customer's view and can be
  // accessed directly (e.g. from a shared link) without opening the email.

  const brand = quote.brands as any
  const customer = quote.customers as any
  const establishment = (quote as any).establishments as any

  // Merge saved template with defaults
  const template = resolveTemplate(brand?.quote_template ?? null)

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <QuoteView
        t={template}
        data={{
          id: quote.id,
          status: quote.status,
          total: quote.total,
          subtotal: quote.subtotal ?? quote.total,
          discount: quote.discount,
          notes: quote.notes,
          created_at: quote.created_at,
          brandName: brand?.name ?? 'TurnFlow',
          brandLogoUrl: brand?.logo_url ?? null,
          brandPhone: (brand as any)?.phone ?? null,
          brandEmail: (brand as any)?.email ?? null,
          brandAddress: establishment?.address ?? (brand as any)?.address ?? null,
          brandWebsite: (brand as any)?.website ?? null,
          customerName: customer?.name ?? null,
          customerEmail: customer?.email ?? null,
          customerPhone: customer?.phone ?? null,
          items: (items ?? []) as any[],
        }}
        showActions
      />
      <p className="text-center text-xs text-gray-400 mt-6">
        Cotización generada con TurnFlow
      </p>
    </div>
  )
}
