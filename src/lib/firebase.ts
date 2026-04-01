import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(firebaseConfig)
}

let messagingInstance: Messaging | null = null

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null
  if (messagingInstance) return messagingInstance
  const { getMessaging: _getMessaging } = await import('firebase/messaging')
  messagingInstance = _getMessaging(getFirebaseApp())
  return messagingInstance
}
