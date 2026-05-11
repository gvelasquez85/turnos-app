'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  ArrowLeft,
  Search,
  Trash2,
  Save,
  Eye,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  FileText,
  Circle,
  ChevronDown,
} from 'lucide-react'

const HELP_CATEGORIES = [
  { key: 'primeros-pasos', label: 'Primeros pasos', icon: '🚀' },
  { key: 'clientes', label: 'Gestionar clientes', icon: '👥' },
  { key: 'ventas', label: 'Ventas y cotizaciones', icon: '🛍️' },
  { key: 'citas', label: 'Citas y agenda', icon: '📅' },
  { key: 'comunicacion', label: 'Comunicaciones', icon: '💬' },
  { key: 'configuracion', label: 'Configuracion', icon: '⚙️' },
  { key: 'marketplace', label: 'Marketplace y modulos', icon: '🧩' },
  { key: 'reportes', label: 'Reportes y datos', icon: '📊' },
]

type Article = {
  id: string
  title: string
  slug: string
  category: string
  summary: string
  body: string
  tags: string[]
  published: boolean
  sort_order: number
  views_count: number
  created_at: string
  updated_at: string
}

type ArticleRating = {
  article_id: string
  helpful_count: number
  unhelpful_count: number
}

type ArticleForm = {
  title: string
  slug: string
  category: string
  summary: string
  body: string
  tags: string
  published: boolean
  sort_order: number
}

type Tab = 'list' | 'editor' | 'analytics'
type DateRange = '7' | '30' | 'all'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const emptyForm: ArticleForm = {
  title: '',
  slug: '',
  category: HELP_CATEGORIES[0].key,
  summary: '',
  body: '',
  tags: '',
  published: false,
  sort_order: 0,
}

