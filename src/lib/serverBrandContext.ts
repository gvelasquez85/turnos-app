import { cookies } from 'next/headers'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Checks a single module subscription row for a brand and returns
 * { isExpired, expiredAt } — used in individual module pages.
 *
 * A subscription is considered expired when:
 *   - No row exists
 *   - status = 'expired' or 'cancelled'
 *   - status = 'trial' and trial_expires_at is in the past
 *   - status = 'active' and expires_at is in the past
 *
 * If the row is detected as expired by date (but DB still says trial/active),
 * it is auto-updated to 'expired' in the DB.
 */
export async function checkModuleAccess(
  supabase: SupabaseClient,
  brandId: string,
  moduleKey: string,
): Promise<{ isExpired: boolean; expiredAt: string | null }> {
  const { data: sub } = await supabase
    .from('module_subscriptions')
    .select('id, status, trial_expires_at, expires_at')
    .eq('brand_id', brandId)
    .eq('module_key', moduleKey)
    .maybeSingle()

  if (!sub) return { isExpired: true, expiredAt: null }

  const now = new Date().toISOString()

  // Status already expired/cancelled
  if (sub.status === 'expired' || sub.status === 'cancelled') {
    return { isExpired: true, expiredAt: sub.trial_expires_at ?? sub.expires_at ?? null }
  }

  // Trial expired by date
  if (sub.status === 'trial' && sub.trial_expires_at && sub.trial_expires_at < now) {
    // Auto-expire in DB (fire-and-forget)
    supabase.from('module_subscriptions').update({ status: 'expired' }).eq('id', sub.id).then(() => {
      supabase.from('brands').select('active_modules').eq('id', brandId).single().then(({ data }) => {
        if (data) {
          const updated = { ...((data.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: false }
          supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
        }
      })
    })
    return { isExpired: true, expiredAt: sub.trial_expires_at }
  }

  // Paid sub expired by date
  if (sub.status === 'active' && sub.expires_at && sub.expires_at < now) {
    supabase.from('module_subscriptions').update({ status: 'expired' }).eq('id', sub.id).then(() => {
      supabase.from('brands').select('active_modules').eq('id', brandId).single().then(({ data }) => {
        if (data) {
          const updated = { ...((data.active_modules as Record<string, boolean>) ?? {}), [moduleKey]: false }
          supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
        }
      })
    })
    return { isExpired: true, expiredAt: sub.expires_at }
  }

  // All good — active or valid trial
  return { isExpired: false, expiredAt: null }
}

/**
 * Returns the effective brand_id for a request.
 * - For brand_admin / manager / advisor: uses profile.brand_id (fixed).
 * - For superadmin: profile.brand_id is null → reads the `sa_brand` cookie.
 */
export async function getEffectiveBrandId(
  profileBrandId: string | null | undefined,
  role: string,
): Promise<string | null> {
  if (profileBrandId) return profileBrandId
  if (role === 'superadmin') {
    const cookieStore = await cookies()
    const id = cookieStore.get('sa_brand')?.value
    return id ?? null
  }
  return null
}

/**
 * All modules that require a valid subscription (trial or paid).
 * brands.active_modules is NOT trusted for these — only module_subscriptions is.
 */
const PAID_MODULES = ['queue', 'appointments', 'surveys', 'menu', 'mensajes'] as const
type PaidModule = (typeof PAID_MODULES)[number]

/**
 * Returns a verified activeModules map.
 *
 * Rules:
 * - For PAID_MODULES: a module is active only if there is a row in
 *   module_subscriptions with status='active' AND (expires_at is null OR in the future),
 *   OR status='trial' AND trial_expires_at is in the future.
 * - Expired trials are auto-written to the DB here so the rest of the app
 *   sees the correct state without waiting for a marketplace visit.
 * - brands.active_modules is ignored for paid modules (it can be stale).
 * - Free / unlisted modules pass through from rawModules unchanged.
 */
export async function getVerifiedActiveModules(
  supabase: SupabaseClient,
  brandId: string | null | undefined,
  rawModules: Record<string, boolean> | null | undefined,
): Promise<Record<string, boolean>> {
  const base: Record<string, boolean> = { ...(rawModules ?? {}) }
  if (!brandId) return base

  const now = new Date().toISOString()

  // Fetch all subscription rows for this brand's paid modules
  const { data: subs } = await supabase
    .from('module_subscriptions')
    .select('id, module_key, status, trial_expires_at, expires_at')
    .eq('brand_id', brandId)
    .in('module_key', [...PAID_MODULES])

  const rows = subs ?? []

  // Detect trials that have passed their expiry date and are still marked 'trial'
  const expiredTrialIds = rows
    .filter(s => s.status === 'trial' && s.trial_expires_at && s.trial_expires_at < now)
    .map(s => s.id as string)

  // Detect paid subs that have passed their expires_at and are still marked 'active'
  const expiredPaidIds = rows
    .filter(s => s.status === 'active' && s.expires_at && s.expires_at < now)
    .map(s => s.id as string)

  const allExpiredIds = [...expiredTrialIds, ...expiredPaidIds]

  // Auto-expire them in the DB (fire-and-forget — don't block the response)
  if (allExpiredIds.length > 0) {
    supabase
      .from('module_subscriptions')
      .update({ status: 'expired' })
      .in('id', allExpiredIds)
      .then(() => {
        // Also flip active_modules to false for expired modules
        const expiredKeys = rows
          .filter(s => allExpiredIds.includes(s.id as string))
          .map(s => s.module_key as string)

        if (expiredKeys.length > 0) {
          supabase
            .from('brands')
            .select('active_modules')
            .eq('id', brandId)
            .single()
            .then(({ data: brand }) => {
              if (brand) {
                const updated = { ...((brand.active_modules as Record<string, boolean>) ?? {}) }
                for (const key of expiredKeys) updated[key] = false
                supabase.from('brands').update({ active_modules: updated }).eq('id', brandId)
              }
            })
        }
      })
  }

  // Build verified map: a paid module is active only if its sub is currently valid
  for (const mod of PAID_MODULES) {
    const sub = rows.find(s => s.module_key === mod)
    if (!sub) {
      base[mod] = false
      continue
    }
    // Treat as expired if it was just detected above
    if (allExpiredIds.includes(sub.id as string)) {
      base[mod] = false
      continue
    }
    if (sub.status === 'trial') {
      base[mod] = !sub.trial_expires_at || sub.trial_expires_at > now
    } else if (sub.status === 'active') {
      base[mod] = !sub.expires_at || sub.expires_at > now
    } else {
      // expired / cancelled
      base[mod] = false
    }
  }

  // Consents module depends on queue being active
  if (!base.queue) {
    base.consents = false
  }

  return base
}
