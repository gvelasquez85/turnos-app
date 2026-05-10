import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'

interface BulkResult {
  ok: boolean
  inserted: number
  updated: number
  errors: string[]
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Try ISO format, DD/MM/YYYY, DD-MM-YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    const year = y.length === 2 ? `20${y}` : y
    const date = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
  }
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
  return null
}

function parseNumber(raw: string): number | null {
  if (!raw) return null
  const n = parseFloat(raw.replace(/[,$\s]/g, ''))
  return isNaN(n) ? null : n
}

function parseInt2(raw: string): number | null {
  if (!raw) return null
  const n = parseInt(raw.replace(/[,.\s]/g, ''), 10)
  return isNaN(n) ? null : n
}

function val(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k]?.trim()
    if (v) return v
  }
  return ''
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return NextResponse.json({ error: 'Sin marca asociada' }, { status: 400 })

  const body = await req.json().catch(() => null)
  if (!body || !body.type || !Array.isArray(body.rows))
    return NextResponse.json({ error: 'Body inválido: se requiere { type, rows }' }, { status: 400 })

  const { type, rows } = body as { type: 'customers' | 'products'; rows: Record<string, string>[] }

  if (type === 'customers') {
    return NextResponse.json(await processCustomers(supabase, rows, brandId))
  } else if (type === 'products') {
    return NextResponse.json(await processProducts(supabase, rows, brandId))
  }

  return NextResponse.json({ error: `Tipo no soportado: ${type}` }, { status: 400 })
}

async function processCustomers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, string>[],
  brandId: string,
): Promise<BulkResult> {
  let inserted = 0
  let updated = 0
  const errors: string[] = []
  const notesToInsert: { customer_id: string; detalles: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = Object.fromEntries(
      Object.entries(rows[i]).map(([k, v]) => [k.toLowerCase().trim(), v])
    )
    const rowNum = i + 2 // header is row 1

    const name = val(row, 'nombre', 'name')
    if (!name) {
      errors.push(`Fila ${rowNum}: nombre es requerido`)
      continue
    }

    const phone = val(row, 'telefono', 'celular', 'phone', 'tel')
    const email = val(row, 'email', 'correo')
    const canalContacto = val(row, 'canal_contacto', 'canal')
    const cumpleanos = parseDate(val(row, 'cumpleanos', 'cumpleaños', 'birthday'))
    const interesesRaw = val(row, 'intereses', 'interests')
    const intereses = interesesRaw
      ? interesesRaw.split(/[;|]/).map(s => s.trim()).filter(Boolean)
      : null
    const notas = val(row, 'notas', 'nota', 'notes')

    // Build upsert record
    const record: Record<string, unknown> = {
      name,
      brand_id: brandId,
    }
    if (phone) { record.phone = phone; record.celular = phone }
    if (email) record.email = email
    if (canalContacto) record.canal_contacto = canalContacto
    if (cumpleanos) record.cumpleanos = cumpleanos
    if (intereses) record.intereses = intereses

    try {
      // Check for existing customer by email or phone
      let existingId: string | null = null

      if (email) {
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('brand_id', brandId)
          .eq('email', email)
          .limit(1)
          .maybeSingle()
        if (data) existingId = data.id
      }

      if (!existingId && phone) {
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('brand_id', brandId)
          .or(`phone.eq.${phone},celular.eq.${phone}`)
          .limit(1)
          .maybeSingle()
        if (data) existingId = data.id
      }

      if (existingId) {
        // Update existing
        const { error } = await supabase
          .from('customers')
          .update(record)
          .eq('id', existingId)
        if (error) { errors.push(`Fila ${rowNum}: ${error.message}`); continue }
        updated++
        if (notas) notesToInsert.push({ customer_id: existingId, detalles: notas })
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('customers')
          .insert(record)
          .select('id')
          .single()
        if (error) { errors.push(`Fila ${rowNum}: ${error.message}`); continue }
        inserted++
        if (notas && data) notesToInsert.push({ customer_id: data.id, detalles: notas })
      }
    } catch (err: unknown) {
      errors.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    }
  }

  // Batch insert notes
  if (notesToInsert.length > 0) {
    const { error } = await supabase
      .from('customer_history')
      .insert(notesToInsert.map(n => ({ customer_id: n.customer_id, tipo: 'nota', detalles: n.detalles })))
    if (error) errors.push(`Error al guardar notas: ${error.message}`)
  }

  return { ok: errors.length === 0, inserted, updated, errors }
}

async function processProducts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, string>[],
  brandId: string,
): Promise<BulkResult> {
  let inserted = 0
  let updated = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = Object.fromEntries(
      Object.entries(rows[i]).map(([k, v]) => [k.toLowerCase().trim(), v])
    )
    const rowNum = i + 2

    const name = val(row, 'nombre', 'name')
    if (!name) {
      errors.push(`Fila ${rowNum}: nombre es requerido`)
      continue
    }

    const sku = val(row, 'sku')
    const price = parseNumber(val(row, 'precio', 'price'))
    const stock = parseInt2(val(row, 'stock'))
    const stockMin = parseInt2(val(row, 'stock_minimo', 'stock_min'))
    const description = val(row, 'descripcion', 'descripción', 'description')
    const category = val(row, 'categoria', 'categoría', 'category')

    const record: Record<string, unknown> = {
      name,
      brand_id: brandId,
      product_type: 'physical',
    }
    if (sku) record.sku = sku
    if (price !== null) record.price = price
    if (stock !== null) record.stock = stock
    if (stockMin !== null) record.stock_min = stockMin
    if (description) record.description = description
    if (category) record.category = category

    try {
      // Check for existing product by SKU
      let existingId: string | null = null
      if (sku) {
        const { data } = await supabase
          .from('products')
          .select('id')
          .eq('brand_id', brandId)
          .eq('sku', sku)
          .limit(1)
          .maybeSingle()
        if (data) existingId = data.id
      }

      if (existingId) {
        const { error } = await supabase
          .from('products')
          .update(record)
          .eq('id', existingId)
        if (error) { errors.push(`Fila ${rowNum}: ${error.message}`); continue }
        updated++
      } else {
        const { error } = await supabase
          .from('products')
          .insert(record)
        if (error) { errors.push(`Fila ${rowNum}: ${error.message}`); continue }
        inserted++
      }
    } catch (err: unknown) {
      errors.push(`Fila ${rowNum}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    }
  }

  return { ok: errors.length === 0, inserted, updated, errors }
}
