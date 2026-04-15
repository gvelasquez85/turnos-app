import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST() {
  // Only superadmin can trigger manual updates (or this route is called by cron)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch from Open Exchange Rates (free tier, no API key needed for latest/USD)
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 0 },
    })
    const data = await res.json()

    if (!data.rates) {
      return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 502 })
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert COP and USD rates
    const currencies = ['COP', 'USD']
    const rows = currencies
      .filter(c => data.rates[c] !== undefined)
      .map(c => ({
        base_currency: 'USD',
        target_currency: c,
        rate: data.rates[c],
        source: 'open.er-api.com',
        updated_at: new Date().toISOString(),
      }))

    const { error } = await service
      .from('exchange_rates')
      .upsert(rows, { onConflict: 'base_currency,target_currency' })

    if (error) throw error

    return NextResponse.json({
      updated: true,
      rates: Object.fromEntries(currencies.map(c => [c, data.rates[c]])),
      timestamp: data.time_last_update_utc,
    })
  } catch (err) {
    console.error('exchange-rates update error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
