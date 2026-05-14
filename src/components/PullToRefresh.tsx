'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 80 // px to pull before triggering refresh
const MAX_PULL = 120

export function PullToRefresh() {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isPulling = useRef(false)

  const canPull = useCallback(() => {
    // Only allow pull when scrolled to top
    return window.scrollY <= 0
  }, [])

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      if (!canPull()) return
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPulling.current) return
      if (!canPull()) {
        isPulling.current = false
        setPulling(false)
        setPullDistance(0)
        return
      }

      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current

      if (diff > 0) {
        // Pulling down
        e.preventDefault()
        const distance = Math.min(diff * 0.5, MAX_PULL) // dampen
        setPulling(true)
        setPullDistance(distance)
      } else {
        isPulling.current = false
        setPulling(false)
        setPullDistance(0)
      }
    }

    function handleTouchEnd() {
      if (!isPulling.current) return
      isPulling.current = false

      if (pullDistance >= THRESHOLD) {
        setRefreshing(true)
        setPullDistance(THRESHOLD * 0.6)
        // Reload page
        setTimeout(() => {
          window.location.reload()
        }, 300)
      } else {
        setPulling(false)
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [canPull, pullDistance])

  if (!pulling && !refreshing) return null

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const rotation = progress * 360

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none transition-transform duration-200"
      style={{ transform: `translateY(${pullDistance - 40}px)` }}
    >
      <div
        className={`w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-opacity ${
          pullDistance > 10 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <RefreshCw
          size={18}
          className={`text-indigo-600 transition-transform ${refreshing ? 'animate-spin' : ''}`}
          style={!refreshing ? { transform: `rotate(${rotation}deg)` } : undefined}
        />
      </div>
    </div>
  )
}
