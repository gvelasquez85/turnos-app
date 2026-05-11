import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getArticleBySlug, getArticlesByCategory, HELP_CATEGORIES } from '@/lib/helpContent'
import type { Metadata } from 'next'
import ArticleRating from './ArticleRating'
import ArticleViewTracker from './ArticleViewTracker'

interface Props { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('help_articles')
    .select('id, slug, title, category, summary, tags, body')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (data) return { ...data, source: 'db' as const }

  // Fallback to hardcoded content
  const fallback = getArticleBySlug(slug)
  return fallback ? { ...fallback, id: null, source: 'static' as const } : null
}

async function getRelated(category: string, slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('help_articles')
    .select('slug, title, summary')
    .eq('category', category)
    .eq('published', true)
    .neq('slug', slug)
    .order('sort_order')
    .limit(3)

  if (data && data.length > 0) return data

  // Fallback
  return getArticlesByCategory(category).filter(a => a.slug !== slug).slice(0, 3)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) return { title: 'Articulo no encontrado' }
  return {
    title: `${article.title} — Ayuda TurnFlow`,
    description: article.summary,
  }
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  const category = HELP_CATEGORIES.find(c => c.key === article.category)
  const related = await getRelated(article.category, slug)

  return (
    <div className="min-h-screen bg-white">
      {/* View tracker */}
      {article.id && <ArticleViewTracker articleId={article.id} />}

      {/* Header */}
      <div className="bg-indigo-600">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Link href="/ayuda" className="inline-flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={14} /> Centro de Ayuda
          </Link>
          <div className="flex items-center gap-2 text-indigo-200 text-sm mb-3">
            <BookOpen size={14} />
            <span>{category?.icon} {category?.label}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{article.title}</h1>
          <p className="text-indigo-200 mt-2">{article.summary}</p>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div
          className="prose prose-sm sm:prose-base max-w-none
            prose-headings:text-gray-900
            prose-p:text-gray-700
            prose-li:text-gray-700
            prose-strong:text-gray-900
            prose-a:text-indigo-600
            prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            [&_.tip]:bg-indigo-50 [&_.tip]:border [&_.tip]:border-indigo-200 [&_.tip]:rounded-xl [&_.tip]:px-4 [&_.tip]:py-3 [&_.tip]:text-sm [&_.tip]:text-indigo-800 [&_.tip]:my-4
          "
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Rating widget */}
        {article.id && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <ArticleRating articleId={article.id} />
          </div>
        )}

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Articulos relacionados
            </h2>
            <div className="grid gap-3">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/ayuda/${r.slug}`}
                  className="group flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm group-hover:text-indigo-600">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500">{r.summary}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between">
          <Link href="/ayuda" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
            <ArrowLeft size={14} /> Volver al Centro de Ayuda
          </Link>
          <a href="mailto:soporte@turnflow.com.co" className="text-sm text-gray-400 hover:text-gray-600">
            ¿Necesitas mas ayuda?
          </a>
        </div>
      </div>
    </div>
  )
}
