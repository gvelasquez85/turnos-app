import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (id) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !serviceKey) {
        console.error('[track-pixel] Missing env vars:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceKey,
        })
      } else {
        const service = createClient(supabaseUrl, serviceKey)
        const { error } = await service
          .from('sales')
          .update({ opened_at: new Date().toISOString() })
          .eq('id', id)
          .is('opened_at', null)

        if (error) {
          console.error('[track-pixel] Supabase update error:', error.message, { id })
        }
      }
    } catch (err) {
      console.error('[track-pixel] Unexpected error:', err instanceof Error ? err.message : err)
    }
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
