import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { generateTestCertificate } from '@/lib/invoicing/test-certificate'

/**
 * POST: Generate a self-signed test certificate for DIAN habilitación.
 * Stores the .p12 in fiscal_configs and returns certificate info.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('brand_id, role').eq('id', user.id).single()
  if (!profile) return NextResponse.json({ error: 'Sin perfil' }, { status: 403 })

  const { brandId: overrideBrandId } = await req.json().catch(() => ({}))
  const effectiveBrandId = overrideBrandId || profile.brand_id
  if (!effectiveBrandId) return NextResponse.json({ error: 'Falta brand_id' }, { status: 400 })

  if (profile.role !== 'superadmin' && effectiveBrandId !== profile.brand_id)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Load fiscal config
  const { data: config } = await service
    .from('fiscal_configs')
    .select('id, nit, company_name, contact_email, environment')
    .eq('brand_id', effectiveBrandId)
    .single()

  if (!config?.nit) {
    return NextResponse.json({
      error: 'Primero configura tus datos fiscales (NIT y razón social)',
    }, { status: 400 })
  }

  if (config.environment === 'production') {
    return NextResponse.json({
      error: 'No se puede generar certificado de pruebas en ambiente de producción. Usa un certificado de una CA autorizada.',
    }, { status: 400 })
  }

  try {
    const password = `test${Date.now().toString(36)}`
    const cert = generateTestCertificate({
      companyName: config.company_name,
      nit: config.nit,
      email: config.contact_email || undefined,
      password,
    })

    // Store certificate in fiscal_configs
    await service.from('fiscal_configs').update({
      certificate_base64: cert.p12Base64,
      certificate_password: password,
      certificate_serial: cert.serialNumber,
      certificate_valid_from: cert.validFrom,
      certificate_valid_to: cert.validTo,
      certificate_is_test: true,
      updated_at: new Date().toISOString(),
    }).eq('id', config.id)

    return NextResponse.json({
      ok: true,
      serialNumber: cert.serialNumber,
      validFrom: cert.validFrom,
      validTo: cert.validTo,
      warning: cert.warning,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: `Error generando certificado: ${error.message}`,
      hint: 'Verifica que OpenSSL esté instalado en el servidor',
    }, { status: 500 })
  }
}
