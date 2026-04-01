'use client'
import { useState, useCallback } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export type PushPermission = 'default' | 'granted' | 'denied'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>(
    typeof Notification !== 'undefined' ? (Notification.permission as PushPermission) : 'default'
  )
  const [loading, setLoading] = useState(false)

  const requestAndGetToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return null
    setLoading(true)
    try {
      // Register our service worker explicitly so Firebase uses it
      const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      })

      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') return null

      const messaging = await getFirebaseMessaging()
      if (!messaging) return null

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      })
      return token || null
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, loading, requestAndGetToken }
}
