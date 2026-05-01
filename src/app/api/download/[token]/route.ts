import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: dl } = await service
    .from('digital_downloads')
    .select('*')
    .eq('token', token)
    .single()

  if (!dl) {
    return new NextResponse('Enlace no encontrado', { status: 404 })
  }
  if (dl.expires_at && new Date(dl.expires_at) < new Date()) {
    return new NextResponse('Este enlace ha expirado', { status: 410 })
  }
  if (dl.download_count >= dl.max_downloads) {
    return new NextResponse('Has alcanzado el límite de descargas para este enlace', { status: 429 })
  }

  // Increment download count
  await service.from('digital_downloads')
    .update({ download_count: dl.download_count + 1 })
    .eq('id', dl.id)

  // Redirect to actual file
  return NextResponse.redirect(dl.digital_url)
}
