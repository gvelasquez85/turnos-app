import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existing) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? null,
      role: 'brand_admin',
    })
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const supabase = await createClient()

  // Flujo PKCE: code (reset password, magic link moderno)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await ensureProfile(supabase)
      const next = searchParams.get('next') ?? '/admin'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Flujo legacy: token_hash (invitaciones, confirmaciones de email)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      await ensureProfile(supabase)
      const next = searchParams.get('next') ?? '/admin'
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error en ambos flujos
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
