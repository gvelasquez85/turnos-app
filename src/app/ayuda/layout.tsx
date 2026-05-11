'use client'

import { useEffect } from 'react'

/**
 * Force light mode for the help center — remove `dark` class while
 * on /ayuda and restore it when navigating away.
 */
export default function AyudaLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    const wasDark = html.classList.contains('dark')
    html.classList.remove('dark')

    return () => {
      if (wasDark) html.classList.add('dark')
    }
  }, [])

  return <>{children}</>
}
