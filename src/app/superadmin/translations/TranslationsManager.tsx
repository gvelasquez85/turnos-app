'use client'
import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Search, Plus, Download, Globe, ChevronDown, ChevronRight, Save } from 'lucide-react'

interface Props {
  staticByLang: Record<string, Record<string, string>>
  dbOverrides: { lang: string; key: string; value: string }[]
  supportedLangs: { code: string; label: string }[]
}

const KEY_GROUPS: Record<string, string> = {
  'nav.': 'Navegación',
  'section.': 'Secciones',
  'action.': 'Acciones',
  'queue.': 'Cola / Asesor',
  'form.': 'Formulario cliente',
  'est.': 'Sucursales',
  'misc.': 'Varios',
}

function groupKey(key: string): string {
  for (const prefix of Object.keys(KEY_GROUPS)) {
    if (key.startsWith(prefix)) return KEY_GROUPS[prefix]
  }
  return 'Otros'
}

export function TranslationsManager({ staticByLang, dbOverrides, supportedLangs }: Props) {
  const supabase = createClient()

  // Build mutable state: merged = static + DB overrides
  type LangOverrides = Record<string, Record<string, string>> // lang → key → value
  const [overrides, setOverrides] = useState<LangOverrides>(() => {
    const init: LangOverrides = {}
    for (const o of dbOverrides) {
      if (!init[o.lang]) init[o.lang] = {}
      init[o.lang][o.key] = o.value
    }
    return init
  })

  // Load DB overrides from client if none were passed (e.g. when embedded in BrandSettings)
  useEffect(() => {
    if (dbOverrides.length === 0) {
      createClient().from('app_translations').select('lang, key, value').then(({ data }) => {
        if (!data || data.length === 0) return
        setOverrides(prev => {
          const next = { ...prev }
          for (const o of data) {
            if (!next[o.lang]) next[o.lang] = {}
            next[o.lang][o.key] = o.value
          }
          return next
        })
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [langs, setLangs] = useState(supportedLangs)
  const [search, setSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.values(KEY_GROUPS)))
  const [saving, setSaving] = useState<Set<string>>(new Set()) // "lang:key" → saving
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [bulkSaving, setBulkSaving] = useState(false)
  const [newLangCode, setNewLangCode] = useState('')
  const [newLangLabel, setNewLangLabel] = useState('')
  const [newKey, setNewKey] = useState('')
  const [showAddKey, setShowAddKey] = useState(false)
  const [showAddLang, setShowAddLang] = useState(false)

  // All keys from static (baseline)
  const allKeys = useMemo(() => {
    const keySet = new Set<string>()
    for (const dict of Object.values(staticByLang)) {
      Object.keys(dict).forEach(k => keySet.add(k))
    }
    // Add keys from DB overrides too (for custom keys)
    for (const dict of Object.values(overrides)) {
      Object.keys(dict).forEach(k => keySet.add(k))
    }
    return Array.from(keySet).sort()
  }, [staticByLang, overrides])

  const filteredKeys = search
    ? allKeys.filter(k => k.toLowerCase().includes(search.toLowerCase()) ||
        langs.some(l => getValue(l.code, k).toLowerCase().includes(search.toLowerCase())))
    : allKeys

  const groups = useMemo(() => {
    const grouped: Record<string, string[]> = {}
    for (const key of filteredKeys) {
      const g = groupKey(key)
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(key)
    }
    return grouped
  }, [filteredKeys])

  function getValue(lang: string, key: string): string {
    return overrides[lang]?.[key] ?? staticByLang[lang]?.[key] ?? staticByLang['es']?.[key] ?? ''
  }

  function isOverridden(lang: string, key: string): boolean {
    return overrides[lang]?.[key] !== undefined
  }

  function isModified(lang: string, key: string): boolean {
    const dbVal = dbOverrides.find(o => o.lang === lang && o.key === key)?.value
    const currentVal = overrides[lang]?.[key]
    if (currentVal === undefined) return false
    return currentVal !== (dbVal ?? staticByLang[lang]?.[key] ?? '')
  }

  function handleChange(lang: string, key: string, value: string) {
    setOverrides(prev => ({
      ...prev,
      [lang]: { ...(prev[lang] || {}), [key]: value },
    }))
  }

  async function saveCell(lang: string, key: string) {
    const value = getValue(lang, key)
    const cellId = `${lang}:${key}`
    setSaving(prev => new Set(prev).add(cellId))
    try {
      await supabase.from('app_translations').upsert(
        { lang, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'lang,key' }
      )
      setSavedKeys(prev => { const s = new Set(prev); s.add(cellId); setTimeout(() => setSavedKeys(p => { const n = new Set(p); n.delete(cellId); return n }), 2000); return s })
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(cellId); return s })
    }
  }

  async function saveAll() {
    setBulkSaving(true)
    const rows: { lang: string; key: string; value: string; updated_at: string }[] = []
    for (const [lang, dict] of Object.entries(overrides)) {
      for (const [key, value] of Object.entries(dict)) {
        rows.push({ lang, key, value, updated_at: new Date().toISOString() })
      }
    }
    if (rows.length > 0) {
      await supabase.from('app_translations').upsert(rows, { onConflict: 'lang,key' })
    }
    setBulkSaving(false)
  }

  function downloadJSON(langCode: string) {
    const dict: Record<string, string> = {}
    for (const key of allKeys) {
      dict[key] = getValue(langCode, key)
    }
    const blob = new Blob([JSON.stringify(dict, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `translations_${langCode}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function addLanguage() {
    if (!newLangCode.trim() || !newLangLabel.trim()) return
    const code = newLangCode.trim().toLowerCase()
    if (langs.find(l => l.code === code)) return
    // Pre-fill with Spanish as base
    const esDict = staticByLang['es'] ?? {}
    setOverrides(prev => ({ ...prev, [code]: { ...esDict } }))
    setLangs(prev => [...prev, { code, label: newLangLabel.trim() }])
    setNewLangCode('')
    setNewLangLabel('')
    setShowAddLang(false)
  }

  function addKey() {
    if (!newKey.trim()) return
    const key = newKey.trim()
    if (allKeys.includes(key)) return
    for (const l of langs) {
      setOverrides(prev => ({
        ...prev,
        [l.code]: { ...(prev[l.code] || {}), [key]: '' },
      }))
    }
    setNewKey('')
    setShowAddKey(false)
  }

  const pendingChanges = Object.entries(overrides).reduce((sum, [lang, dict]) => {
    return sum + Object.keys(dict).filter(k => isModified(lang, k)).length
  }, 0)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar clave o texto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowAddKey(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Plus size={14} /> Nueva clave
        </button>

        <button
          onClick={() => setShowAddLang(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Globe size={14} /> Nuevo idioma
        </button>

        <button
          onClick={saveAll}
          disabled={bulkSaving || pendingChanges === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={14} />
          {bulkSaving ? 'Guardando...' : `Guardar todo${pendingChanges > 0 ? ` (${pendingChanges})` : ''}`}
        </button>
      </div>

      {/* Add key form */}
      {showAddKey && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="ej: nav.newSection"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
          <button onClick={addKey} disabled={!newKey.trim()} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg font-medium disabled:opacity-50">Agregar</button>
          <button onClick={() => setShowAddKey(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Add language form */}
      {showAddLang && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Código (ej: fr)"
            value={newLangCode}
            maxLength={5}
            onChange={e => setNewLangCode(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Nombre (ej: Français)"
            value={newLangLabel}
            onChange={e => setNewLangLabel(e.target.value)}
            className="flex-1 min-w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
          <p className="text-xs text-green-700 w-full">Se pre-rellenará con los textos en Español como base.</p>
          <button onClick={addLanguage} disabled={!newLangCode.trim() || !newLangLabel.trim()} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium disabled:opacity-50">Crear idioma</button>
          <button onClick={() => setShowAddLang(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Language header row */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="grid gap-2" style={{ gridTemplateColumns: `240px repeat(${langs.length}, 1fr)` }}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Clave</div>
            {langs.map(l => (
              <div key={l.code} className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{l.label}</span>
                <button
                  onClick={() => downloadJSON(l.code)}
                  title={`Descargar JSON ${l.label}`}
                  className="text-gray-400 hover:text-indigo-600 p-0.5"
                >
                  <Download size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        {Object.entries(groups).map(([group, keys]) => (
          <div key={group} className="border-b border-gray-100 last:border-0">
            {/* Group header */}
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
              onClick={() => setExpandedGroups(prev => {
                const next = new Set(prev)
                if (next.has(group)) next.delete(group); else next.add(group)
                return next
              })}
            >
              {expandedGroups.has(group) ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
              <span className="text-xs font-semibold text-gray-600">{group}</span>
              <span className="text-xs text-gray-400 ml-1">({keys.length})</span>
            </button>

            {/* Keys */}
            {expandedGroups.has(group) && (
              <div className="divide-y divide-gray-50">
                {keys.map(key => (
                  <div key={key} className="px-4 py-2 hover:bg-gray-50 transition-colors">
                    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: `240px repeat(${langs.length}, 1fr)` }}>
                      {/* Key name */}
                      <div className="min-w-0">
                        <code className="text-xs font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded break-all">{key}</code>
                      </div>
                      {/* Translation cells */}
                      {langs.map(l => {
                        const cellId = `${l.code}:${key}`
                        const isSaving = saving.has(cellId)
                        const isSaved = savedKeys.has(cellId)
                        const modified = isModified(l.code, key)
                        return (
                          <div key={l.code} className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={getValue(l.code, key)}
                              onChange={e => handleChange(l.code, key, e.target.value)}
                              onBlur={() => { if (modified) saveCell(l.code, key) }}
                              className={`flex-1 min-w-0 rounded-md border px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors ${
                                modified ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
                              }`}
                              placeholder={staticByLang['es']?.[key] || key}
                            />
                            {isSaved && <Check size={12} className="text-green-500 shrink-0" />}
                            {isSaving && <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredKeys.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search ? 'Sin resultados para la búsqueda' : 'Sin claves de traducción'}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Los cambios se guardan automáticamente al salir de cada campo. También puedes usar "Guardar todo" para aplicar todos los cambios pendientes.
        Las traducciones editadas aquí se aplican desde la base de datos, con el archivo estático como respaldo.
      </p>
    </div>
  )
}
