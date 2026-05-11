import { createClient } from '@/lib/supabase/server'
import { HELP_CATEGORIES, HELP_ARTICLES } from '@/lib/helpContent'
import HelpCenterClient from './HelpCenterClient'

export default async function HelpCenterPage() {
  const supabase = await createClient()

  // Try DB first, fallback to hardcoded
  const { data: dbArticles } = await supabase
    .from('help_articles')
    .select('slug, title, category, summary, tags')
    .eq('published', true)
    .order('sort_order')

  const articles = (dbArticles && dbArticles.length > 0)
    ? dbArticles.map(a => ({ slug: a.slug, title: a.title, category: a.category, summary: a.summary, tags: a.tags as string[] }))
    : HELP_ARTICLES.map(a => ({ slug: a.slug, title: a.title, category: a.category, summary: a.summary, tags: a.tags }))

  return <HelpCenterClient articles={articles} categories={HELP_CATEGORIES} />
}
