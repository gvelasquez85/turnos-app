import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

/** Returns { brandId } on success, or { error, status } on failure */
export async function validateApiKey(
  request: Request,
): Promise<{ brandId: string } | { error: string; status: number }> {
  // Accept X-API-Key or Authorization: Bearer <key>
  const raw =
    request.headers.get('X-API-Key') ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')

  if (!raw) {
    return { error: 'Missing API key. Send it via X-API-Key header or Authorization: Bearer <key>', status: 401 }
  }

  const keyHash = crypto.createHash('sha256').update(raw).digest('hex')

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = await supabase
    .from('api_keys')
    .select('id, brand_id, active')
    .eq('key_hash', keyHash)
    .single()

  if (!data || !data.active) {
    return { error: 'Invalid or inactive API key', status: 401 }
  }

  // Update last_used_at fire-and-forget
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id).then()

  return { brandId: data.brand_id }
}

/** Standard CORS headers for all /api/v1/* routes */
export const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
}

/** Helper: preflight OPTIONS handler */
export function handleOptions() {
  return new Response(null, { status: 204, headers: API_CORS_HEADERS })
}
