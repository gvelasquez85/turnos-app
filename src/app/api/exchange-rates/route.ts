import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// In-memory cache: valid for 1 hour
let cache: { rates: Record<string, number>; updatedAt: string } | null = null
let cacheTime = 0

export async function GET() {
  const now = Date.now()
  if (cache && now - cacheTime < 3_600_000) {
    return NextResponse.json(cache)
  }

  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await service
      .from('exchange_rates')
      .select('target_currency, rate, updated_at')
      .eq('base_currency', 'USD')

    if (data && data.length > 0) {
      const rates: Record<string, number> = {}
      let updatedAt = ''
      for (const row of data) {
        rates[row.target_currency] = Number(row.rate)
        if (!updatedAt || row.updated_at > updatedAt) updatedAt = row.updated_at
      }
      cache = { rates, updatedAt }
      cacheTime = now
      return NextResponse.json(cache)
    }
  } catch (e) {
    console.error('exchange-rates GET error', e)
  }

  // Fallback
  return NextResponse.json({ rates: { USD: 1, COP: 4200 }, updatedAt: new Date().toISOString() })
}
