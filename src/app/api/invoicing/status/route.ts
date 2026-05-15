import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendBillSync, getStatus } from '@/lib/invoicing/dian-client'

/**
 * POST: Transmit a generated document to DIAN
 * GET:  Check status of a transmitted document
 */

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 403 })

  const { documentId } = await req.json().catch(() => ({}))
  if (!documentId) return NextResponse.json({ error: 'Falta documentId' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load document
  const { data: doc } = await service
    .from('electronic_documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  // Validate ownership
  if (profile.role !== 'superadmin' && doc.brand_id !== profile.brand_id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  if (!doc.xml_signed) {
    return NextResponse.json({
      error: 'El documento debe estar firmado (XAdES) antes de transmitir a DIAN. La firma digital se implementará con certificado .p12.',
      hint: 'pending_signing',
    }, { status: 400 })
  }

  // Load fiscal config for environment
  const { data: fiscalConfig } = await service
    .from('fiscal_configs')
    .select('environment')
    .eq('brand_id', doc.brand_id)
    .single()

  const environment = fiscalConfig?.environment === 'production' ? 'production' : 'testing'

  // Base64 encode signed XML
  const signedXmlBase64 = Buffer.from(doc.xml_signed, 'utf8').toString('base64')
  const fileName = `${doc.prefix}${doc.consecutive}.xml`

  // Send to DIAN
  const dianResponse = await sendBillSync(signedXmlBase64, fileName, environment as any)

  // Log transmission
  await service.from('dian_transmissions').insert({
    electronic_document_id: doc.id,
    brand_id: doc.brand_id,
    action: 'SendBillSync',
    request_xml: `<SendBillSync><fileName>${fileName}</fileName></SendBillSync>`,
    response_xml: dianResponse.xmlResponse || '',
    status_code: dianResponse.statusCode,
    status_description: dianResponse.statusDescription,
    status_message: dianResponse.statusMessage,
    track_id: dianResponse.trackId || null,
    is_valid: dianResponse.success,
    errors: dianResponse.errors.length > 0 ? dianResponse.errors : null,
  })

  // Update document status
  const newStatus = dianResponse.success ? 'accepted' : 'rejected'
  await service.from('electronic_documents').update({
    status: newStatus,
    dian_status_code: dianResponse.statusCode,
    dian_track_id: dianResponse.trackId || null,
    dian_response_at: new Date().toISOString(),
  }).eq('id', doc.id)

  return NextResponse.json({
    ok: dianResponse.success,
    status: newStatus,
    statusCode: dianResponse.statusCode,
    statusMessage: dianResponse.statusMessage,
    trackId: dianResponse.trackId,
    errors: dianResponse.errors,
  })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const documentId = req.nextUrl.searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'Falta documentId' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: doc } = await service
    .from('electronic_documents')
    .select('id, brand_id, dian_track_id, status')
    .eq('id', documentId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  if (profile.role !== 'superadmin' && doc.brand_id !== profile.brand_id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  if (!doc.dian_track_id) {
    return NextResponse.json({ status: doc.status, message: 'Documento no transmitido aún' })
  }

  const { data: fiscalConfig } = await service
    .from('fiscal_configs')
    .select('environment')
    .eq('brand_id', doc.brand_id)
    .single()

  const environment = fiscalConfig?.environment === 'production' ? 'production' : 'testing'
  const dianResponse = await getStatus(doc.dian_track_id, environment as any)

  return NextResponse.json({
    status: doc.status,
    dianStatusCode: dianResponse.statusCode,
    dianStatusMessage: dianResponse.statusMessage,
    isValid: dianResponse.success,
  })
}
