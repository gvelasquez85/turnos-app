'use client'
import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Sync with what the blocking script already set on <html>
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    setDark(prev => {
      const next = !prev
      try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return { dark, toggle }
}
