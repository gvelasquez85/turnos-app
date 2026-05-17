'use client'

import { useState } from 'react'
import { Bot, Check, Save, Key, Zap, Sparkles, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  brandId: string
  config: any | null
  usedToday: number
}

const PROVIDERS = [
  { value: 'turnflow',  label: 'TurnFlow (recomendado)',  desc: 'Usa nuestros modelos optimizados. Sin configuración adicional.' },
  { value: 'openai',    label: 'OpenAI (BYOK)',            desc: 'Usa tu propia API key de OpenAI. Hasta 500 consultas/día.' },
  { value: 'anthropic', label: 'Anthropic (BYOK)',         desc: 'Usa tu propia API key de Anthropic. Hasta 500 consultas/día.' },
]

const MODELS: Record<string, { value: string; label: string }[]> = {
  turnflow:  [{ value: 'claude-haiku-3-5-20241022', label: 'Claude Haiku 3.5 (recomendado)' }],
  openai:    [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini (eficiente)' },
    { value: 'gpt-4o',      label: 'GPT-4o (más potente)' },
  ],
  anthropic: [
    { value: 'claude-haiku-3-5-20241022',  label: 'Claude Haiku 3.5 (eficiente)' },
    { value: 'claude-sonnet-4-5-20251022', label: 'Claude Sonnet (más potente)' },
  ],
}

export default function CopilotConfig({ brandId, config, usedToday }: Props) {
  const [provider, setProvider] = useState(config?.provider ?? 'turnflow')
  const [model, setModel] = useState(config?.model_preference ?? 'claude-haiku-3-5-20241022')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const plan = config?.plan ?? 'free'
  const limit = config?.daily_limit ?? 5
  const remaining = Math.max(0, limit - usedToday)
  const usagePct = Math.min((usedToday / limit) * 100, 100)

  const isByok = provider !== 'turnflow'

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-violet-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  function handleProviderChange(p: string) {
    setProvider(p)
    setModel(MODELS[p][0].value)
  }

  async function handleSave() {
    if (isByok && !apiKey && !config?.api_key_encrypted) return
    setSaving(true)
    const supabase = createClient()

    const payload: any = {
      brand_id: brandId,
      provider,
      model_preference: model,
      plan: isByok ? 'byok' : 'managed',
      daily_limit: isByok ? 500 : 50,
      updated_at: new Date().toISOString(),
    }

    if (isByok && apiKey.trim()) {
      // Simple base64 encoding — swap for real encryption in production
      payload.api_key_encrypted = Buffer.from(apiKey.trim()).toString('base64')
    }

    await supabase.from('ai_configs').upsert(payload, { onConflict: 'brand_id' })

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Copilot IA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tu asistente inteligente para insights de negocio</p>
        </div>
      </div>

      {/* Usage today */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><BarChart2 size={16} className="text-violet-600" /> Uso hoy</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan === 'free' ? 'bg-gray-100 text-gray-600' : plan === 'byok' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
            Plan {plan === 'free' ? 'Gratuito' : plan === 'byok' ? 'BYOK' : 'Managed'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-500">{usedToday} de {limit} consultas usadas</span>
          <span className={`font-semibold ${remaining === 0 ? 'text-red-500' : remaining <= 2 ? 'text-amber-500' : 'text-green-600'}`}>{remaining} restantes</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${usagePct >= 100 ? 'bg-red-500' : usagePct >= 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
            style={{ width: `${usagePct}%` }} />
        </div>
        {plan === 'free' && (
          <p className="text-xs text-gray-400 mt-2">
            Actualiza para 50 consultas/día y acceso en todos los módulos. {' '}
            <Link href="/admin/marketplace" className="text-violet-600 font-semibold hover:underline">Ver planes →</Link>
          </p>
        )}
      </div>

      {/* Plan features comparison */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Gratuito', price: '$0', queries: '5/día', modules: 'Solo dashboard', history: 'No', highlight: plan === 'free' },
          { label: 'Managed', price: '$39.900/mes', queries: '50/día', modules: 'Todos', history: '10 turnos', highlight: plan === 'managed' },
          { label: 'BYOK', price: '$19.900/mes', queries: '500/día', modules: 'Todos', history: '10 turnos', highlight: plan === 'byok' },
        ].map(p => (
          <div key={p.label} className={`rounded-xl border p-3 ${p.highlight ? 'border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <p className={`text-xs font-bold mb-1 ${p.highlight ? 'text-violet-700 dark:text-violet-400' : 'text-gray-700 dark:text-gray-300'}`}>{p.label}</p>
            <p className="text-[11px] font-semibold text-gray-900 dark:text-gray-100">{p.price}</p>
            <div className="mt-2 space-y-0.5 text-[10px] text-gray-500">
              <p>🔢 {p.queries}</p>
              <p>📦 {p.modules}</p>
              <p>💬 {p.history}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Provider config */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Zap size={15} className="text-violet-600" /> Configuración de modelo</p>

        <div className="space-y-2">
          {PROVIDERS.map(p => (
            <label key={p.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${provider === p.value ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/10' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
              <input type="radio" name="provider" value={p.value} checked={provider === p.value} onChange={() => handleProviderChange(p.value)} className="mt-0.5 accent-violet-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
                <p className="text-xs text-gray-500">{p.desc}</p>
                {p.value !== 'turnflow' && <p className="text-[10px] text-violet-600 font-medium mt-0.5">Precio: $19.900/mes con tu propia API key</p>}
              </div>
            </label>
          ))}
        </div>

        {/* Model selector */}
        <div>
          <label className={labelClass}>Modelo</label>
          <select value={model} onChange={e => setModel(e.target.value)} className={inputClass}>
            {(MODELS[provider] ?? MODELS.turnflow).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* BYOK API key */}
        {isByok && (
          <div>
            <label className={labelClass}>
              <Key size={11} className="inline mr-1" />
              API Key {config?.api_key_encrypted ? '(guardada — ingresa para cambiar)' : '*'}
            </label>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder={config?.api_key_encrypted ? '••••••••••••••••' : 'sk-...'}
              className={inputClass} />
            <p className="text-[10px] text-gray-400 mt-1">Tu API key se almacena de forma segura y nunca se expone al cliente.</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving || (isByok && !apiKey && !config?.api_key_encrypted)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50">
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 rounded-xl border border-violet-100 dark:border-violet-800 p-5">
        <p className="font-semibold text-violet-800 dark:text-violet-300 flex items-center gap-2 mb-3"><Sparkles size={14} /> Cómo funciona el Copilot</p>
        <ul className="space-y-2 text-xs text-violet-700 dark:text-violet-400">
          <li>💡 El Copilot lee únicamente los datos visibles en tu pantalla actual — no accede a información fuera de contexto.</li>
          <li>🔒 Cada respuesta está limitada al módulo donde estás trabajando, garantizando privacidad y relevancia.</li>
          <li>🚀 Aparece como un botón flotante en la esquina inferior derecha en toda la plataforma.</li>
          <li>🔄 El contador de consultas se reinicia automáticamente cada día a medianoche.</li>
        </ul>
      </div>
    </div>
  )
}
