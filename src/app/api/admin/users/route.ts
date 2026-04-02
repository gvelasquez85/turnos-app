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
// body: { action: 'create_user' | 'update_user' | 'set_password' | 'resend_verification' | 'claim_user', ... }
// Roles que brand_admin puede asignar (no puede crear brand_admin ni superadmin)
const BRAND_ALLOWED_ROLES = ['advisor', 'manager', 'reporting']

// GET /api/admin/users?brand_id=xxx — diagnostic/list endpoint (admin-only)
export async function GET(request: Request) {
  const caller = await requireAdminCaller()
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brand_id') ?? caller.brandId

  if (!brandId) return NextResponse.json({ error: 'Falta brand_id' }, { status: 400 })

  // Solo superadmin puede consultar marcas distintas a la suya
  if (caller.role !== 'superadmin' && brandId !== caller.brandId) {
    return NextResponse.json({ error: 'No autorizado para esa marca' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const { data: users, error } = await admin
    .from('profiles')
    .select('id, email, full_name, role, brand_id, establishment_id, created_at')
    .eq('brand_id', brandId)
    .neq('role', 'superadmin')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ users: users ?? [] })
}

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

    const userId = data.user.id
    const profilePayload = {
      role,
      full_name: full_name || null,
      brand_id: brand_id || null,
      establishment_id: establishment_id || null,
    }

    // Try UPDATE first (trigger may have already created the row)
    const { data: updated, error: updateErr } = await admin
      .from('profiles')
      .update(profilePayload)
      .eq('id', userId)
      .select('id, brand_id')

    if (updateErr) {
      return NextResponse.json({ error: `Error al actualizar perfil: ${updateErr.message}` }, { status: 400 })
    }

    // If update matched 0 rows, insert directly (trigger didn't run yet)
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

  // ── Asociar usuario existente a esta marca (reclamar usuario huérfano) ──────
  if (action === 'claim_user') {
    const { email, brand_id, establishment_id, role } = body
    if (!email || !brand_id) return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    if (!isSuperAdmin && brand_id !== caller.brandId) {
      return NextResponse.json({ error: 'No puedes asignar usuarios a otra marca' }, { status: 403 })
    }

    // Find the auth user by email
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 400 })

    const authUser = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!authUser) return NextResponse.json({ error: 'No se encontró ningún usuario con ese email' }, { status: 404 })

    // Upsert the profile with the brand
    const assignedRole = role || 'advisor'
    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || null,
        role: assignedRole,
        brand_id,
        establishment_id: establishment_id || null,
      }, { onConflict: 'id' })

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })
    return NextResponse.json({ ok: true, userId: authUser.id })
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
