import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Test 1: ¿existe la tabla profiles?
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Test 2: ¿cuántos profiles hay en total? (solo funciona si RLS lo permite)
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
    profileError: profileError ? { code: profileError.code, message: profileError.message } : null,
    profileCount: count,
    countError: countError ? { code: countError.code, message: countError.message } : null,
  })
}
