'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Plus, Search, TreePine, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Account {
  id: string
  code: string
  parent_code: string | null
  name: string
  class: number
  nature: string
  level: number
  is_active: boolean
  is_system: boolean
  allows_movement: boolean
}

interface Props {
  accounts: Account[]
  brandId: string
}

const CLASS_LABELS: Record<number, string> = {
  1: 'Activos',
  2: 'Pasivos',
  3: 'Patrimonio',
  4: 'Ingresos',
  5: 'Gastos',
  6: 'Costos de ventas',
}

const CLASS_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  2: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  3: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  5: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  6: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
}

export default function PucManager({ accounts: initialAccounts, brandId }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5', '6']))
  const [adding, setAdding] = useState<string | null>(null) // parent_code
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts
    const q = search.toLowerCase()
    return accounts.filter(a =>
      a.code.includes(q) || a.name.toLowerCase().includes(q)
    )
  }, [accounts, search])

  // Build tree structure
  const children = useMemo(() => {
    const map: Record<string, Account[]> = {}
    for (const a of filtered) {
      const parent = a.parent_code ?? '__root__'
      if (!map[parent]) map[parent] = []
      map[parent].push(a)
    }
    return map
  }, [filtered])

  function toggle(code: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  async function handleAdd() {
    if (!adding || !newCode.trim() || !newName.trim()) return
    setSaving(true)

    const parent = accounts.find(a => a.code === adding)
    const supabase = createClient()
    const { data, error } = await supabase.from('accounts').insert({
      brand_id: brandId,
      code: newCode.trim(),
      parent_code: adding,
      name: newName.trim(),
      class: parent?.class ?? (parseInt(newCode[0]) || 1),
      nature: parent?.nature ?? 'debit',
      level: (parent?.level ?? 0) + 1,
      is_system: false,
      allows_movement: true,
    }).select().single()

    if (data) {
      setAccounts(prev => [...prev, data as Account].sort((a, b) => a.code.localeCompare(b.code)))
      setExpanded(prev => new Set([...prev, adding]))
    }
    setAdding(null)
    setNewCode('')
    setNewName('')
    setSaving(false)
  }

  function renderAccount(account: Account, depth: number = 0) {
    const hasChildren = children[account.code]?.length > 0
    const isExpanded = expanded.has(account.code)

    return (
      <div key={account.code}>
        <div
          className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 ${
            !account.is_active ? 'opacity-40' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          {/* Expand/collapse */}
          <button
            onClick={() => toggle(account.code)}
            className="w-5 h-5 flex items-center justify-center shrink-0"
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
            ) : <span className="w-3.5 h-0.5 bg-gray-200 dark:bg-gray-600 rounded" />}
          </button>

          {/* Code */}
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-16 shrink-0">{account.code}</span>

          {/* Name */}
          <span className={`text-sm flex-1 ${account.level <= 2 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
            {account.name}
          </span>

          {/* Nature badge */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            account.nature === 'debit' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {account.nature === 'debit' ? 'DB' : 'CR'}
          </span>

          {/* Movement indicator */}
          {account.allows_movement && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Permite movimiento" />
          )}

          {/* Add child */}
          {!account.allows_movement && (
            <button
              onClick={() => { setAdding(account.code); setNewCode(account.code); }}
              className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-400 hover:text-emerald-600"
              title="Agregar subcuenta"
            >
              <Plus size={12} />
            </button>
          )}
        </div>

        {/* Add form */}
        {adding === account.code && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800" style={{ paddingLeft: `${36 + depth * 20}px` }}>
            <input
              type="text"
              placeholder="Código"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              className="w-24 text-xs font-mono border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <input
              type="text"
              placeholder="Nombre de la cuenta"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button onClick={handleAdd} disabled={saving} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {saving ? '...' : 'Agregar'}
            </button>
            <button onClick={() => setAdding(null)} className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              Cancelar
            </button>
          </div>
        )}

        {/* Children */}
        {isExpanded && children[account.code]?.map(child => renderAccount(child, depth + 1))}
      </div>
    )
  }

  const rootAccounts = filtered.filter(a => a.level === 1).sort((a, b) => a.code.localeCompare(b.code))

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
              <TreePine size={20} className="text-emerald-600" /> Plan Único de Cuentas
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{accounts.length} cuentas registradas</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        />
      </div>

      {/* Class summary */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map(cls => (
          <button
            key={cls}
            onClick={() => toggle(String(cls))}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${CLASS_COLORS[cls]}`}
          >
            {cls}. {CLASS_LABELS[cls]}
          </button>
        ))}
      </div>

      {/* Tree */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {rootAccounts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TreePine size={32} className="mx-auto mb-2 opacity-30" />
            <p>No hay cuentas registradas</p>
          </div>
        ) : (
          rootAccounts.map(a => renderAccount(a, 0))
        )}
      </div>
    </div>
  )
}
