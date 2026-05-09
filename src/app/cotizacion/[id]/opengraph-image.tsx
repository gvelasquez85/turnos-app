import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Cotización'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: quote } = await service
    .from('sales')
    .select('id, total, created_at, brands ( name, logo_url, primary_color ), customers ( name )')
    .eq('id', id)
    .eq('type', 'quote')
    .maybeSingle()

  const brand = (quote?.brands as any) ?? {}
  const customer = (quote?.customers as any) ?? {}
  const brandName = brand.name ?? 'TurnFlow'
  const brandColor = brand.primary_color ?? '#4F46E5'
  const total = quote?.total ?? 0
  const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)
  const quoteNum = `#COT-${id.slice(-6).toUpperCase()}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '40px 60px',
            backgroundColor: brandColor,
          }}
        >
          {brand.logo_url && (
            <img
              src={brand.logo_url}
              width={60}
              height={60}
              style={{ borderRadius: 8, objectFit: 'contain' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' as const }}>
              Cotización
            </span>
            <span style={{ color: '#ffffff', fontSize: 36, fontWeight: 800 }}>
              {brandName}
            </span>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '40px 60px',
            gap: 24,
          }}
        >
          <span style={{ color: '#6B7280', fontSize: 22 }}>
            {quoteNum} {customer.name ? `· ${customer.name}` : ''}
          </span>
          <span style={{ color: '#111827', fontSize: 64, fontWeight: 800 }}>
            {fmt}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: 20 }}>
            Revisa los detalles y acepta en línea
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 60px',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          <span style={{ color: '#D1D5DB', fontSize: 16 }}>
            Generado con TurnFlow
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="9" fill="#4F46E5"/>
              <rect x="10" y="11" width="20" height="3.5" rx="1.75" fill="white"/>
              <rect x="18.25" y="11" width="3.5" height="15" rx="1.75" fill="white"/>
              <circle cx="13" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
              <circle cx="20" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
              <circle cx="27" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
            </svg>
            <span style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 600 }}>TurnFlow</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
