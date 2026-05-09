import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * After email confirmation or magic link, ensures the user has a profile
 * with role=brand_admin, then redirects:
 *   - Users with a brand that completed onboarding → /admin
 *   - Everyone else → /onboarding (which handles brand creation if needed)
 */
async function resolveDestination(userId: string, email: string, fullName: string | null): Promise<string> {
  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Check if profile exists
  const { data: profile } = await service
    .from('profiles')
    .select('id, brand_id, role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.brand_id) {
    // Has a brand — check if onboarding is done
    const { data: brand } = await service
      .from('brands')
      .select('onboarding_completed')
      .eq('id', profile.brand_id)
      .single()

    if (brand?.onboarding_completed) {
      return '/admin'
    }
    // Brand exists but onboarding not finished
    return '/onboarding'
  }

  // No brand yet — ensure profile exists with brand_admin role
  if (!profile) {
    // DB trigger may have already created it; use upsert to be safe
    await service.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role: 'brand_admin',
    }, { onConflict: 'id' })
  } else if (profile.role !== 'brand_admin' && profile.role !== 'superadmin') {
    // Profile exists but with wrong role (e.g. trigger set 'advisor')
    await service.from('profiles').update({
      role: 'brand_admin',
      full_name: fullName ?? undefined,
    }).eq('id', userId)
  }

  // → Onboarding will create the brand
  return '/onboarding'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const supabase = await createClient()

  async function handleSuccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/login?error=auth_callback_error'

    const next = searchParams.get('next')
    if (next) return next

    return resolveDestination(user.id, user.email!, user.user_metadata?.full_name ?? null)
  }

  // PKCE flow: code (modern email confirmation, magic link, OAuth)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const dest = await handleSuccess()
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  // Legacy flow: token_hash (invitations, old-style confirmations)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const dest = await handleSuccess()
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
