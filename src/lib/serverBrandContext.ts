import { cookies } from 'next/headers'
import { SupabaseClient } from '@supabase/supabase-js'

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

const PAID_MODULES = ['queue', 'appointments', 'surveys', 'menu'] as const

/**
 * Returns a verified activeModules map where paid modules are validated
 * against module_subscriptions (status active or trialing).
 * Prevents stale brands.active_modules from showing expired modules.
 */
export async function getVerifiedActiveModules(
  supabase: SupabaseClient,
  brandId: string | null | undefined,
  rawModules: Record<string, boolean> | null | undefined,
): Promise<Record<string, boolean>> {
  const base: Record<string, boolean> = { ...(rawModules ?? {}) }
  if (!brandId) return base

  const { data: subs } = await supabase
    .from('module_subscriptions')
    .select('module_key, status')
    .eq('brand_id', brandId)
    .in('status', ['active', 'trialing'])

  const activeSubs = new Set((subs ?? []).map((s: any) => s.module_key as string))
  for (const mod of PAID_MODULES) {
    base[mod] = activeSubs.has(mod)
  }
  return base
}
