import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TranslationsManager } from './TranslationsManager'
import { getTranslations, SUPPORTED_LANGUAGES } from '@/lib/i18n/translations'

export default async function TranslationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/')

  // Load DB overrides (graceful: table may not exist yet)
  let dbOverrides: { lang: string; key: string; value: string }[] = []
  try {
    const { data } = await supabase
      .from('app_translations')
      .select('lang, key, value')
    dbOverrides = data || []
  } catch {
    // Table doesn't exist yet — start with empty overrides
  }

  // Build merged translations: static defaults + DB overrides
  const staticByLang: Record<string, Record<string, string>> = {}
  for (const { code } of SUPPORTED_LANGUAGES) {
    staticByLang[code] = getTranslations(code) as Record<string, string>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Gestor de traducciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">Edita los textos de la interfaz para cada idioma soportado</p>
      </div>
      <TranslationsManager
        staticByLang={staticByLang}
        dbOverrides={dbOverrides}
        supportedLangs={SUPPORTED_LANGUAGES.map(l => ({ code: l.code, label: l.label }))}
      />
    </div>
  )
}
