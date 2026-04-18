'use client'
import { useState } from 'react'
import { Shield, Search, ArrowRight } from 'lucide-react'

export default function ValidarAutorizacionPage() {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) { setError('Ingresa el número de autorización o el ID de turno'); return }
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmed)) {
      setError('El código debe ser un UUID válido (ej: 3f2504e0-4f89-11d3-9a0c-0305e82c3301)')
      return
    }
    // Navigate to the validation page — it resolves by consent_id or ticket_id
    window.location.href = `/validar/${encodeURIComponent(trimmed)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Shield size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Validar autorización</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Ingresa el número único de atención o el código de autorización
            que aparece en tu turno para verificar el registro de tu consentimiento.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Código de turno o autorización
          </label>
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            placeholder="ej: 3f2504e0-4f89-11d3-9a0c-0305e82c3301"
            className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            autoFocus
            spellCheck={false}
          />
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Search size={16} />
            Verificar autorización
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Help text */}
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700 leading-relaxed">
          <p className="font-semibold mb-1">¿Cómo obtener el código?</p>
          <p>El código de autorización fue emitido cuando tomaste turno. Aparece en el comprobante de tu turno como un número único en formato UUID.</p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-indigo-600">TurnFlow</span>
        </p>
      </div>
    </div>
  )
}
