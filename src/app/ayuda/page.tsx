'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react'
import { HELP_CATEGORIES, HELP_ARTICLES, searchArticles, getArticlesByCategory } from '@/lib/helpContent'

export default function HelpCenterPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const results = useMemo(() => {
    if (query.trim()) return searchArticles(query)
    if (activeCategory) return getArticlesByCategory(activeCategory)
    return null
  }, [query, activeCategory])

  const activeCat = HELP_CATEGORIES.find(c => c.key === activeCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-indigo-200 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver a TurnFlow
          </Link>
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen size={28} className="text-indigo-200" />
            <h1 className="text-3xl font-bold text-white">Centro de Ayuda</h1>
          </div>
          <p className="text-indigo-200 mb-8">
            Encuentra respuestas, guias paso a paso y consejos para sacar el maximo provecho de TurnFlow
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveCategory(null) }}
              placeholder="Buscar: crear venta, agregar cliente, cotizacion..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search results or category results */}
        {results ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                {query ? (
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {results.length} resultado{results.length !== 1 ? 's' : ''} para &quot;{query}&quot;
                  </h2>
                ) : activeCat ? (
                  <div>
                    <button
                      onClick={() => setActiveCategory(null)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 mb-2"
                    >
                      <ArrowLeft size={14} /> Todas las categorias
                    </button>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>{activeCat.icon}</span> {activeCat.label}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activeCat.description}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">No encontramos articulos para esa busqueda</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Intenta con otros terminos o explora las categorias</p>
                <button
                  onClick={() => { setQuery(''); setActiveCategory(null) }}
                  className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Ver todas las categorias
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {results.map(article => (
                  <Link
                    key={article.slug}
                    href={`/ayuda/${article.slug}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-lg shrink-0">
                      {HELP_CATEGORIES.find(c => c.key === article.category)?.icon ?? '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{article.summary}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Categories grid */
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Explora por categoria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              {HELP_CATEGORIES.map(cat => {
                const count = HELP_ARTICLES.filter(a => a.category === cat.key).length
                return (
                  <button
                    key={cat.key}
                    onClick={() => { setActiveCategory(cat.key); setQuery('') }}
                    className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {cat.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cat.description}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{count} articulo{count !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-500 mt-1 shrink-0 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Popular articles */}
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Articulos populares</h2>
            <div className="grid gap-3">
              {HELP_ARTICLES.slice(0, 6).map(article => (
                <Link
                  key={article.slug}
                  href={`/ayuda/${article.slug}`}
                  className="group flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
                >
                  <span className="text-lg">{HELP_CATEGORIES.find(c => c.key === article.category)?.icon ?? '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{article.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{article.summary}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿No encontraste lo que buscabas? Escribenos a{' '}
            <a href="mailto:soporte@turnflow.com.co" className="text-indigo-600 hover:underline">soporte@turnflow.com.co</a>
          </p>
        </div>
      </div>
    </div>
  )
}
