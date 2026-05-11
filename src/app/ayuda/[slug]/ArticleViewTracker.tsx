'use client'

import { useEffect, useRef } from 'react'

export default function ArticleViewTracker({ articleId }: { articleId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    fetch('/api/help/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    }).catch(() => {})
  }, [articleId])

  return null
}
