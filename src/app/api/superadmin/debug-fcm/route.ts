/**
 * Diagnóstico de configuración FCM (solo superadmin)
 * GET /api/superadmin/debug-fcm
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function tryParseServiceAccount(raw: string): { ok: boolean; project_id?: string; client_email?: string; has_key?: boolean; error?: string } {
  // Intento 1: JSON directo
  try {
    const p = JSON.parse(raw)
    return { ok: true, project_id: p.project_id, client_email: p.client_email, has_key: !!p.private_key }
  } catch (e1) {}

  // Intento 2: reemplazar saltos de línea reales dentro del valor (Vercel a veces los introduce)
  try {
    const fixed = raw.replace(/\n/g, '\\n').replace(/\r/g, '')
    const p = JSON.parse(fixed)
    return { ok: true, project_id: p.project_id, client_email: p.client_email, has_key: !!p.private_key }
  } catch (e2) {}

  // Intento 3: trim
  try {
    const p = JSON.parse(raw.trim())
    return { ok: true, project_id: p.project_id, client_email: p.client_email, has_key: !!p.private_key }
  } catch (e3: any) {
    return { ok: false, error: String(e3) }
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result: Record<string, unknown> = {}

  // ── 1. Env var directa ──────────────────────────────────────────────────────
  const envRaw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!envRaw) {
    result.env_var = { present: false, hint: 'FIREBASE_SERVICE_ACCOUNT no está definida en las variables de entorno de Vercel' }
  } else {
    result.env_var = {
      present: true,
      length: envRaw.length,
      starts_with: envRaw.slice(0, 30).replace(/\n/g, '\\n'),
      parse: tryParseServiceAccount(envRaw),
    }
  }

  // ── 2. system_settings en DB ────────────────────────────────────────────────
  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await service
      .from('system_settings')
      .select('value')
      .eq('key', 'FIREBASE_SERVICE_ACCOUNT')
      .single()

    if (error && error.code !== 'PGRST116') {
      result.db = { present: false, error: error.message }
    } else if (data?.value) {
      result.db = {
        present: true,
        length: data.value.length,
        parse: tryParseServiceAccount(data.value),
      }
    } else {
      result.db = { present: false, hint: 'No hay fila con key=FIREBASE_SERVICE_ACCOUNT en system_settings' }
    }
  } catch (e: any) {
    result.db = { present: false, error: String(e) }
  }

  // ── 3. Otras vars Firebase ──────────────────────────────────────────────────
  result.other_firebase_vars = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ presente' : '❌ ausente',
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ presente' : '❌ ausente',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✅ presente' : '❌ ausente',
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '✅ presente' : '❌ ausente',
  }

  return NextResponse.json(result, { status: 200 })
}
