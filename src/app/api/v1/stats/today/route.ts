import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateApiKey, API_CORS_HEADERS, handleOptions } from '@/lib/apiAuth'

export async function OPTIONS() { return handleOptions() }

/**
 * GET /api/v1/stats/today
 * Summary statistics for today across all (or one) establishment.
 *
 * Query params:
 *   establishment   UUID (optional — defaults to all brand establishments)
 *
 * Response 200:
 * {
 *   "data": {
 *     "date": "2026-04-01",
 *     "total": 45,
 *     "waiting": 3,
 *     "in_progress": 1,
 *     "done": 38,
 *     "cancelled": 3,
 *     "avg_wait_minutes": 7,
 *     "by_establishment": [
 *       { "id": "uuid", "name": "...", "waiting": 2, "done": 20 }
 *     ]
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status, headers: API_CORS_HEADERS })
  }

  const { searchParams } = new URL(req.url)
  const establishmentId = searchParams.get('establishment')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  // Resolve establishment IDs for this brand
  let estIds: string[] = []
  let estMap: Record<string, string> = {}
  if (establishmentId) {
    estIds = [establishmentId]
  } else {
    const { data: ests } = await supabase
      .from('establishments')
      .select('id, name')
      .eq('brand_id', auth.brandId)
      .eq('active', true)
    estIds = (ests ?? []).map((e: any) => e.id)
    estMap = Object.fromEntries((ests ?? []).map((e: any) => [e.id, e.name]))
  }

  if (!estIds.length) {
    return NextResponse.json({
      data: { date: todayStart.toISOString().slice(0, 10), total: 0, waiting: 0, in_progress: 0, done: 0, cancelled: 0, avg_wait_minutes: 0, by_establishment: [] },
    }, { headers: API_CORS_HEADERS })
  }

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, status, created_at, attended_at, establishment_id')
    .in('establishment_id', estIds)
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  const rows = tickets ?? []

  const counts = { waiting: 0, in_progress: 0, done: 0, cancelled: 0 }
  let waitSum = 0, waitCount = 0
  const byEst: Record<string, { waiting: number; in_progress: number; done: number; cancelled: number }> = {}

  rows.forEach((t: any) => {
    counts[t.status as keyof typeof counts] = (counts[t.status as keyof typeof counts] ?? 0) + 1
    if (!byEst[t.establishment_id]) byEst[t.establishment_id] = { waiting: 0, in_progress: 0, done: 0, cancelled: 0 }
    byEst[t.establishment_id][t.status as keyof typeof counts]++
    if (t.status === 'done' && t.attended_at) {
      waitSum += (new Date(t.attended_at).getTime() - new Date(t.created_at).getTime()) / 60000
      waitCount++
    }
  })

  return NextResponse.json({
    data: {
      date: todayStart.toISOString().slice(0, 10),
      total: rows.length,
      ...counts,
      avg_wait_minutes: waitCount > 0 ? Math.round(waitSum / waitCount) : 0,
      by_establishment: estIds.map(id => ({
        id,
        name: estMap[id] ?? id,
        ...(byEst[id] ?? { waiting: 0, in_progress: 0, done: 0, cancelled: 0 }),
      })),
    },
  }, { headers: API_CORS_HEADERS })
}
