'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

export default function ArticleRating({ articleId }: { articleId: string }) {
  const [rated, setRated] = useState(false)
  const [helpful, setHelpful] = useState<boolean | null>(null)

  async function rate(isHelpful: boolean) {
    if (rated) return
    setRated(true)
    setHelpful(isHelpful)
    try {
      await fetch('/api/help/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, helpful: isHelpful }),
      })
    } catch { /* silently fail */ }
  }

  if (rated) {
    return (
      <div className="text-center py-2">
        <p className="text-sm text-gray-600">
          {helpful
            ? '¡Gracias por tu feedback! Nos alegra que te haya sido util.'
            : 'Gracias por tu feedback. Trabajaremos en mejorar este articulo.'}
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-2">
      <p className="text-sm font-medium text-gray-700 mb-3">¿Te resulto util este articulo?</p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => rate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
        >
          <ThumbsUp size={15} /> Si, me ayudo
        </button>
        <button
          onClick={() => rate(false)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
        >
          <ThumbsDown size={15} /> No me ayudo
        </button>
      </div>
    </div>
  )
}
