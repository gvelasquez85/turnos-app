'use client'

import { useState } from 'react'
import { Settings, Save, ArrowLeft, Check, Lock, Unlock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  brandId: string
  settings: any | null
  accounts: { code: string; name: string }[]
  periods: { id: string; year: number; month: number; status: string }[]
}

export default function AccountingConfig({ brandId, settings, accounts, periods }: Props) {
  const [autoSale, setAutoSale] = useState(settings?.auto_entries_on_sale ?? false)
  const [autoInvoice, setAutoInvoice] = useState(settings?.auto_entries_on_invoice ?? false)
  const [salesAccount, setSalesAccount] = useState(settings?.default_sales_account ?? '4135')
  const [costAccount, setCostAccount] = useState(settings?.default_cost_account ?? '6135')
  const [cashAccount, setCashAccount] = useState(settings?.default_cash_account ?? '110505')
  const [bankAccount, setBankAccount] = useState(settings?.default_bank_account ?? '111005')
  const [arAccount, setArAccount] = useState(settings?.default_ar_account ?? '130505')
  const [taxAccount, setTaxAccount] = useState(settings?.default_tax_account ?? '240801')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    const payload = {
      brand_id: brandId,
      auto_entries_on_sale: autoSale,
      auto_entries_on_invoice: autoInvoice,
      default_sales_account: salesAccount,
      default_cost_account: costAccount,
      default_cash_account: cashAccount,
      default_bank_account: bankAccount,
      default_ar_account: arAccount,
      default_tax_account: taxAccount,
      updated_at: new Date().toISOString(),
    }

    if (settings?.id) {
      await supabase.from('accounting_settings').update(payload).eq('id', settings.id)
    } else {
      await supabase.from('accounting_settings').insert(payload)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function togglePeriod(periodId: string, currentStatus: string) {
    const supabase = createClient()
    const newStatus = currentStatus === 'open' ? 'closed' : 'open'
    await supabase.from('accounting_periods').update({
      status: newStatus,
      closed_at: newStatus === 'closed' ? new Date().toISOString() : null,
    }).eq('id', periodId)
    window.location.reload()
  }

  function AccountSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {accounts.map(a => (
            <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/contabilidad" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" /> Configuración Contable
          </h1>
        </div>
      </div>

      {/* Auto-entries */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Automatización</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Genera asientos contables automáticamente sin intervención manual.</p>

        <label className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-contabilizar ventas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cada venta cerrada genera un asiento automáticamente</p>
          </div>
          <button
            onClick={() => setAutoSale(!autoSale)}
            className={`w-11 h-6 rounded-full transition-colors ${autoSale ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoSale ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
              style={{ transform: autoSale ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </label>

        <label className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Auto-contabilizar facturas electrónicas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cada factura validada por DIAN genera asiento</p>
          </div>
          <button
            onClick={() => setAutoInvoice(!autoInvoice)}
            className={`w-11 h-6 rounded-full transition-colors ${autoInvoice ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'} relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform`}
              style={{ transform: autoInvoice ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </label>
      </div>

      {/* Default accounts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Cuentas por defecto</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Cuentas usadas para los asientos automáticos.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AccountSelect label="Ingresos por ventas" value={salesAccount} onChange={setSalesAccount} />
          <AccountSelect label="Costo de ventas" value={costAccount} onChange={setCostAccount} />
          <AccountSelect label="Caja" value={cashAccount} onChange={setCashAccount} />
          <AccountSelect label="Bancos" value={bankAccount} onChange={setBankAccount} />
          <AccountSelect label="Cuentas por cobrar" value={arAccount} onChange={setArAccount} />
          <AccountSelect label="IVA por pagar" value={taxAccount} onChange={setTaxAccount} />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar configuración'}
      </button>

      {/* Periods management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Períodos contables</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Cierra períodos para impedir modificaciones en meses anteriores.</p>

        {periods.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No hay períodos creados aún</p>
        ) : (
          <div className="space-y-2">
            {periods.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(p.year, p.month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => togglePeriod(p.id, p.status)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${
                    p.status === 'open'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {p.status === 'open' ? <Unlock size={11} /> : <Lock size={11} />}
                  {p.status === 'open' ? 'Abierto — cerrar' : 'Cerrado — reabrir'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
