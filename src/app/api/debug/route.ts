import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const admin = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()

  // ¿Qué columnas tiene visit_reasons?
  const { data: vrSample, error: vrError } = await admin
    .from('visit_reasons')
    .select('*')
    .limit(5)

  // ¿Qué columnas tiene el primer resultado (para detectar brand_id vs establishment_id)?
  const vrColumns = vrSample && vrSample.length > 0 ? Object.keys(vrSample[0]) : []

  // Marcas disponibles
  const { data: brands } = await admin.from('brands').select('id, name, active').order('name')

  // Motivos por marca
  const { data: allReasons } = await admin.from('visit_reasons').select('*').order('sort_order')

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
    visit_reasons: {
      total: allReasons?.length ?? 0,
      columns: vrColumns,
      sample: vrSample,
      error: vrError ? { code: vrError.code, message: vrError.message } : null,
    },
    brands: brands ?? [],
  })
}
