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
  const [lastError, setLastError] = useState<string | null>(null)

  const requestAndGetToken = useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setLastError('Este navegador no soporta notificaciones')
      return null
    }
    setLoading(true)
    setLastError(null)
    try {
      // 1. Registrar service worker
      let swReg: ServiceWorkerRegistration
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
        await navigator.serviceWorker.ready
      } catch (swErr) {
        const msg = swErr instanceof Error ? swErr.message : String(swErr)
        console.error('[FCM] SW registration failed:', msg)
        setLastError(`Service worker: ${msg}`)
        return null
      }

      // 2. Solicitar permiso
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') {
        setLastError(perm === 'denied'
          ? 'Permiso denegado. Habilítalo en la configuración del navegador.'
          : 'No se otorgó permiso de notificaciones')
        return null
      }

      // 3. Inicializar Firebase Messaging
      const messaging = await getFirebaseMessaging()
      if (!messaging) {
        console.error('[FCM] getFirebaseMessaging() returned null')
        setLastError('Firebase no se pudo inicializar')
        return null
      }

      // 4. Obtener token — incluir vapidKey solo si está configurada
      const tokenOptions: Parameters<typeof getToken>[1] = {
        serviceWorkerRegistration: swReg,
      }
      if (VAPID_KEY) tokenOptions.vapidKey = VAPID_KEY

      const token = await getToken(messaging, tokenOptions)
      if (!token) {
        console.error('[FCM] getToken devolvió cadena vacía')
        setLastError('No se obtuvo token. Verifica la configuración de Firebase/VAPID.')
        return null
      }

      console.log('[FCM] Token OK:', token.slice(0, 20) + '…')
      return token
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[FCM] Error:', msg)
      setLastError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { permission, loading, requestAndGetToken, lastError }
}
