import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  try {
    const { article_id, helpful } = await request.json()
    if (!article_id || typeof helpful !== 'boolean') {
      return NextResponse.json({ error: 'article_id and helpful (boolean) required' }, { status: 400 })
    }

    const supabase = supabaseAdmin()
    await supabase.from('help_article_ratings').insert({ article_id, helpful })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
