import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/brand/expire-modules
 * Checks all trial module_subscriptions for the authenticated brand,
 * marks expired ones as 'expired', and removes them from brand's active_modules.
 * Safe to call on every marketplace page load.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_id')
    .eq('id', user.id)
    .single()

  const brandId = profile?.brand_id
  if (!brandId) return NextResponse.json({ expired: [] })

  const now = new Date().toISOString()

  // Find trials that have expired
  const { data: expiredSubs } = await supabase
    .from('module_subscriptions')
    .select('id, module_key')
    .eq('brand_id', brandId)
    .eq('status', 'trial')
    .lt('trial_expires_at', now)

  if (!expiredSubs || expiredSubs.length === 0) {
    return NextResponse.json({ expired: [] })
  }

  const expiredIds = expiredSubs.map(s => s.id)
  const expiredKeys = expiredSubs.map(s => s.module_key)

  // Mark subscriptions as expired
  await supabase
    .from('module_subscriptions')
    .update({ status: 'expired' })
    .in('id', expiredIds)

  // Remove from brand's active_modules
  const { data: brand } = await supabase
    .from('brands')
    .select('active_modules')
    .eq('id', brandId)
    .single()

  if (brand) {
    const current = (brand.active_modules as Record<string, boolean>) ?? {}
    const updated: Record<string, boolean> = { ...current }
    for (const key of expiredKeys) {
      updated[key] = false
    }
    await supabase
      .from('brands')
      .update({ active_modules: updated })
      .eq('id', brandId)
  }

  return NextResponse.json({ expired: expiredKeys })
}
