import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as serviceClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/setup-brand
 * Creates a brand + free membership for a new brand_admin user.
 * Called from the onboarding wizard when the user doesn't have a brand yet.
 *
 * Body: { brandName: string }
 * Returns: { ok: true, brandId: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  // Only brand_admin without a brand can create one
  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  if (profile.brand_id) return NextResponse.json({ error: 'Ya tienes una marca asignada', brandId: profile.brand_id }, { status: 409 })

  const { brandName } = await req.json().catch(() => ({ brandName: '' }))
  if (!brandName?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const service = serviceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Generate slug
  const baseSlug = brandName.trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'mi-negocio'

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
    if (attempt > 20) {
      slug = `${baseSlug}-${Date.now().toString(36)}`
      break
    }
  }

  // Create brand
  const { data: brand, error: brandError } = await service
    .from('brands')
    .insert({
      name: brandName.trim(),
      slug,
      active: true,
      country: 'Colombia',
      active_modules: {
        queue: false, appointments: false, surveys: false,
        menu: false, display: false, mensajes: false,
      },
      onboarding_completed: false,
    })
    .select('id')
    .single()

  if (brandError || !brand) {
    console.error('[setup-brand] Error creating brand:', brandError)
    return NextResponse.json({ error: 'No se pudo crear la marca' }, { status: 500 })
  }

  // Link brand to profile + ensure role is brand_admin
  await service.from('profiles').update({
    brand_id: brand.id,
    role: 'brand_admin',
  }).eq('id', user.id)

  // Create free membership
  await service.from('memberships').insert({
    brand_id: brand.id,
    plan: 'free',
    status: 'active',
    max_establishments: 1,
    max_advisors: 1,
    billing_anchor_day: new Date().getDate(),
  })

  return NextResponse.json({ ok: true, brandId: brand.id })
}
