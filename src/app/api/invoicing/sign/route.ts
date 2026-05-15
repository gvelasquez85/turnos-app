import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { signXML } from '@/lib/invoicing/xades-signer'

/**
 * POST: Sign an electronic document with XAdES-EPES.
 * Uses the certificate stored in fiscal_configs.
 *
 * Body: { documentId: string }
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
    .select('id, brand_id, xml_unsigned, status')
    .eq('id', documentId)
    .single()

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  if (profile.role !== 'superadmin' && doc.brand_id !== profile.brand_id) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  if (!doc.xml_unsigned) {
    return NextResponse.json({ error: 'El documento no tiene XML generado' }, { status: 400 })
  }

  if (doc.status !== 'generated' && doc.status !== 'draft') {
    return NextResponse.json({ error: `No se puede firmar un documento en estado "${doc.status}"` }, { status: 400 })
  }

  // Load certificate
  const { data: fiscalConfig } = await service
    .from('fiscal_configs')
    .select('certificate_base64, certificate_password')
    .eq('brand_id', doc.brand_id)
    .single()

  if (!fiscalConfig?.certificate_base64 || !fiscalConfig?.certificate_password) {
    return NextResponse.json({
      error: 'No hay certificado configurado. Genera un certificado de pruebas o sube tu certificado .p12.',
    }, { status: 400 })
  }

  try {
    const result = signXML({
      xml: doc.xml_unsigned,
      p12Base64: fiscalConfig.certificate_base64,
      password: fiscalConfig.certificate_password,
    })

    // Update document
    await service.from('electronic_documents').update({
      xml_signed: result.signedXml,
      status: 'signed',
      signed_at: new Date().toISOString(),
    }).eq('id', doc.id)

    return NextResponse.json({
      ok: true,
      status: 'signed',
      documentDigest: result.documentDigest,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: `Error firmando documento: ${error.message}`,
    }, { status: 500 })
  }
}
