'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { translate, type LangCode } from './translations'

interface I18nContextValue {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
})

// Cache DB overrides in memory for the session
let dbOverrideCache: Record<string, Record<string, string>> | null = null

export function I18nProvider({ children, initialLang = 'es' }: { children: ReactNode; initialLang?: LangCode }) {
  const [lang, setLangState] = useState<LangCode>(initialLang)
  const [dbOverrides, setDbOverrides] = useState<Record<string, Record<string, string>>>(dbOverrideCache ?? {})

  useEffect(() => {
    // Persist chosen language in localStorage for session consistency
    try {
      const stored = localStorage.getItem('turnflow-lang') as LangCode | null
      if (stored && stored !== initialLang) setLangState(stored)
    } catch { /* ignore */ }

    // Load DB translation overrides (only once per session)
    if (dbOverrideCache === null) {
      const supabase = createClient()
      supabase.from('app_translations').select('lang, key, value').then(({ data, error }) => {
        if (error) { dbOverrideCache = {}; return }
        const merged: Record<string, Record<string, string>> = {}
        for (const row of (data || [])) {
          if (!merged[row.lang]) merged[row.lang] = {}
          merged[row.lang][row.key] = row.value
        }
        dbOverrideCache = merged
        setDbOverrides(merged)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setLang(l: LangCode) {
    setLangState(l)
    try { localStorage.setItem('turnflow-lang', l) } catch { /* ignore */ }
  }

  function t(key: string, fallback?: string): string {
    // DB override takes priority over static translation
    const override = dbOverrides[lang]?.[key]
    if (override) return override
    return translate(lang, key, fallback)
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}
