'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>(null)
  const prevPath = useRef(pathname)

  useEffect(() => {
    // Route changed - complete the progress
    if (prevPath.current !== pathname) {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
      prevPath.current = pathname
    }
  }, [pathname, searchParams])

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return
      if (anchor.target === '_blank') return
      // Same page link - skip
      if (href === pathname) return

      setLoading(true)
      setProgress(20)
      clearInterval(timerRef.current as unknown as number)
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 90) { clearInterval(timerRef.current as unknown as number); return 90 }
          return p + Math.random() * 10
        })
      }, 300)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearInterval(timerRef.current as unknown as number)
    }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div
        className="h-full bg-indigo-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  )
}
