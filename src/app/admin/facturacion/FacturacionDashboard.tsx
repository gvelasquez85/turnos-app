'use client'

import { Receipt, FileText, Settings, FolderKey, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  brandId: string
  fiscalConfig: any | null
  recentDocs: {
    id: string
    document_type: string
    prefix: string
    consecutive: number
    customer_name: string
    total: number
    status: string
    created_at: string
  }[]
  resolution: any | null
  monthCount: number
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  generated: 'Generado',
  signed: 'Firmado',
  sent: 'Enviado a DIAN',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  voided: 'Anulado',
}

const STATUS_ICONS: Record<string, any> = {
  draft: Clock,
  generated: FileText,
  signed: FileText,
  sent: Clock,
  accepted: CheckCircle,
  rejected: XCircle,
  voided: XCircle,
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
  generated: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  signed: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  sent: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
  accepted: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  voided: 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Factura',
  credit_note: 'Nota Crédito',
  debit_note: 'Nota Débito',
}

export default function FacturacionDashboard({ brandId, fiscalConfig, recentDocs, resolution, monthCount }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
  const needsConfig = !fiscalConfig?.nit
  const needsResolution = !resolution

  const navCards = [
    { href: '/admin/facturacion/documentos', label: 'Documentos', desc: 'Facturas, notas crédito y débito', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { href: '/admin/facturacion/resoluciones', label: 'Resoluciones', desc: 'Rangos de numeración DIAN', icon: FolderKey, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { href: '/admin/facturacion/config', label: 'Configuración', desc: 'Datos fiscales y certificado', icon: Settings, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Receipt size={22} className="text-emerald-600" /> Facturación Electrónica
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Genera y transmite documentos electrónicos a la DIAN</p>
      </div>

      {/* Alerts */}
      {needsConfig && (
        <Link href="/admin/facturacion/config"
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Configura tus datos fiscales</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Ingresa tu NIT, razón social y certificado digital para comenzar a facturar</p>
          </div>
        </Link>
      )}

      {!needsConfig && needsResolution && (
        <Link href="/admin/facturacion/resoluciones"
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Registra una resolución de facturación</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Necesitas al menos una resolución DIAN activa para generar facturas</p>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Documentos este mes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{monthCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Resolución activa</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-2">
            {resolution ? `${resolution.prefix} ${resolution.current_number}/${resolution.range_to}` : 'Ninguna'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ambiente</p>
          <p className={`text-sm font-bold mt-2 ${fiscalConfig?.environment === 'production' ? 'text-green-600' : 'text-yellow-600'}`}>
            {fiscalConfig?.environment === 'production' ? 'Producción' : 'Habilitación'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">NIT</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-2">{fiscalConfig?.nit || '—'}</p>
        </div>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {navCards.map(card => (
          <Link key={card.href} href={card.href}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{card.label}</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-12">{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent documents */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Documentos recientes</p>
          <Link href="/admin/facturacion/documentos" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            Ver todos →
          </Link>
        </div>
        {recentDocs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay documentos electrónicos aún</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentDocs.map(doc => {
              const Icon = STATUS_ICONS[doc.status] ?? FileText
              return (
                <div key={doc.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${STATUS_COLORS[doc.status] ?? ''}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type} {doc.prefix}{doc.consecutive}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{doc.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{fmt(doc.total)}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status] ?? ''}`}>
                      {STATUS_LABELS[doc.status] ?? doc.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
