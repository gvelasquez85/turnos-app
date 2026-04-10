import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Keys that are overridable at runtime via system_settings table.
// NEXT_PUBLIC_* vars are baked at build time — shown read-only from process.env.
const RUNTIME_KEYS = [
  // Email — Brevo
  'BREVO_API_KEY',
  'COMMS_FROM_EMAIL',
  'COMMS_FROM_NAME',
  // Push notifications
  'FIREBASE_SERVER_KEY',
  // Infrastructure
  'VERCEL_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const PUBLIC_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

function mask(value: string | undefined): string {
  if (!value) return ''
  if (value.length <= 12) return '••••••••••••'
  return value.slice(0, 6) + '••••••••••••' + value.slice(-4)
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'superadmin') return null
  return user
}

/**
 * GET /api/superadmin/settings
 * Returns all integration vars:
 * - NEXT_PUBLIC_* → masked value from process.env (read-only, needs redeploy)
 * - Runtime keys  → masked value from system_settings (or process.env fallback)
 *
 * Response: { data: { KEY: { value: "abc•••xyz", source: "env"|"db", editable: bool } } }
 */
export async function GET() {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load DB overrides
  const { data: rows } = await service.from('system_settings').select('key, value')
  const dbValues: Record<string, string> = Object.fromEntries((rows ?? []).map((r: any) => [r.key, r.value]))

  const result: Record<string, { masked: string; source: 'env' | 'db'; editable: boolean; set: boolean }> = {}

  for (const key of PUBLIC_KEYS) {
    const val = process.env[key]
    result[key] = { masked: mask(val), source: 'env', editable: false, set: !!val }
  }

  for (const key of RUNTIME_KEYS) {
    const dbVal = dbValues[key]
    const envVal = process.env[key]
    const effective = dbVal || envVal
    result[key] = {
      masked: mask(effective),
      source: dbVal ? 'db' : (envVal ? 'env' : 'env'),
      editable: true,
      set: !!effective,
    }
  }

  return NextResponse.json({ data: result })
}

/**
 * POST /api/superadmin/settings
 * Save one or more runtime keys to system_settings.
 * Body: { "FIREBASE_SERVER_KEY": "new_value", ... }
 * Pass empty string to clear a key (reverts to env var).
 */
export async function POST(req: NextRequest) {
  const user = await requireSuperadmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: Record<string, string> = await req.json().catch(() => ({}))

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  for (const [key, value] of Object.entries(body)) {
    if (!RUNTIME_KEYS.includes(key)) continue // reject unknown / non-editable keys
    if (value.trim()) {
      await service.from('system_settings').upsert(
        { key, value: value.trim(), updated_at: new Date().toISOString(), updated_by: user.id },
        { onConflict: 'key' },
      )
    } else {
      // Empty value = remove override, fall back to env var
      await service.from('system_settings').delete().eq('key', key)
    }
  }

  return NextResponse.json({ success: true })
}
