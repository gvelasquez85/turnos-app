import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * ─── Arquitectura de dominios TurnFlow ────────────────────────────────────────
 *
 *  www.turnflow.com.co  →  Marketing / Landing + páginas públicas de clientes
 *  app.turnflow.com.co  →  Aplicación (login, admin, advisor, superadmin…)
 *
 * Rutas públicas que se sirven desde www:
 *   /           Landing page
 *   /display/*  Pantalla TV (QR en mostrador)
 *   /espera/*   Cola pública del cliente
 *   /book/*     Solicitud de turno / reserva
 *   /t/*        Estado del turno individual
 *   /order/*    Órdenes / preorden
 *   /survey/*   Encuestas de satisfacción
 *   /validar*   Validación pública
 *   /api/*      APIs (accedidas desde las páginas públicas anteriores)
 *
 * Rutas de la app que redirigen a app.turnflow.com.co:
 *   /login  /admin  /advisor  /superadmin  /reports
 *   /setup  /profile  /forgot-password  /reset-password  /auth
 *
 * ─── Checklist para activar el subdominio en Vercel ───────────────────────────
 *  1. Vercel → Project Settings → Domains → Add "app.turnflow.com.co"
 *  2. DNS: CNAME  app  →  cname.vercel-dns.com
 *  3. Supabase → Authentication → URL Configuration:
 *       - Site URL:           https://app.turnflow.com.co
 *       - Redirect URLs:      https://app.turnflow.com.co/**
 *  4. Wompi webhook URL:     https://app.turnflow.com.co/api/billing/webhook
 *  5. Vercel env vars:
 *       NEXT_PUBLIC_SITE_URL = https://app.turnflow.com.co
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Rutas de la app — se redirigen a app.* cuando se accede desde el dominio marketing */
const APP_ROUTES = [
  '/login',
  '/admin',
  '/advisor',
  '/superadmin',
  '/reports',
  '/setup',
  '/profile',
  '/forgot-password',
  '/reset-password',
  '/auth',
]

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Localhost y Vercel previews: skip subdomain routing (desarrollo normal)
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const isPreview = hostname.endsWith('.vercel.app')
  const isAppSubdomain = hostname.startsWith('app.')

  if (!isLocal && !isPreview && !isAppSubdomain) {
    // Estamos en el dominio marketing (www.turnflow.com.co o el apex)
    // Redirigir rutas de la app al subdominio app.
    const isAppRoute = APP_ROUTES.some(
      r => pathname === r || pathname.startsWith(r + '/')
    )

    if (isAppRoute) {
      const url = request.nextUrl.clone()
      const baseHost = hostname.replace(/^www\./, '')   // www.turnflow.com.co → turnflow.com.co
      url.hostname = 'app.' + baseHost                  // → app.turnflow.com.co
      url.port = ''                                     // quitar puerto en producción
      // 302 (temporal) para no cachear mientras termina la configuración DNS
      return NextResponse.redirect(url, 302)
    }

    // Páginas de marketing / públicas: solo refrescar sesión Supabase
    return await updateSession(request)
  }

  // Subdominio app, localhost, o Vercel preview: manejo normal de sesión
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
