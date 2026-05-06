import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * After confirming email, ensure the user has:
 *   1. A profile row (role = brand_admin)
 *   2. A brand row (name from signup metadata, slug auto-generated)
 *   3. profile.brand_id linked to the brand
 *   4. A free membership row for the brand
 *
 * Uses service role to bypass RLS on insert.
 * Returns the redirect target: '/onboarding' for new users, '/admin' for existing.
 */
async function provisionNewUser(userId: string, email: string, fullName: string | null): Promise<string> {
  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // 1. Check if profile already exists (re-confirmation or password reset)
  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, brand_id, role, full_name')
    .eq('id', userId)
    .maybeSingle()

  // Existing user with brand already set up → just go to admin
  if (existingProfile?.brand_id) {
    return '/admin'
  }

  // 2. Create or update profile
  if (!existingProfile) {
    await service.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName ?? null,
      role: 'brand_admin',
    })
  } else {
    // Profile exists but no brand yet — ensure role and name
    await service.from('profiles').update({
      role: 'brand_admin',
      full_name: fullName ?? (existingProfile as any).full_name ?? null,
    }).eq('id', userId)
  }

  // 3. Generate a unique slug from the name or email
  const baseName = fullName?.trim() || email.split('@')[0]
  const baseSlug = baseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'mi-negocio'

  // Ensure slug uniqueness
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await service
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
  }

  // 4. Create the brand (name + slug; onboarding will complete the rest)
  const { data: brand, error: brandError } = await service
    .from('brands')
    .insert({
      name: baseName,
      slug,
      active: true,
      country: 'Colombia',
      active_modules: {
        queue: false,
        appointments: false,
        surveys: false,
        menu: false,
        display: false,
        mensajes: false,
      },
      onboarding_completed: false,
    })
    .select('id')
    .single()

  if (brandError || !brand) {
    console.error('[auth/callback] Error creating brand:', brandError)
    return '/admin'
  }

  // 5. Link brand to profile
  await service.from('profiles').update({ brand_id: brand.id }).eq('id', userId)

  // 6. Create free membership
  await service.from('memberships').insert({
    brand_id: brand.id,
    plan: 'free',
    status: 'active',
    max_establishments: 1,
    max_advisors: 1,
    billing_anchor_day: new Date().getDate(),
  })

  // New user → onboarding to complete brand setup
  return '/onboarding'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const supabase = await createClient()

  async function handleSuccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/login?error=auth_callback_error'

    // Explicit next param wins (e.g. password reset flows)
    const next = searchParams.get('next')
    if (next) return next

    return provisionNewUser(user.id, user.email!, user.user_metadata?.full_name ?? null)
  }

  // Flujo PKCE: code (confirmación email moderna, magic link, OAuth)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const dest = await handleSuccess()
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  // Flujo legacy: token_hash (invitaciones, confirmaciones antiguas)
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
