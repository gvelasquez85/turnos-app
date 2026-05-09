'use client'

import { useState, useEffect } from 'react'

type SectionConfig = {
  label: string
  fields: { key: string; label: string; multiline?: boolean }[]
}

const SECTIONS: SectionConfig[] = [
  {
    label: 'Hero',
    fields: [
      { key: 'hero_badge', label: 'Badge' },
      { key: 'hero_title', label: 'Título (línea 1)' },
      { key: 'hero_title_accent', label: 'Título (acento itálico)' },
      { key: 'hero_title_end', label: 'Título (línea final)' },
      { key: 'hero_subtitle', label: 'Subtítulo', multiline: true },
      { key: 'hero_cta_primary', label: 'Botón primario' },
      { key: 'hero_cta_secondary', label: 'Botón secundario' },
      { key: 'hero_trust_text', label: 'Texto de confianza' },
    ],
  },
  {
    label: 'Industrias',
    fields: [
      { key: 'industries_badge', label: 'Badge' },
      { key: 'industries_title', label: 'Título' },
      { key: 'industries_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Funcionalidades',
    fields: [
      { key: 'features_badge', label: 'Badge' },
      { key: 'features_title', label: 'Título' },
      { key: 'features_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Cómo funciona',
    fields: [
      { key: 'how_it_works_badge', label: 'Badge' },
      { key: 'how_it_works_title', label: 'Título' },
      { key: 'how_it_works_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Comparativa',
    fields: [
      { key: 'comparison_badge', label: 'Badge' },
      { key: 'comparison_title', label: 'Título' },
      { key: 'comparison_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Calculadora ROI',
    fields: [
      { key: 'roi_badge', label: 'Badge' },
      { key: 'roi_title', label: 'Título' },
      { key: 'roi_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Casos de éxito',
    fields: [
      { key: 'testimonials_badge', label: 'Badge' },
      { key: 'testimonials_title', label: 'Título' },
      { key: 'testimonials_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Precios',
    fields: [
      { key: 'pricing_badge', label: 'Badge' },
      { key: 'pricing_title', label: 'Título' },
      { key: 'pricing_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'CTA Final',
    fields: [
      { key: 'cta_badge', label: 'Badge' },
      { key: 'cta_title', label: 'Título' },
      { key: 'cta_title_accent', label: 'Título (acento)' },
      { key: 'cta_subtitle', label: 'Subtítulo', multiline: true },
    ],
  },
  {
    label: 'Footer',
    fields: [
      { key: 'footer_tagline', label: 'Tagline', multiline: true },
    ],
  },
]

export function CmsEditor() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/superadmin/site-content')
      .then(r => r.json())
      .then(res => {
        setContent(res.data ?? {})
        setOriginal(res.data ?? {})
      })
      .finally(() => setLoading(false))
  }, [])

  const hasChanges = Object.keys(content).some(k => content[k] !== original[k])

  async function save() {
    setSaving(true)
    const changed = Object.entries(content)
      .filter(([k, v]) => v !== original[k])
      .map(([key, value]) => ({ key, value }))

    if (changed.length === 0) {
      setSaving(false)
      return
    }

    const res = await fetch('/api/superadmin/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: changed }),
    })

    if (res.ok) {
      setOriginal({ ...content })
      setToast('Cambios guardados correctamente')
      setTimeout(() => setToast(''), 3000)
    } else {
      setToast('Error al guardar')
      setTimeout(() => setToast(''), 3000)
    }
    setSaving(false)
  }

  async function refreshCache() {
    setRefreshing(true)
    const res = await fetch('/api/superadmin/site-content', { method: 'POST' })
    if (res.ok) {
      setToast('Cache actualizado correctamente')
    } else {
      setToast('Error al refrescar cache')
    }
    setTimeout(() => setToast(''), 3000)
    setRefreshing(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando contenido...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contenido del sitio</h1>
          <p className="text-sm text-gray-500 mt-1">Edita los textos de la landing page</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshCache}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresca el cache del servidor sin guardar cambios"
          >
            {refreshing ? 'Refrescando...' : '🔄 Refrescar cache'}
          </button>
          <a
            href="/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Vista previa
          </a>
          <button
            onClick={save}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`p-3 rounded-lg text-sm font-medium ${toast.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {toast}
        </div>
      )}

      {SECTIONS.map(section => (
        <div key={section.label} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{section.label}</h2>
          </div>
          <div className="p-6 space-y-4">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  <span className="ml-2 text-xs text-gray-400 font-mono">{field.key}</span>
                </label>
                {field.multiline ? (
                  <textarea
                    value={content[field.key] ?? ''}
                    onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={content[field.key] ?? ''}
                    onChange={e => setContent(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
                {content[field.key] !== original[field.key] && (
                  <span className="text-xs text-amber-600 mt-1 inline-block">Modificado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
