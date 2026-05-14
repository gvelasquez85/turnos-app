'use client'

import { useState } from 'react'
import { Calculator, BookOpen, FileText, Settings, TreePine, BarChart3, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props {
  brandId: string
  currentPeriod: any | null
  recentEntries: any[]
  settings: any | null
  hasPuc: boolean
}

export default function ContabilidadDashboard({ brandId, currentPeriod, recentEntries, settings, hasPuc }: Props) {
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(hasPuc)

  async function seedPuc() {
    setSeeding(true)
    const res = await fetch('/api/accounting/seed-puc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId }),
    })
    if (res.ok) setSeeded(true)
    setSeeding(false)
  }

  async function createCurrentPeriod() {
    const supabase = createClient()
    const now = new Date()
    await supabase.from('accounting_periods').insert({
      brand_id: brandId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      status: 'open',
    })
    window.location.reload()
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    posted: 'bg-green-100 text-green-700',
    voided: 'bg-red-100 text-red-600',
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador',
    posted: 'Contabilizado',
    voided: 'Anulado',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Contabilidad</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sistema contable NIIF — Plan Único de Cuentas</p>
        </div>
      </div>

      {/* Setup alert if no PUC */}
      {!seeded && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">Configuración inicial requerida</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Necesitas cargar el Plan Único de Cuentas (PUC) estándar para comenzar a usar el módulo contable.
              </p>
              <button
                onClick={seedPuc}
                disabled={seeding}
                className="mt-3 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {seeding ? 'Cargando PUC...' : 'Cargar PUC estándar colombiano'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period alert */}
      {seeded && !currentPeriod && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-800 dark:text-blue-200">No hay período contable abierto</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Crea el período del mes actual para poder registrar asientos contables.
              </p>
              <button
                onClick={createCurrentPeriod}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Crear período {new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/contabilidad/puc" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
            <TreePine size={20} className="text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Plan de Cuentas</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">PUC jerárquico</p>
        </Link>

        <Link href="/admin/contabilidad/asientos" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Asientos Contables</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Partida doble</p>
        </Link>

        <Link href="/admin/contabilidad/reportes" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
            <BarChart3 size={20} className="text-purple-600" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Reportes</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Balance, P&L, Mayor</p>
        </Link>

        <Link href="/admin/contabilidad/config" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors group">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-3 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
            <Settings size={20} className="text-gray-600 dark:text-gray-300" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Configuración</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Impuestos, auto-asientos</p>
        </Link>
      </div>

      {/* Current period info */}
      {currentPeriod && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Calculator size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Período: {new Date(currentPeriod.year, currentPeriod.month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  Estado: {currentPeriod.status === 'open' ? 'Abierto' : currentPeriod.status === 'closed' ? 'Cerrado' : 'Bloqueado'}
                </p>
              </div>
            </div>
            {settings?.auto_entries_on_sale && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                Auto-asientos activos
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Últimos asientos</p>
            <Link href="/admin/contabilidad/asientos" className="text-xs text-emerald-600 hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentEntries.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{entry.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(entry.entry_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      {entry.source_type && <span className="ml-2 text-gray-300">· {entry.source_type}</span>}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[entry.status] ?? ''}`}>
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
