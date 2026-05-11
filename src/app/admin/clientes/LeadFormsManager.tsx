'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, Copy, ExternalLink, Check, Link2, Code,
  GripVertical, ToggleLeft, ToggleRight,
} from 'lucide-react'

interface FormField {
  key: string
  label: string
  type: string
  required?: boolean
}

interface LeadForm {
  id: string
  brand_id: string
  name: string
  fields: FormField[]
  active: boolean
  created_at: string
}

const DEFAULT_FIELDS: FormField[] = [
  { key: 'name', label: 'Nombre completo', type: 'text', required: true },
  { key: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { key: 'phone', label: 'Celular / WhatsApp', type: 'tel', required: true },
]

export default function LeadFormsManager({ brandId }: { brandId: string }) {
  const supabase = createClient()
  const [forms, setForms] = useState<LeadForm[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFields, setNewFields] = useState<FormField[]>(DEFAULT_FIELDS)
  const [customFieldLabel, setCustomFieldLabel] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadForms = useCallback(async () => {
    const { data } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
    setForms((data ?? []) as LeadForm[])
    setLoading(false)
  }, [brandId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadForms() }, [loadForms])

  async function createForm() {
    if (!newName.trim()) return
    setCreating(true)
    await supabase.from('lead_forms').insert({
      brand_id: brandId,
      name: newName.trim(),
      fields: newFields,
      active: true,
    })
    setNewName('')
    setNewFields(DEFAULT_FIELDS)
    setCustomFieldLabel('')
    setShowCreate(false)
    setCreating(false)
    loadForms()
  }

  async function toggleActive(form: LeadForm) {
    await supabase.from('lead_forms').update({ active: !form.active }).eq('id', form.id)
    loadForms()
  }

  async function deleteForm(id: string) {
    if (!confirm('¿Eliminar este formulario?')) return
    await supabase.from('lead_forms').delete().eq('id', id)
    loadForms()
  }

  function addCustomField() {
    if (!customFieldLabel.trim()) return
    const key = customFieldLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (newFields.some(f => f.key === key)) return
    setNewFields([...newFields, { key, label: customFieldLabel.trim(), type: 'text', required: false }])
    setCustomFieldLabel('')
  }

  function removeField(key: string) {
    if (['name', 'email'].includes(key)) return
    setNewFields(newFields.filter(f => f.key !== key))
  }

  function getFormUrl(formId: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.turnflow.com.co'
    return `${base}/f/${formId}`
  }

  function getEmbedCode(formId: string) {
    const url = getFormUrl(formId)
    return `<iframe src="${url}" width="100%" height="500" frameborder="0" style="border:none;border-radius:16px;max-width:450px;"></iframe>`
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Formularios de captura</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Crea formularios para capturar leads desde pautas, redes sociales o tu pagina web
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> Nuevo formulario
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Crear formulario</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del formulario</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Ej: Formulario Facebook Ads"
              className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Fields preview */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campos del formulario</label>
            <div className="flex flex-col gap-2">
              {newFields.map(f => (
                <div key={f.key} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <GripVertical size={14} className="text-gray-300" />
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                  <span className="text-xs text-gray-400">{f.type}</span>
                  {f.required && <span className="text-xs text-red-400">*</span>}
                  {!['name', 'email'].includes(f.key) && (
                    <button onClick={() => removeField(f.key)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add custom field */}
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={customFieldLabel}
              onChange={e => setCustomFieldLabel(e.target.value)}
              placeholder="Agregar campo personalizado..."
              className="flex-1 h-9 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomField())}
            />
            <button
              onClick={addCustomField}
              disabled={!customFieldLabel.trim()}
              className="px-3 h-9 rounded-lg bg-gray-100 dark:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-40 transition-colors"
            >
              Agregar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createForm}
              disabled={creating || !newName.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creando...' : 'Crear formulario'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); setNewFields(DEFAULT_FIELDS) }}
              className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Forms list */}
      {forms.length === 0 && !showCreate ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 dark:text-gray-400 mb-1">No tienes formularios aun</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Crea tu primer formulario para empezar a capturar leads</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {forms.map(form => (
            <div key={form.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{form.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {form.fields.length} campos · Creado {new Date(form.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(form)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${form.active ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}
                  >
                    {form.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {form.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button onClick={() => deleteForm(form.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => copyToClipboard(getFormUrl(form.id), `link-${form.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {copied === `link-${form.id}` ? <Check size={13} className="text-green-500" /> : <Link2 size={13} />}
                  {copied === `link-${form.id}` ? 'Copiado' : 'Copiar enlace'}
                </button>
                <button
                  onClick={() => copyToClipboard(getEmbedCode(form.id), `embed-${form.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {copied === `embed-${form.id}` ? <Check size={13} className="text-green-500" /> : <Code size={13} />}
                  {copied === `embed-${form.id}` ? 'Copiado' : 'Copiar embed'}
                </button>
                <a
                  href={getFormUrl(form.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <ExternalLink size={13} /> Vista previa
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
