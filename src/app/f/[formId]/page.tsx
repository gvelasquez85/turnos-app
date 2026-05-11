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
        .select('id, brand_id, name, fields, brands(name, logo_url)')
        .eq('id', formId)
        .eq('active', true)
        .maybeSingle()

      if (!data) { setNotFound(true); setLoading(false); return }

      const brand = data.brands as unknown as { name: string; logo_url?: string } | null
      setConfig({
        id: data.id,
        brand_id: data.brand_id,
        name: data.name,
        fields: (data.fields ?? []) as FormConfig['fields'],
        brand_name: brand?.name ?? undefined,
        brand_logo: brand?.logo_url ?? undefined,
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-5 text-center">
            {config.brand_logo && (
              <img src={config.brand_logo} alt="" className="h-10 mx-auto mb-3 rounded-lg" />
            )}
            {config.brand_name && (
              <p className="text-indigo-200 text-sm mb-1">{config.brand_name}</p>
            )}
            <h1 className="text-xl font-bold text-white">{config.name}</h1>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                      className="w-full h-11 px-3 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder={field.label}
                    />
                  </div>
                ))}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 h-11 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 text-center">
            <a href="https://app.turnflow.com.co" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-500 transition-colors">
              Potenciado por <span className="font-semibold">TurnFlow</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
