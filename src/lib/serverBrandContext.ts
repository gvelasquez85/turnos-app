import { cookies } from 'next/headers'

/**
 * Returns the effective brand_id for a request.
 * - For brand_admin / manager: uses profile.brand_id (fixed).
 * - For superadmin: profile.brand_id is null → reads the `sa_brand` cookie
 *   that the brand-selector widget sets on the client side.
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
