'use client'

import { useState, useMemo } from 'react'
import { Plus, BookOpen, ArrowLeft, Check, X, Trash2, FileText, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Account { code: string; name: string; nature: string; class: number }
interface Period { id: string; year: number; month: number; status: string }
interface Entry { id: string; entry_date: string; description: string; status: string; source_type: string | null; created_at: string }
interface Line { account_code: string; debit: number; credit: number; description: string }

interface Props {
  brandId: string
  entries: Entry[]
  accounts: Account[]
  periods: Period[]
}

const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', posted: 'Contabilizado', voided: 'Anulado' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  posted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  voided: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
}

export default function AsientosManager({ brandId, entries: initialEntries, accounts, periods }: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  // New entry form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<Line[]>([
    { account_code: '', debit: 0, credit: 0, description: '' },
    { account_code: '', debit: 0, credit: 0, description: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e => e.description.toLowerCase().includes(q) || e.entry_date.includes(q))
  }, [entries, search])

  function addLine() {
    setLines(prev => [...prev, { account_code: '', debit: 0, credit: 0, description: '' }])
  }

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
  }

  function removeLine(idx: number) {
    if (lines.length <= 2) return
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave(andPost: boolean) {
    if (!description.trim()) { setError('Agrega una descripción'); return }
    if (!isBalanced) { setError('El asiento no está balanceado'); return }
    if (lines.some(l => !l.account_code)) { setError('Todas las líneas deben tener cuenta'); return }
    if (!periods.length) { setError('No hay período contable abierto'); return }

    setSaving(true)
    setError('')

    const supabase = createClient()
    const period = periods[0]

    // Create journal entry
    const { data: entry, error: entryErr } = await supabase.from('journal_entries').insert({
      brand_id: brandId,
      period_id: period.id,
      entry_date: date,
      description: description.trim(),
      source_type: 'manual',
      status: andPost ? 'posted' : 'draft',
      posted_at: andPost ? new Date().toISOString() : null,
    }).select().single()

    if (entryErr || !entry) {
      setError(entryErr?.message || 'Error al crear asiento')
      setSaving(false)
      return
    }

    // Insert lines
    const lineInserts = lines
      .filter(l => l.account_code && (l.debit > 0 || l.credit > 0))
      .map(l => ({
        journal_entry_id: entry.id,
        brand_id: brandId,
        account_code: l.account_code,
        debit: l.debit,
        credit: l.credit,
        description: l.description || null,
      }))

    const { error: linesErr } = await supabase.from('journal_entry_lines').insert(lineInserts)
    if (linesErr) {
      setError(linesErr.message)
      // Cleanup the entry
      await supabase.from('journal_entries').delete().eq('id', entry.id)
      setSaving(false)
      return
    }

    // Success
    setEntries(prev => [{ ...entry, source_type: 'manual' } as Entry, ...prev])
    setCreating(false)
    setDescription('')
    setLines([
      { account_code: '', debit: 0, credit: 0, description: '' },
      { account_code: '', debit: 0, credit: 0, description: '' },
    ])
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/contabilidad" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" /> Asientos Contables
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{entries.length} registros</p>
          </div>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700"
          >
            <Plus size={15} /> Nuevo asiento
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nuevo asiento contable</p>
            <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Descripción</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Venta de mercancía"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
              <span>Cuenta</span>
              <span className="text-right">Débito</span>
              <span className="text-right">Crédito</span>
              <span></span>
            </div>
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                <select
                  value={line.account_code}
                  onChange={e => updateLine(idx, { account_code: e.target.value })}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="">Seleccionar...</option>
                  {accounts.map(a => (
                    <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={line.debit || ''}
                  onChange={e => updateLine(idx, { debit: parseFloat(e.target.value) || 0, credit: 0 })}
                  placeholder="0"
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={line.credit || ''}
                  onChange={e => updateLine(idx, { credit: parseFloat(e.target.value) || 0, debit: 0 })}
                  placeholder="0"
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-sm text-right bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <button onClick={() => removeLine(idx)} className="p-1.5 text-gray-300 hover:text-red-500" disabled={lines.length <= 2}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button onClick={addLine} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mt-1">
              <Plus size={12} /> Agregar línea
            </button>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center border-t dark:border-gray-700 pt-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Totales</span>
            <span className={`text-sm font-bold text-right ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(totalDebit)}</span>
            <span className={`text-sm font-bold text-right ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(totalCredit)}</span>
            <span></span>
          </div>

          {!isBalanced && totalDebit > 0 && (
            <p className="text-xs text-red-500">Diferencia: {fmt(Math.abs(totalDebit - totalCredit))}</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !isBalanced}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
            >
              Guardar borrador
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !isBalanced}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-40"
            >
              <Check size={14} /> Contabilizar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      {!creating && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar asientos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}

      {/* Entries list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay asientos contables registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(entry.entry_date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {entry.source_type && entry.source_type !== 'manual' && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-medium">
                          {entry.source_type}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[entry.status] ?? ''}`}>
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
