import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

// Public page — no auth required. URL itself is the "secret".

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

export default async function PublicQuotePage({ params }: { params: { id: string } }) {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: quote } = await service
    .from('sales')
    .select('id, total, subtotal, discount, notes, created_at, status, sent_to_email, brands(name, logo_url), customers(name, email, phone)')
    .eq('id', params.id)
    .eq('type', 'quote')
    .single()

  if (!quote) notFound()

  // Mark first open
  await service
    .from('sales')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('opened_at', null)

  const { data: items } = await service
    .from('sale_items')
    .select('product_name, qty, unit_price, line_total, product_sku')
    .eq('sale_id', params.id)

  const brand = quote.brands as any
  const customer = quote.customers as any
  const quoteDate = new Date(quote.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
  const quoteNum = `COT-${params.id.slice(-6).toUpperCase()}`

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador', sent: 'Enviada', accepted: 'Aceptada',
    rejected: 'Rechazada', converted: 'Convertida en venta',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Brand header */}
        <div className="bg-indigo-600 rounded-t-2xl px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {brand?.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-10 rounded-lg object-contain bg-white/10 p-1" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                  {(brand?.name ?? 'T').charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{brand?.name ?? 'TurnFlow'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs uppercase tracking-widest">Cotización</p>
              <p className="font-mono font-bold text-xl">#{quoteNum}</p>
              <p className="text-indigo-200 text-sm">{quoteDate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg px-8 py-6">
          {/* Status */}
          <div className="mb-5 flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
              quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
              quote.status === 'rejected' ? 'bg-red-100 text-red-600' :
              'bg-gray-100 text-gray-500'
            }`}>
              {STATUS_LABELS[quote.status] ?? quote.status}
            </span>
          </div>

          {/* Customer */}
          {customer?.name && (
            <div className="mb-5 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dirigida a</p>
              <p className="font-semibold text-gray-900">{customer.name}</p>
              {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
              {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
            </div>
          )}

          {/* Items */}
          <table className="w-full text-sm mb-5">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto / Servicio</th>
                <th className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Cant.</th>
                <th className="py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">P. Unit.</th>
                <th className="py-2 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(items ?? []).map((it, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{it.product_name}</td>
                  <td className="py-3 text-center text-gray-600">{it.qty}</td>
                  <td className="py-3 text-right text-gray-600">{fmt(it.unit_price)}</td>
                  <td className="py-3 text-right font-semibold">{fmt(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {(quote.discount ?? 0) > 0 && (
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-gray-500">Descuento</td>
                  <td className="pt-3 text-right text-red-500 font-semibold">−{fmt(quote.discount ?? 0)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="pt-3 text-right font-bold text-gray-900">Total</td>
                <td className="pt-3 text-right font-black text-xl text-indigo-700">{fmt(quote.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Notes */}
          {quote.notes && (
            <div className="p-4 bg-indigo-50 rounded-xl mb-5 border-l-4 border-indigo-400">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Notas</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* CTA (if still pending) */}
          {['sent', 'draft'].includes(quote.status) && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-4">¿Aceptas esta cotización?</p>
              <div className="flex gap-3 justify-center">
                <a
                  href={`/cotizacion/${params.id}/aceptar`}
                  className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 transition-colors"
                >
                  ✓ Aceptar cotización
                </a>
                <a
                  href={`/cotizacion/${params.id}/rechazar`}
                  className="px-6 py-2.5 bg-white text-gray-500 font-semibold rounded-xl text-sm border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Rechazar
                </a>
              </div>
            </div>
          )}

          {quote.status === 'accepted' && (
            <div className="mt-5 py-4 bg-green-50 rounded-xl text-center">
              <p className="text-green-700 font-semibold">✓ Cotización aceptada</p>
              <p className="text-sm text-green-600 mt-1">Nos pondremos en contacto contigo pronto.</p>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Generado por {brand?.name ?? 'TurnFlow'} · Powered by TurnFlow</p>
          </div>
        </div>
      </div>
    </div>
  )
}
