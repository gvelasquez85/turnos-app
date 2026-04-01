import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function generateKey(): { full: string; prefix: string; hash: string } {
  const random = crypto.randomBytes(24).toString('hex') // 48 hex chars
  const full = `ta_${random}`
  const prefix = full.slice(0, 16) // "ta_" + 13 chars for display
  const hash = crypto.createHash('sha256').update(full).digest('hex')
  return { full, prefix, hash }
}

/** GET /api/brand/api-keys — list keys for current brand (no hashes, no full keys) */
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
    .from('api_keys')
    .select('id, name, key_prefix, active, created_at, last_used_at')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: data ?? [] })
}

/** POST /api/brand/api-keys — create a new key. Returns full key ONCE. */
export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}))
  const name = (body.name as string)?.trim() || 'Clave principal'

  const { full, prefix, hash } = generateKey()

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      brand_id: profile.brand_id,
      name,
      key_prefix: prefix,
      key_hash: hash,
      active: true,
    })
    .select('id, name, key_prefix, active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return full key ONLY on creation — it won't be retrievable again
  return NextResponse.json({ data: { ...data, full_key: full } }, { status: 201 })
}
