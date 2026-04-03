'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translate, type LangCode, type TranslationKey } from './translations'

interface I18nContextValue {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: TranslationKey, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
})

export function I18nProvider({ children, initialLang = 'es' }: { children: ReactNode; initialLang?: LangCode }) {
  const [lang, setLangState] = useState<LangCode>(initialLang)

  useEffect(() => {
    // Persist chosen language in localStorage for session consistency
    try {
      const stored = localStorage.getItem('turnapp-lang') as LangCode | null
      if (stored && stored !== initialLang) setLangState(stored)
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setLang(l: LangCode) {
    setLangState(l)
    try { localStorage.setItem('turnapp-lang', l) } catch { /* ignore */ }
  }

  function t(key: TranslationKey, fallback?: string): string {
    return translate(lang, key, fallback)
  }

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}
