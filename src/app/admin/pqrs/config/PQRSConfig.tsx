'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Check, Settings, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props { brandId: string; config: any | null }

export default function PQRSConfig({ brandId, config }: Props) {
  const [formSlug, setFormSlug] = useState(config?.form_slug ?? '')
  const [formTitle, setFormTitle] = useState(config?.form_title ?? 'Radicar PQRS')
  const [formDescription, setFormDescription] = useState(config?.form_description ?? 'Registra tu petición, queja, reclamo o sugerencia')
  const [formEnabled, setFormEnabled] = useState(config?.form_enabled ?? true)
  const [categories, setCategories] = useState<string[]>(config?.categories ?? ['Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Felicitación'])
  const [newCat, setNewCat] = useState('')
  const [slaPeticion, setSlaPeticion] = useState(config?.sla_peticion_days ?? 15)
  const [slaQueja, setSlaQueja] = useState(config?.sla_queja_days ?? 15)
  const [slaReclamo, setSlaReclamo] = useState(config?.sla_reclamo_days ?? 15)
  const [slaSugerencia, setSlaSugerencia] = useState(config?.sla_sugerencia_days ?? 30)
  const [notifyEmail, setNotifyEmail] = useState(config?.notify_email ?? '')
  const [autoReply, setAutoReply] = useState(config?.auto_reply_enabled ?? true)
  const [primaryColor, setPrimaryColor] = useState(config?.primary_color ?? '#059669')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  function addCategory() {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories(prev => [...prev, newCat.trim()])
      setNewCat('')
    }
  }

  async function handleSave() {
    if (!formSlug.trim()) return
    setSaving(true); setSaved(false)
    const supabase = createClient()
    const payload = {
      brand_id: brandId, form_slug: formSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      form_title: formTitle, form_description: formDescription, form_enabled: formEnabled,
      categories, sla_peticion_days: slaPeticion, sla_queja_days: slaQueja,
      sla_reclamo_days: slaReclamo, sla_sugerencia_days: slaSugerencia,
      notify_email: notifyEmail || null, auto_reply_enabled: autoReply,
      primary_color: primaryColor, updated_at: new Date().toISOString(),
    }
    if (config?.id) {
      await supabase.from('pqrs_configs').update(payload).eq('id', config.id)
    } else {
      await supabase.from('pqrs_configs').insert(payload)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/pqrs" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Settings size={20} className="text-gray-600" /> Configuración PQRS</h1>
      </div>

      {/* Form settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Formulario público</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Slug (URL pública)</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">/pqrs/</span>
              <input type="text" value={formSlug} onChange={e => setFormSlug(e.target.value)} placeholder="mi-empresa" className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Color principal</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
              <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Título del formulario</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Descripción</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={formEnabled} onChange={e => setFormEnabled(e.target.checked)} className="rounded border-gray-300 text-orange-600" />
            Formulario habilitado
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Categorías</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg">
              {c}
              <button onClick={() => setCategories(prev => prev.filter(x => x !== c))} className="text-gray-400 hover:text-red-500"><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="Nueva categoría" className={inputClass} />
          <button onClick={addCategory} className="px-3 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700"><Plus size={14} /></button>
        </div>
      </div>

      {/* SLA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Tiempos de respuesta (SLA en días)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className={labelClass}>Petición</label><input type="number" value={slaPeticion} onChange={e => setSlaPeticion(Number(e.target.value))} className={inputClass} min={1} /></div>
          <div><label className={labelClass}>Queja</label><input type="number" value={slaQueja} onChange={e => setSlaQueja(Number(e.target.value))} className={inputClass} min={1} /></div>
          <div><label className={labelClass}>Reclamo</label><input type="number" value={slaReclamo} onChange={e => setSlaReclamo(Number(e.target.value))} className={inputClass} min={1} /></div>
          <div><label className={labelClass}>Sugerencia</label><input type="number" value={slaSugerencia} onChange={e => setSlaSugerencia(Number(e.target.value))} className={inputClass} min={1} /></div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</p>
        <div>
          <label className={labelClass}>Email para notificaciones internas</label>
          <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="pqrs@miempresa.com" className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input type="checkbox" checked={autoReply} onChange={e => setAutoReply(e.target.checked)} className="rounded border-gray-300 text-orange-600" />
          Enviar confirmación automática al solicitante
        </label>
      </div>

      <button onClick={handleSave} disabled={saving || !formSlug.trim()}
        className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 disabled:opacity-50">
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar configuración'}
      </button>
    </div>
  )
}
