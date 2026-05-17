import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('brand_id').eq('id', user.id).single()
  if (!profile?.brand_id) return new Response('{}', { status: 200 })

  const brandId = profile.brand_id
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: config }, { data: usage }] = await Promise.all([
    supabase.from('ai_configs').select('plan, daily_limit').eq('brand_id', brandId).maybeSingle(),
    supabase.from('ai_usage').select('query_count').eq('brand_id', brandId).eq('usage_date', today).maybeSingle(),
  ])

  const plan = config?.plan ?? 'free'
  const limit = config?.daily_limit ?? 5
  const used = usage?.query_count ?? 0

  return Response.json({ plan, limit, used, remaining: Math.max(0, limit - used) })
}
