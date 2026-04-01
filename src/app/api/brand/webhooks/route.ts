import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const EVENTS = ['ticket.created', 'ticket.attended', 'ticket.done', 'ticket.cancelled']

/** GET /api/brand/webhooks — get webhook config for current brand */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data } = await supabase
    .from('webhook_endpoints')
    .select('id, event, url, active')
    .eq('brand_id', profile.brand_id)

  // Return a map event → { id, url, active } — empty string if not configured
  const map = Object.fromEntries(EVENTS.map(e => [e, { id: null, url: '', active: false }]))
  ;(data ?? []).forEach((row: any) => { map[row.event] = { id: row.id, url: row.url, active: row.active } })

  return NextResponse.json({ data: map })
}

/**
 * PUT /api/brand/webhooks — upsert webhook URLs
 * Body: { "ticket.created": "https://...", "ticket.attended": "https://...", ... }
 * Pass empty string to clear/disable an event.
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id || !['brand_admin', 'manager', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body: Record<string, string> = await req.json().catch(() => ({}))

  for (const event of EVENTS) {
    const url = (body[event] ?? '').trim()
    if (url) {
      // Validate URL format
      try { new URL(url) } catch {
        return NextResponse.json({ error: `Invalid URL for event ${event}: ${url}` }, { status: 400 })
      }
      await supabase
        .from('webhook_endpoints')
        .upsert({ brand_id: profile.brand_id, event, url, active: true }, { onConflict: 'brand_id,event' })
    } else {
      // Empty = delete/disable this event
      await supabase
        .from('webhook_endpoints')
        .delete()
        .eq('brand_id', profile.brand_id)
        .eq('event', event)
    }
  }

  return NextResponse.json({ success: true })
}
