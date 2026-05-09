import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  // Hero
  hero_badge: 'Gestión de clientes para negocios locales',
  hero_title: 'Tu negocio necesita',
  hero_title_accent: 'recordar más,',
  hero_title_end: 'perder menos',
  hero_subtitle: 'TurnFlow centraliza tus clientes, automatiza recordatorios y elimina las filas. Todo desde el celular, sin complicaciones.',
  hero_cta_primary: 'Empezar gratis',
  hero_cta_secondary: 'Ver cómo funciona',
  hero_trust_text: '+200 negocios activos',

  // Industries
  industries_badge: 'Por industria',
  industries_title: 'Hecho para tu tipo de negocio',
  industries_subtitle: 'TurnFlow se adapta a la realidad de cada sector. Elige el tuyo y ve cómo lo resolvemos.',

  // Features
  features_badge: 'Funcionalidades',
  features_title: 'Todo lo que necesitas, nada de lo que no',
  features_subtitle: 'Un sistema diseñado para negocios locales reales, no para corporaciones.',

  // How it works
  how_it_works_badge: 'Cómo funciona',
  how_it_works_title: 'De cero a clientes fidelizados en 3 pasos',
  how_it_works_subtitle: 'Sin capacitaciones largas, sin consultores, sin integraciones complejas.',

  // Comparison
  comparison_badge: 'Comparativa',
  comparison_title: 'TurnFlow vs cómo lo hacías antes',
  comparison_subtitle: 'Muchos negocios aún gestionan clientes con Excel, WhatsApp o de memoria. Mira la diferencia.',

  // ROI
  roi_badge: 'Calculadora ROI',
  roi_title: '¿Cuánto dinero estás dejando ir?',
  roi_subtitle: 'Ajusta los números de tu negocio y ve cuánto podrías recuperar con TurnFlow.',

  // Testimonials
  testimonials_badge: 'Casos de éxito',
  testimonials_title: 'Negocios reales, resultados reales',
  testimonials_subtitle: 'Más de 200 negocios ya usan TurnFlow para recuperar clientes y mejorar su operación.',

  // Pricing
  pricing_badge: 'Precios',
  pricing_title: 'Simple y transparente',
  pricing_subtitle: 'Empieza gratis y escala cuando estés listo. Sin contratos, sin sorpresas.',

  // CTA
  cta_badge: 'Empieza hoy',
  cta_title: 'Tu próximo cliente recurrente',
  cta_title_accent: 'ya está esperando que lo llames',
  cta_subtitle: 'Únete a más de 200 negocios que ya usan TurnFlow para recuperar clientes y llenar su agenda.',

  // Footer
  footer_tagline: 'El CRM simple para negocios locales que quieren crecer con sus clientes.',
}

/* ─── File-based cache ──────────────────────────────────────────────────────── */

const CACHE_DIR = path.join(process.cwd(), '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'site-content.json')
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }
}

function readCacheFile(): Record<string, string> | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null
    const stat = fs.statSync(CACHE_FILE)
    // Expire after 30 days
    if (Date.now() - stat.mtimeMs > CACHE_MAX_AGE_MS) return null
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCacheFile(data: Record<string, string>) {
  try {
    ensureCacheDir()
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // Silently fail — cache is optional
  }
}

async function fetchFromDb(): Promise<Record<string, string>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: rows, error } = await supabase
    .from('site_content')
    .select('key, value')

  if (error || !rows || rows.length === 0) {
    return { ...SITE_CONTENT_DEFAULTS }
  }

  const dbValues: Record<string, string> = {}
  for (const row of rows) {
    dbValues[row.key] = row.value
  }

  return { ...SITE_CONTENT_DEFAULTS, ...dbValues }
}

/**
 * Get site content. Reads from file cache first (valid for 30 days).
 * Only hits DB if no cache exists or it expired.
 */
export async function getSiteContent(): Promise<Record<string, string>> {
  // 1. Try file cache
  const cached = readCacheFile()
  if (cached) return cached

  // 2. Fetch from DB and write cache
  const data = await fetchFromDb()
  writeCacheFile(data)
  return data
}

/**
 * Refresh cache on demand — fetches from DB and writes to file.
 * Called after saving changes in the CMS.
 */
export async function refreshSiteContentCache(): Promise<Record<string, string>> {
  const data = await fetchFromDb()
  writeCacheFile(data)
  return data
}

/** @deprecated Use refreshSiteContentCache instead */
export function invalidateSiteContentCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE)
    }
  } catch {
    // ignore
  }
}
