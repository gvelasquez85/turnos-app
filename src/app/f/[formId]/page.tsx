'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FormConfig {
  id: string
  brand_id: string
  name: string
  fields: { key: string; label: string; type: string; required?: boolean }[]
  brand_name?: string
  brand_logo?: string
  brand_color?: string // hex color e.g. '#6366f1'
}

/** Lighten a hex color by mixing with white */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

/** Darken a hex color */
function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const dr = Math.round(r * (1 - amount))
  const dg = Math.round(g * (1 - amount))
  const db = Math.round(b * (1 - amount))
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
}

export default function PublicLeadFormPage() {
  const { formId } = useParams<{ formId: string }>()
  const [config, setConfig] = useState<FormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('lead_forms')
        .select('id, brand_id, name, fields, brands(name, logo_url, primary_color)')
        .eq('id', formId)
        .eq('active', true)
        .maybeSingle()

      if (!data) { setNotFound(true); setLoading(false); return }

      const brand = data.brands as unknown as { name: string; logo_url?: string; primary_color?: string } | null
      setConfig({
        id: data.id,
        brand_id: data.brand_id,
        name: data.name,
        fields: (data.fields ?? []) as FormConfig['fields'],
        brand_name: brand?.name ?? undefined,
        brand_logo: brand?.logo_url ?? undefined,
        brand_color: brand?.primary_color ?? undefined,
      })
      setLoading(false)
    }
    load()
  }, [formId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!config) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name || values.nombre || '',
          email: values.email || values.correo || '',
          phone: values.phone || values.celular || values.telefono || '',
          brand_id: config.brand_id,
          source: 'embed_form',
          lead_form_id: config.id,
          custom_fields: values,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Error al enviar')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  // Brand color or default indigo
  const color = config?.brand_color || '#6366f1'
  const colorLight = lighten(color, 0.92)
  const colorMuted = lighten(color, 0.6)
  const colorHover = darken(color, 0.1)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: color }} />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-4xl mb-4">📋</p>
        <p className="text-gray-500">Este formulario no esta disponible</p>
      </div>
    </div>
  )

  if (!config) return null

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: `linear-gradient(to bottom, ${colorLight}, white)` }}
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header — brand color */}
          <div className="px-6 py-5 text-center" style={{ backgroundColor: color }}>
            {config.brand_logo && (
              <img src={config.brand_logo} alt="" className="h-12 mx-auto mb-3 rounded-lg object-contain bg-white/10 p-1" />
            )}
            {config.brand_name && (
              <p className="text-sm mb-1" style={{ color: colorMuted }}>{config.brand_name}</p>
            )}
            <h1 className="text-xl font-bold text-white">{config.name}</h1>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colorLight }}
                >
                  <svg className="w-7 h-7" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-gray-900 text-lg">¡Datos enviados!</p>
                <p className="text-sm text-gray-500 mt-1">Nos pondremos en contacto contigo pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {config.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      required={field.required !== false}
                      value={values[field.key] || ''}
                      onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                      style={{ '--tw-ring-color': color } as React.CSSProperties}
                      placeholder={field.label}
                    />
                  </div>
                ))}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-11 rounded-lg text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                  style={{ backgroundColor: color }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = colorHover)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = color)}
                >
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 text-center">
            <a href="https://app.turnflow.com.co" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Potenciado por <span className="font-semibold">TurnFlow</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
