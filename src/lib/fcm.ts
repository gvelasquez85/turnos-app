/**
 * FCM HTTP V1 API helper
 *
 * Google apagó la API Legacy (fcm.googleapis.com/fcm/send + Server Key) en 2024.
 * Esta implementación usa la V1 API con Service Account (OAuth 2.0 + JWT RS256).
 *
 * Configuración requerida (en system_settings o .env):
 *   FIREBASE_SERVICE_ACCOUNT  ← JSON completo del service account de Firebase
 *
 * Cómo obtenerlo:
 *   Firebase Console → Configuración del proyecto → Cuentas de servicio
 *   → Generar nueva clave privada → descarga el .json → pega el contenido
 */

import { createSign } from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export interface ServiceAccount {
  client_email: string
  private_key: string
  project_id: string
  [key: string]: unknown
}

export interface FCMResult {
  success: boolean
  messageId?: string
  error?: string
}

// ─── JWT + Access Token ───────────────────────────────────────────────────────

function buildJWT(sa: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    })
  ).toString('base64url')

  const input = `${header}.${payload}`
  const signer = createSign('RSA-SHA256')
  signer.update(input)
  const sig = signer.sign(sa.private_key, 'base64url')
  return `${input}.${sig}`
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = buildJWT(sa)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth2:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`FCM OAuth error: ${JSON.stringify(data)}`)
  return data.access_token as string
}

// ─── Service Account loader ───────────────────────────────────────────────────

export async function getServiceAccount(): Promise<ServiceAccount | null> {
  // 1. Try DB system_settings
  try {
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await service
      .from('system_settings')
      .select('value')
      .eq('key', 'FIREBASE_SERVICE_ACCOUNT')
      .single()
    if (data?.value) {
      return JSON.parse(data.value) as ServiceAccount
    }
  } catch {}

  // 2. Fall back to env var
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (raw) {
    try {
      return JSON.parse(raw) as ServiceAccount
    } catch {}
  }

  return null
}

// ─── Send single message ──────────────────────────────────────────────────────

export async function sendFCMMessage({
  token,
  title,
  body,
  icon,
  data,
  serviceAccount,
}: {
  token: string
  title: string
  body: string
  icon?: string
  data?: Record<string, string>
  serviceAccount: ServiceAccount
}): Promise<FCMResult> {
  let accessToken: string
  try {
    accessToken = await getAccessToken(serviceAccount)
  } catch (e: any) {
    return { success: false, error: `Auth error: ${e.message}` }
  }

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          webpush: {
            notification: {
              icon: icon || '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'turnflow-ticket',
              renotify: true,
            },
          },
          data: data ?? {},
        },
      }),
    }
  )

  const result = await res.json()
  if (res.ok) return { success: true, messageId: result.name }
  return { success: false, error: result.error?.message || JSON.stringify(result) }
}

// ─── Send to many tokens (V1 doesn't support multicast, loop individually) ───

export interface BatchFCMResult {
  sent: number
  failed: number
  errors: string[]
}

export async function sendFCMBatch({
  tokens,
  title,
  body,
  icon,
  data,
  serviceAccount,
}: {
  tokens: string[]
  title: string
  body: string
  icon?: string
  data?: Record<string, string>
  serviceAccount: ServiceAccount
}): Promise<BatchFCMResult> {
  // Get access token once, reuse for all messages
  let accessToken: string
  try {
    accessToken = await getAccessToken(serviceAccount)
  } catch (e: any) {
    return { sent: 0, failed: tokens.length, errors: [`Auth error: ${e.message}`] }
  }

  const projectId = serviceAccount.project_id
  const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const iconUrl = icon || '/icon-192.png'

  let sent = 0
  let failed = 0
  const errors: string[] = []

  // Send in parallel batches of 50 (V1 API doesn't have multicast — one request per token)
  const CONCURRENCY = 50
  for (let i = 0; i < tokens.length; i += CONCURRENCY) {
    const batch = tokens.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(token =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              webpush: {
                notification: {
                  icon: iconUrl,
                  badge: iconUrl,
                  tag: 'turnflow-ticket',
                  renotify: true,
                },
              },
              data: data ?? {},
            },
          }),
        }).then(r => r.json())
      )
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.name) {
        sent++
      } else {
        failed++
        const msg =
          r.status === 'rejected'
            ? String(r.reason)
            : r.value?.error?.message || JSON.stringify(r.value)
        errors.push(msg)
      }
    }
  }

  return { sent, failed, errors: errors.slice(0, 10) } // cap error list
}
