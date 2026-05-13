import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { HELP_ARTICLES, getArticleBySlug as getStaticArticle, getArticlesByCategory as getStaticByCategory } from './helpContent'

/**
 * Anon Supabase client — no cookies, safe inside unstable_cache.
 * Help articles have public SELECT RLS so anon key is sufficient.
 */
function supabaseAnon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export type CachedArticle = {
  id: string | null
  slug: string
  title: string
  category: string
  summary: string
  tags: string[]
  body: string
  source: 'db' | 'static'
}

export type CachedArticleListItem = {
  slug: string
  title: string
  category: string
  summary: string
  tags: string[]
}

/**
 * Cached: all published articles (list view — no body)
 * Revalidates via tag 'help-articles' or every 10 minutes as fallback
 */
export const getCachedArticleList = unstable_cache(
  async (): Promise<CachedArticleListItem[]> => {
    const supabase = supabaseAnon()
    const { data } = await supabase
      .from('help_articles')
      .select('slug, title, category, summary, tags')
      .eq('published', true)
      .order('sort_order')

    if (data && data.length > 0) {
      return data.map(a => ({
        slug: a.slug,
        title: a.title,
        category: a.category,
        summary: a.summary,
        tags: a.tags as string[],
      }))
    }

    return HELP_ARTICLES.map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      summary: a.summary,
      tags: a.tags,
    }))
  },
  ['help-article-list'],
  { revalidate: 604800, tags: ['help-articles'] },
)

/**
 * Cached: single article by slug (full content)
 */
export const getCachedArticle = unstable_cache(
  async (slug: string): Promise<CachedArticle | null> => {
    const supabase = supabaseAnon()
    const { data } = await supabase
      .from('help_articles')
      .select('id, slug, title, category, summary, tags, body')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (data) {
      return {
        id: data.id,
        slug: data.slug,
        title: data.title,
        category: data.category,
        summary: data.summary,
        tags: data.tags as string[],
        body: data.body,
        source: 'db',
      }
    }

    const fallback = getStaticArticle(slug)
    return fallback ? { ...fallback, id: null, source: 'static' } : null
  },
  ['help-article-detail'],
  { revalidate: 604800, tags: ['help-articles'] },
)

/**
 * Cached: related articles by category
 */
export const getCachedRelated = unstable_cache(
  async (category: string, excludeSlug: string) => {
    const supabase = supabaseAnon()
    const { data } = await supabase
      .from('help_articles')
      .select('slug, title, summary')
      .eq('category', category)
      .eq('published', true)
      .neq('slug', excludeSlug)
      .order('sort_order')
      .limit(3)

    if (data && data.length > 0) return data

    return getStaticByCategory(category)
      .filter(a => a.slug !== excludeSlug)
      .slice(0, 3)
  },
  ['help-article-related'],
  { revalidate: 604800, tags: ['help-articles'] },
)
