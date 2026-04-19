import { NextResponse } from 'next/server'
import { getAcceptanceTokens } from '@/lib/wompi'

/**
 * GET /api/billing/acceptance
 * Retorna los tokens de aceptación de Wompi requeridos antes de mostrar
 * el formulario de tarjeta. No requiere autenticación (tokens son públicos
 * y de uso único de corta duración).
 */
export async function GET() {
  try {
    const tokens = await getAcceptanceTokens()
    return NextResponse.json(tokens)
  } catch (err) {
    console.error('[billing/acceptance]', err)
    return NextResponse.json(
      { error: 'No se pudieron obtener los tokens de aceptación' },
      { status: 502 },
    )
  }
}
