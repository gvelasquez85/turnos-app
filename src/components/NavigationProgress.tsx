'use client'
import { useEffect, useState, useTransition, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevKey = useRef(`${pathname}${searchParams}`)

  useEffect(() => {
    const key = `${pathname}${searchParams}`
    if (key === prevKey.current) return
    prevKey.current = key

    // Route changed → reset and start
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(0)
    setVisible(true)

    // Animate quickly to ~85%, then wait for route to finish
    let p = 0
    timerRef.current = setInterval(() => {
      p += Math.random() * 15
      if (p >= 85) {
        p = 85
        clearInterval(timerRef.current!)
      }
      setProgress(p)
    }, 120)

    // Complete after a short delay (route is rendered by then in App Router)
    const completeTimer = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current)
      setProgress(100)
      setTimeout(() => setVisible(false), 300)
    }, 500)

    return () => {
      clearInterval(timerRef.current!)
      clearTimeout(completeTimer)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none">
      <div
        className="h-full bg-indigo-500 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(99,102,241,0.8)]"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  )
}
