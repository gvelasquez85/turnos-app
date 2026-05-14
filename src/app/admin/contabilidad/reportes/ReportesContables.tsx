'use client'

import { useState, Fragment } from 'react'
import { ArrowLeft, FileSpreadsheet, TrendingUp, BookOpen, Scale, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  brandId: string
}

type ReportType = 'balance_general' | 'estado_resultados' | 'libro_mayor' | 'balance_comprobacion'

interface AccountBalance {
  code: string
  name: string
  nature: string
  class: number
  debit: number
  credit: number
  balance: number
}

const REPORTS: { key: ReportType; label: string; icon: any; description: string }[] = [
  { key: 'balance_general', label: 'Balance General', icon: Scale, description: 'Activos, pasivos y patrimonio a una fecha' },
  { key: 'estado_resultados', label: 'Estado de Resultados', icon: TrendingUp, description: 'Ingresos, costos y gastos del período' },
  { key: 'libro_mayor', label: 'Libro Mayor', icon: BookOpen, description: 'Movimientos por cuenta con saldos' },
  { key: 'balance_comprobacion', label: 'Balance de Comprobación', icon: FileSpreadsheet, description: 'Sumas y saldos de todas las cuentas' },
]

export default function ReportesContables({ brandId }: Props) {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AccountBalance[]>([])
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  async function loadReport(type: ReportType) {
    setActiveReport(type)
    setLoading(true)
    setData([])

    const supabase = createClient()

    // Get all posted journal entry lines within date range
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select(`
        account_code,
        debit,
        credit,
        journal_entries!inner(entry_date, status, brand_id)
      `)
      .eq('brand_id', brandId)
      .eq('journal_entries.status', 'posted')
      .gte('journal_entries.entry_date', dateFrom)
      .lte('journal_entries.entry_date', dateTo)

    // Get accounts
    const { data: accounts } = await supabase
      .from('accounts')
      .select('code, name, nature, class')
      .eq('brand_id', brandId)
      .eq('is_active', true)
      .order('code')

    if (!accounts || !lines) {
      setLoading(false)
      return
    }

    // Aggregate by account
    const map = new Map<string, { debit: number; credit: number }>()
    for (const line of lines as any[]) {
      const existing = map.get(line.account_code) || { debit: 0, credit: 0 }
      existing.debit += line.debit || 0
      existing.credit += line.credit || 0
      map.set(line.account_code, existing)
    }

    // Build balances
    const balances: AccountBalance[] = accounts
      .filter(a => {
        const entry = map.get(a.code)
        if (!entry) return false
        // Filter by report type
        if (type === 'balance_general') return [1, 2, 3].includes(a.class)
        if (type === 'estado_resultados') return [4, 5, 6].includes(a.class)
        return true // libro_mayor and balance_comprobacion show all
      })
      .map(a => {
        const entry = map.get(a.code) || { debit: 0, credit: 0 }
        const balance = a.nature === 'debit'
          ? entry.debit - entry.credit
          : entry.credit - entry.debit
        return { ...a, ...entry, balance }
      })
      .filter(a => a.debit > 0 || a.credit > 0)

    setData(balances)
    setLoading(false)
  }

  function getClassLabel(cls: number): string {
    const labels: Record<number, string> = {
      1: 'Activos', 2: 'Pasivos', 3: 'Patrimonio',
      4: 'Ingresos', 5: 'Gastos', 6: 'Costos',
    }
    return labels[cls] || `Clase ${cls}`
  }

  function renderBalanceGeneral() {
    const activos = data.filter(d => d.class === 1)
    const pasivos = data.filter(d => d.class === 2)
    const patrimonio = data.filter(d => d.class === 3)

    const totalActivos = activos.reduce((s, a) => s + a.balance, 0)
    const totalPasivos = pasivos.reduce((s, a) => s + a.balance, 0)
    const totalPatrimonio = patrimonio.reduce((s, a) => s + a.balance, 0)

    return (
      <div className="space-y-6">
        <ReportSection title="Activos" items={activos} total={totalActivos} color="text-blue-600" />
        <ReportSection title="Pasivos" items={pasivos} total={totalPasivos} color="text-red-600" />
        <ReportSection title="Patrimonio" items={patrimonio} total={totalPatrimonio} color="text-purple-600" />

        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Pasivo + Patrimonio</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{fmt(totalPasivos + totalPatrimonio)}</span>
        </div>
        {Math.abs(totalActivos - (totalPasivos + totalPatrimonio)) > 1 && (
          <p className="text-xs text-red-500 font-medium">⚠ Diferencia: {fmt(totalActivos - totalPasivos - totalPatrimonio)}</p>
        )}
      </div>
    )
  }

  function renderEstadoResultados() {
    const ingresos = data.filter(d => d.class === 4)
    const gastos = data.filter(d => d.class === 5)
    const costos = data.filter(d => d.class === 6)

    const totalIngresos = ingresos.reduce((s, a) => s + a.balance, 0)
    const totalGastos = gastos.reduce((s, a) => s + a.balance, 0)
    const totalCostos = costos.reduce((s, a) => s + a.balance, 0)
    const utilidad = totalIngresos - totalGastos - totalCostos

    return (
      <div className="space-y-6">
        <ReportSection title="Ingresos" items={ingresos} total={totalIngresos} color="text-green-600" />
        <ReportSection title="Costos" items={costos} total={totalCostos} color="text-orange-600" />
        <ReportSection title="Gastos" items={gastos} total={totalGastos} color="text-red-600" />

        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {utilidad >= 0 ? 'Utilidad del período' : 'Pérdida del período'}
          </span>
          <span className={`text-sm font-bold ${utilidad >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(utilidad)}</span>
        </div>
      </div>
    )
  }

  function renderTable() {
    // Group by class
    const grouped = data.reduce((acc, item) => {
      const cls = item.class
      if (!acc[cls]) acc[cls] = []
      acc[cls].push(item)
      return acc
    }, {} as Record<number, AccountBalance[]>)

    const totalDebit = data.reduce((s, d) => s + d.debit, 0)
    const totalCredit = data.reduce((s, d) => s + d.credit, 0)

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Débitos</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Créditos</th>
                <th className="text-right py-2 px-2 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(grouped).sort().map(cls => (
                <Fragment key={cls}>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td colSpan={4} className="py-2 px-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                      {getClassLabel(Number(cls))}
                    </td>
                  </tr>
                  {grouped[Number(cls)].map(row => (
                    <tr key={row.code} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-1.5 px-2">
                        <span className="text-gray-400 text-xs mr-2">{row.code}</span>
                        <span className="text-gray-900 dark:text-gray-100">{row.name}</span>
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{row.debit > 0 ? fmt(row.debit) : ''}</td>
                      <td className="py-1.5 px-2 text-right text-gray-700 dark:text-gray-300">{row.credit > 0 ? fmt(row.credit) : ''}</td>
                      <td className={`py-1.5 px-2 text-right font-medium ${row.balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600'}`}>
                        {fmt(row.balance)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                <td className="py-2 px-2 text-gray-900 dark:text-gray-100">Totales</td>
                <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">{fmt(totalDebit)}</td>
                <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">{fmt(totalCredit)}</td>
                <td className="py-2 px-2 text-right text-gray-900 dark:text-gray-100">{fmt(totalDebit - totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    )
  }

  function ReportSection({ title, items, total, color }: { title: string; items: AccountBalance[]; total: number; color: string }) {
    return (
      <div>
        <p className={`text-sm font-bold ${color} mb-2`}>{title}</p>
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 pl-2">Sin movimientos</p>
        ) : (
          <div className="space-y-1 pl-2">
            {items.map(item => (
              <div key={item.code} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-400 text-xs mr-1.5">{item.code}</span>{item.name}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{fmt(item.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Total {title}</span>
              <span className={`font-bold ${color}`}>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/contabilidad" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-indigo-600" /> Reportes Contables
          </h1>
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          </div>
          {activeReport && (
            <button onClick={() => loadReport(activeReport)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
              <Calendar size={14} className="inline mr-1.5" />Actualizar
            </button>
          )}
        </div>
      </div>

      {/* Report selector */}
      {!activeReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORTS.map(r => (
            <button
              key={r.key}
              onClick={() => loadReport(r.key)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                  <r.icon size={18} className="text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.label}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pl-12">{r.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Report content */}
      {activeReport && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {REPORTS.find(r => r.key === activeReport)?.label}
            </p>
            <button onClick={() => setActiveReport(null)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              ← Todos los reportes
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400 mt-2">Generando reporte...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay movimientos en el período seleccionado</p>
            </div>
          ) : (
            <>
              {activeReport === 'balance_general' && renderBalanceGeneral()}
              {activeReport === 'estado_resultados' && renderEstadoResultados()}
              {(activeReport === 'libro_mayor' || activeReport === 'balance_comprobacion') && renderTable()}
            </>
          )}
        </div>
      )}
    </div>
  )
}

