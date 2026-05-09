import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { SITE_CONTENT_DEFAULTS, refreshSiteContentCache } from '@/lib/siteContent'

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') return null
  return user
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = getServiceClient()
  const { data: rows } = await service.from('site_content').select('key, value')

  const result: Record<string, string> = { ...SITE_CONTENT_DEFAULTS }
  if (rows) {
    for (const row of rows) {
      result[row.key] = row.value
    }
  }

  return NextResponse.json({ data: result })
}

export async function PUT(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const items: { key: string; value: string }[] = body.items ?? (body.key ? [{ key: body.key, value: body.value }] : [])

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }

  const service = getServiceClient()

  for (const { key, value } of items) {
    if (!key || typeof value !== 'string') continue
    await service.from('site_content').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
  }

  // Refresh file cache with latest DB data
  await refreshSiteContentCache()

  return NextResponse.json({ success: true })
}

/** POST: on-demand cache refresh without saving anything */
export async function POST() {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await refreshSiteContentCache()

  return NextResponse.json({ success: true, message: 'Cache actualizado' })
}
