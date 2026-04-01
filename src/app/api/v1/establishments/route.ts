import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/establishments
 * List all active establishments for the authenticated brand.
 *
 * Headers: X-API-Key: ta_...
 *
 * Response 200:
 * {
 *   "data": [
 *     { "id": "uuid", "name": "...", "slug": "...", "address": "...", "city": "..." }
 *   ],
 *   "count": 2
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data, error } = await supabase
    .from('establishments')
    .select('id, name, slug, address, city')
    .eq('brand_id', auth.brandId)
    .eq('active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: API_CORS_HEADERS })
  }

  return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 }, { headers: API_CORS_HEADERS })
}
