import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/pqrs/submit
 * Public endpoint — receives PQRS form submissions.
 * No auth required (public form).
 * Uses FormData for file uploads.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const slug = formData.get('slug') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const idType = formData.get('idType') as string
  const idNumber = formData.get('idNumber') as string
  const category = formData.get('category') as string
  const subject = formData.get('subject') as string
  const description = formData.get('description') as string

  if (!slug || !name || !category || !subject || !description) {
    return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Validate slug and get config
  const { data: config } = await supabase
    .from('pqrs_configs')
    .select('brand_id, form_enabled, sla_peticion_days, sla_queja_days, sla_reclamo_days, sla_sugerencia_days, auto_reply_enabled, auto_reply_subject, auto_reply_body, notify_email')
    .eq('form_slug', slug)
    .single()

  if (!config || !config.form_enabled) {
    return NextResponse.json({ error: 'Formulario no disponible' }, { status: 404 })
  }

  // Assign radicado
  const { data: radicadoResult } = await supabase.rpc('assign_pqrs_radicado', {
    p_brand_id: config.brand_id,
  })

  if (!radicadoResult) {
    return NextResponse.json({ error: 'Error asignando radicado' }, { status: 500 })
  }

  // Calculate SLA due date
  const slaMap: Record<string, number> = {
    'Petición': config.sla_peticion_days || 15,
    'Queja': config.sla_queja_days || 15,
    'Reclamo': config.sla_reclamo_days || 15,
    'Sugerencia': config.sla_sugerencia_days || 30,
  }
  const slaDays = slaMap[category] || 15
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + slaDays)

  // Create case
  const { data: newCase, error: caseErr } = await supabase.from('pqrs_cases').insert({
    brand_id: config.brand_id,
    radicado: radicadoResult,
    requester_name: name,
    requester_email: email || null,
    requester_phone: phone || null,
    requester_id_type: idType || 'CC',
    requester_id_number: idNumber || null,
    category,
    subject,
    description,
    status: 'open',
    sla_due_date: dueDate.toISOString().split('T')[0],
    source: 'public_form',
  }).select('id').single()

  if (caseErr || !newCase) {
    return NextResponse.json({ error: caseErr?.message || 'Error creando caso' }, { status: 500 })
  }

  // Log initial status
  await supabase.from('pqrs_status_history').insert({
    case_id: newCase.id,
    brand_id: config.brand_id,
    old_status: null,
    new_status: 'open',
    note: 'Caso radicado vía formulario público',
  })

  // Handle file uploads
  const files = formData.getAll('files') as File[]
  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) continue // Skip files > 10MB

    const fileExt = file.name.split('.').pop() || 'bin'
    const filePath = `pqrs/${config.brand_id}/${newCase.id}/${Date.now()}.${fileExt}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { data: uploaded } = await supabase.storage
      .from('attachments')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploaded) {
      const { data: publicUrl } = supabase.storage.from('attachments').getPublicUrl(filePath)

      await supabase.from('pqrs_attachments').insert({
        case_id: newCase.id,
        brand_id: config.brand_id,
        file_name: file.name,
        file_url: publicUrl.publicUrl,
        file_size: file.size,
        file_type: file.type,
        is_internal: false,
      })
    }
  }

  // Send auto-reply email if configured and email provided
  if (config.auto_reply_enabled && email) {
    const emailBody = (config.auto_reply_body || '')
      .replace('{{radicado}}', radicadoResult)
      .replace('{{sla_days}}', String(slaDays))

    // Fire and forget — email sending via notify endpoint
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/pqrs/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'auto_reply',
        caseId: newCase.id,
        brandId: config.brand_id,
        to: email,
        subject: config.auto_reply_subject || 'Confirmación de radicación PQRS',
        body: emailBody,
        radicado: radicadoResult,
      }),
    }).catch(() => {})

    // Notify internal email
    if (config.notify_email) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/pqrs/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_case',
          caseId: newCase.id,
          brandId: config.brand_id,
          to: config.notify_email,
          subject: `Nuevo PQRS: ${radicadoResult} — ${category}: ${subject}`,
          body: `Se ha radicado un nuevo caso.\n\nRadicado: ${radicadoResult}\nTipo: ${category}\nSolicitante: ${name}\nAsunto: ${subject}\n\nDescripción:\n${description}`,
          radicado: radicadoResult,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, radicado: radicadoResult, caseId: newCase.id })
}
