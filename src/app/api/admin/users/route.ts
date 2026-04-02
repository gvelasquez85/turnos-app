import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdminCaller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile || !['superadmin', 'brand_admin'].includes(profile.role)) return null
  return { user, role: profile.role as string, brandId: profile.brand_id as string | null }
}

// POST /api/admin/users
// body: { action: 'create_user' | 'set_password' | 'resend_verification', ... }
// Roles que brand_admin puede asignar (no puede crear brand_admin ni superadmin)
const BRAND_ALLOWED_ROLES = ['advisor', 'manager', 'reporting']

export async function POST(request: Request) {
  const caller = await requireAdminCaller()
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { action } = body
  const admin = await createAdminClient()
  const isSuperAdmin = caller.role === 'superadmin'

  // ── Crear usuario sin afectar la sesión actual ──────────────────────────────
  if (action === 'create_user') {
    const { email, password, full_name, role, brand_id, establishment_id } = body
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }
    // brand_admin solo puede crear roles permitidos dentro de su marca
    if (!isSuperAdmin && !BRAND_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'No puedes crear ese rol' }, { status: 403 })
    }

    const { data, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, brand_id: brand_id || null, establishment_id: establishment_id || null },
    })
    if (createErr || !data.user) {
      return NextResponse.json({ error: createErr?.message || 'Error al crear usuario' }, { status: 400 })
    }

    // The handle_new_user trigger creates the profile row synchronously.
    // We do a plain UPDATE to set brand_id, role, etc.
    // Fall back to INSERT if somehow the trigger didn't run.
    const userId = data.user.id
    const profilePayload = {
      role,
      full_name: full_name || null,
      brand_id: brand_id || null,
      establishment_id: establishment_id || null,
    }

    const { data: updated, error: updateErr } = await admin
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId)
      .select('id, brand_id')

    if (updateErr) {
      return NextResponse.json({ error: `Error al actualizar perfil: ${updateErr.message}` }, { status: 400 })
    }

    // If update matched 0 rows (trigger didn't run yet), do an insert
    if (!updated || updated.length === 0) {
      const { error: insertErr } = await admin
        .from('profiles')
        .insert({ id: userId, email, role, full_name: full_name || null, brand_id: brand_id || null, establishment_id: establishment_id || null })
      if (insertErr) {
        return NextResponse.json({ error: `Error al crear perfil: ${insertErr.message}` }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true, userId })
  }

  // ── Actualizar usuario existente ────────────────────────────────────────────
  if (action === 'update_user') {
    const { userId, full_name, role, brand_id, establishment_id } = body
    if (!userId) return NextResponse.json({ error: 'Falta userId' }, { status: 400 })
    if (!isSuperAdmin && !BRAND_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'No puedes asignar ese rol' }, { status: 403 })
    }

    const { error } = await admin
      .from('profiles')
      .update({
        full_name: full_name || null,
        role,
        brand_id: brand_id || null,
        establishment_id: establishment_id || null,
      })
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  // ── Cambiar contraseña ──────────────────────────────────────────────────────
  if (action === 'set_password') {
    const { userId, password } = body
    if (!userId || !password) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })

    const { error } = await admin.auth.admin.updateUserById(userId, { password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  // ── Reenviar verificación ───────────────────────────────────────────────────
  if (action === 'resend_verification') {
    const { email } = body
    if (!email) return NextResponse.json({ error: 'Falta el email' }, { status: 400 })

    const { error } = await admin.auth.resend({ type: 'signup', email })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}
