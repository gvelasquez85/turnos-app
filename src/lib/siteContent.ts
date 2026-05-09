import { createClient } from '@supabase/supabase-js'

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

let cache: { data: Record<string, string>; ts: number } | null = null
const CACHE_TTL = 60_000 // 60 seconds

export async function getSiteContent(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return cache.data
  }

  try {
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

    const merged = { ...SITE_CONTENT_DEFAULTS, ...dbValues }
    cache = { data: merged, ts: Date.now() }
    return merged
  } catch {
    return { ...SITE_CONTENT_DEFAULTS }
  }
}

/** Bust the in-memory cache after an update */
export function invalidateSiteContentCache() {
  cache = null
}