export default function HelpCmsManager() {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('list')
  const [articles, setArticles] = useState<Article[]>([])
  const [ratings, setRatings] = useState<ArticleRating[]>([])
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30')
  const [analyticsViews, setAnalyticsViews] = useState<{ article_id: string; count: number }[]>([])
  const [analyticsRatings, setAnalyticsRatings] = useState<ArticleRating[]>([])
  const [slugManual, setSlugManual] = useState(false)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('help_articles')
      .select('*')
      .order('category')
      .order('sort_order')

    if (data) setArticles(data)

    const { data: ratingsData } = await supabase.rpc('get_help_article_ratings')
    if (ratingsData) setRatings(ratingsData)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const filteredArticles = useMemo(() => {
    if (!search) return articles
    const q = search.toLowerCase()
    return articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    )
  }, [articles, search])

  const getRating = (articleId: string) => {
    return ratings.find((r) => r.article_id === articleId)
  }

  const getCategoryLabel = (key: string) => {
    const cat = HELP_CATEGORIES.find((c) => c.key === key)
    return cat ? `${cat.icon} ${cat.label}` : key
  }

  // Editor
  const openEditor = (article?: Article) => {
    if (article) {
      setEditingId(article.id)
      setForm({
        title: article.title,
        slug: article.slug,
        category: article.category,
        summary: article.summary || '',
        body: article.body || '',
        tags: (article.tags || []).join(', '),
        published: article.published,
        sort_order: article.sort_order || 0,
      })
      setSlugManual(true)
    } else {
      setEditingId(null)
      setForm(emptyForm)
      setSlugManual(false)
    }
    setTab('editor')
  }

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      ...(slugManual ? {} : { slug: slugify(title) }),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      summary: form.summary,
      body: form.body,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      published: form.published,
      sort_order: form.sort_order,
    }

    if (editingId) {
      await supabase.from('help_articles').update(payload).eq('id', editingId)
    } else {
      await supabase.from('help_articles').insert(payload)
    }

    setSaving(false)
    setTab('list')
    fetchArticles()
  }

  const handleDelete = async () => {
    if (!editingId) return
    if (!confirm('Estas seguro de eliminar este articulo? Esta accion no se puede deshacer.')) return
    await supabase.from('help_articles').delete().eq('id', editingId)
    setTab('list')
    fetchArticles()
  }

  // Analytics
  const fetchAnalytics = useCallback(async () => {
    let viewsQuery = supabase
      .from('help_article_views')
      .select('article_id')

    if (dateRange !== 'all') {
      const d = new Date()
      d.setDate(d.getDate() - Number(dateRange))
      viewsQuery = viewsQuery.gte('created_at', d.toISOString())
    }

    const { data: viewsData } = await viewsQuery

    if (viewsData) {
      const grouped: Record<string, number> = {}
      viewsData.forEach((v: { article_id: string }) => {
        grouped[v.article_id] = (grouped[v.article_id] || 0) + 1
      })
      setAnalyticsViews(
        Object.entries(grouped)
          .map(([article_id, count]) => ({ article_id, count }))
          .sort((a, b) => b.count - a.count)
      )
    }

    let ratingsQuery = supabase
      .from('help_article_ratings')
      .select('article_id, helpful')

    if (dateRange !== 'all') {
      const d = new Date()
      d.setDate(d.getDate() - Number(dateRange))
      ratingsQuery = ratingsQuery.gte('created_at', d.toISOString())
    }

    const { data: ratingsData } = await ratingsQuery

    if (ratingsData) {
      const grouped: Record<string, { helpful: number; unhelpful: number }> = {}
      ratingsData.forEach((r: { article_id: string; helpful: boolean }) => {
        if (!grouped[r.article_id]) grouped[r.article_id] = { helpful: 0, unhelpful: 0 }
        if (r.helpful) grouped[r.article_id].helpful++
        else grouped[r.article_id].unhelpful++
      })
      setAnalyticsRatings(
        Object.entries(grouped).map(([article_id, counts]) => ({
          article_id,
          helpful_count: counts.helpful,
          unhelpful_count: counts.unhelpful,
        }))
      )
    }
  }, [dateRange])

  useEffect(() => {
    if (tab === 'analytics') fetchAnalytics()
  }, [tab, fetchAnalytics])

  const getArticleTitle = (id: string) => articles.find((a) => a.id === id)?.title || id

  // Render
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de ayuda - CMS</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              tab === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Articulos
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${
              tab === 'analytics'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {tab === 'list' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar articulos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => openEditor()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo articulo
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No se encontraron articulos.
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Titulo
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Categoria
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      <Eye className="w-4 h-4 inline" />
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                      Valoracion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map((article) => {
                    const rating = getRating(article.id)
                    const total = rating
                      ? rating.helpful_count + rating.unhelpful_count
                      : 0
                    const pct = total > 0 ? Math.round((rating!.helpful_count / total) * 100) : null
                    return (
                      <tr
                        key={article.id}
                        onClick={() => openEditor(article)}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                          {article.title}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {getCategoryLabel(article.category)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Circle
                            className={`w-3 h-3 inline fill-current ${
                              article.published
                                ? 'text-green-500'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {article.views_count || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {pct !== null ? (
                            <span
                              className={
                                pct >= 70
                                  ? 'text-green-600 dark:text-green-400'
                                  : pct >= 40
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                              }
                            >
                              {pct}% ({total})
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* EDITOR VIEW */}
      {tab === 'editor' && (
        <div>
          <button
            onClick={() => {
              setTab('list')
              setEditingId(null)
            }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la lista
          </button>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Editar articulo' : 'Nuevo articulo'}
            </h2>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titulo
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true)
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Category + Sort order row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {HELP_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resumen
              </label>
              <input
                type="text"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (separados por coma)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="ejemplo, tutorial, configuracion"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  form.published ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition transform ${
                    form.published ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {form.published ? 'Publicado' : 'Borrador'}
              </span>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contenido (HTML)
              </label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                style={{ minHeight: 400 }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {editingId && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.slug}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Periodo:</span>
            {(
              [
                { value: '7', label: '7 dias' },
                { value: '30', label: '30 dias' },
                { value: 'all', label: 'Todo' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  dateRange === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Top articles by views */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              Articulos mas vistos
            </h3>
            {analyticsViews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos para este periodo.</p>
            ) : (
              <div className="space-y-3">
                {analyticsViews.slice(0, 10).map((v, i) => {
                  const maxCount = analyticsViews[0]?.count || 1
                  return (
                    <div key={v.article_id} className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-400 w-6 text-right">
                        {i + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {getArticleTitle(v.article_id)}
                        </div>
                        <div className="mt-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(v.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16 text-right">
                        {v.count} vistas
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Best rated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                Mejor valorados
              </h3>
              {(() => {
                const sorted = [...analyticsRatings]
                  .map((r) => ({
                    ...r,
                    total: r.helpful_count + r.unhelpful_count,
                    pct:
                      r.helpful_count + r.unhelpful_count > 0
                        ? (r.helpful_count / (r.helpful_count + r.unhelpful_count)) * 100
                        : 0,
                  }))
                  .filter((r) => r.total >= 1)
                  .sort((a, b) => b.pct - a.pct)
                  .slice(0, 5)

                if (sorted.length === 0)
                  return <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos.</p>

                return (
                  <div className="space-y-2">
                    {sorted.map((r) => (
                      <div
                        key={r.article_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-900 dark:text-white truncate flex-1 mr-3">
                          {getArticleTitle(r.article_id)}
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                          {Math.round(r.pct)}% ({r.total})
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-500" />
                Peor valorados
              </h3>
              {(() => {
                const sorted = [...analyticsRatings]
                  .map((r) => ({
                    ...r,
                    total: r.helpful_count + r.unhelpful_count,
                    pct:
                      r.helpful_count + r.unhelpful_count > 0
                        ? (r.helpful_count / (r.helpful_count + r.unhelpful_count)) * 100
                        : 0,
                  }))
                  .filter((r) => r.total >= 1)
                  .sort((a, b) => a.pct - b.pct)
                  .slice(0, 5)

                if (sorted.length === 0)
                  return <p className="text-sm text-gray-500 dark:text-gray-400">Sin datos.</p>

                return (
                  <div className="space-y-2">
                    {sorted.map((r) => (
                      <div
                        key={r.article_id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-900 dark:text-white truncate flex-1 mr-3">
                          {getArticleTitle(r.article_id)}
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                          {Math.round(r.pct)}% ({r.total})
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
