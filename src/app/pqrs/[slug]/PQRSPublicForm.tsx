'use client'

import { useState } from 'react'
import { Send, CheckCircle, Paperclip, X } from 'lucide-react'

interface Props {
  slug: string
  brandName: string
  brandLogo: string
  formTitle: string
  formDescription: string
  categories: string[]
  primaryColor: string
}

export default function PQRSPublicForm({ slug, brandName, brandLogo, formTitle, formDescription, categories, primaryColor }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [idType, setIdType] = useState('CC')
  const [idNumber, setIdNumber] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Petición')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; radicado?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !subject || !description) return

    setSubmitting(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('slug', slug)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('idType', idType)
      formData.append('idNumber', idNumber)
      formData.append('category', category)
      formData.append('subject', subject)
      formData.append('description', description)
      files.forEach(f => formData.append('files', f))

      const res = await fetch('/api/pqrs/submit', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok && data.ok) {
        setResult({ ok: true, radicado: data.radicado })
      } else {
        setResult({ ok: false, error: data.error || 'Error al radicar' })
      }
    } catch (err: any) {
      setResult({ ok: false, error: err.message || 'Error de conexión' })
    }

    setSubmitting(false)
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const newFiles = Array.from(fileList).slice(0, 5 - files.length) // Max 5 files
    setFiles(prev => [...prev, ...newFiles])
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  if (result?.ok) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryColor + '20' }}>
            <CheckCircle size={32} style={{ color: primaryColor }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Caso radicado exitosamente</h2>
          <p className="text-gray-500 mb-4">Tu número de radicado es:</p>
          <p className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>{result.radicado}</p>
          <p className="text-sm text-gray-500">
            Guarda este número para hacer seguimiento a tu caso.
            {email && ' Recibirás una confirmación por correo electrónico.'}
          </p>
          <button onClick={() => { setResult(null); setName(''); setEmail(''); setPhone(''); setIdNumber(''); setSubject(''); setDescription(''); setFiles([]) }}
            className="mt-6 px-6 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
            Radicar otro caso
          </button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 placeholder-gray-400"

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {brandLogo && <img src={brandLogo} alt={brandName} className="h-12 mx-auto mb-3" />}
          <h1 className="text-xl font-bold text-gray-900">{formTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{formDescription}</p>
          <p className="text-xs text-gray-400 mt-1">{brandName}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          {/* Personal info */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Nombre completo *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="Tu nombre completo" className={inputClass} style={{ outlineColor: primaryColor }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Teléfono</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="3001234567" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo doc.</label>
              <select value={idType} onChange={e => setIdType(e.target.value)} className={inputClass}>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="NIT">NIT</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Número de documento</label>
              <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
                placeholder="1234567890" className={inputClass} />
            </div>
          </div>

          {/* Case info */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tipo de solicitud *</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Asunto *</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
              placeholder="Breve descripción del caso" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Descripción detallada *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} required
              rows={5} placeholder="Describe tu caso con el mayor detalle posible..."
              className={`${inputClass} resize-none`} />
          </div>

          {/* Attachments */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Adjuntos (máx. 5 archivos)</label>
            {files.length > 0 && (
              <div className="space-y-1 mb-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <Paperclip size={12} />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            {files.length < 5 && (
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-gray-700 border border-dashed border-gray-300 rounded-lg px-3 py-2">
                <Paperclip size={14} />
                <span>Agregar archivo</span>
                <input type="file" className="hidden" multiple onChange={e => addFiles(e.target.files)} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </label>
            )}
          </div>

          {result?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{result.error}</p>
          )}

          <button type="submit" disabled={submitting || !name || !subject || !description}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            style={{ backgroundColor: primaryColor }}>
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {submitting ? 'Radicando...' : 'Radicar caso'}
          </button>

          <p className="text-[10px] text-gray-400 text-center">
            Al radicar, aceptas que tus datos serán tratados según la política de privacidad.
          </p>
        </form>
      </div>
    </div>
  )
}
