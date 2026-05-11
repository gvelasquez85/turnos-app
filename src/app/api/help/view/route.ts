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
    const { article_id } = await request.json()
    if (!article_id) return NextResponse.json({ error: 'article_id required' }, { status: 400 })

    const supabase = supabaseAdmin()

    // Insert view record
    await supabase.from('help_article_views').insert({ article_id })

    // Increment views_count on article
    const { data } = await supabase
      .from('help_articles')
      .select('views_count')
      .eq('id', article_id)
      .single()

    if (data) {
      await supabase
        .from('help_articles')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', article_id)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
