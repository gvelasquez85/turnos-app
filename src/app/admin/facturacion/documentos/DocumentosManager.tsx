'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, FileText, Search, CheckCircle, Clock, XCircle, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Document {
  id: string
  document_type: string
  prefix: string
  consecutive: number
  customer_name: string
  customer_id_number: string
  subtotal: number
  tax_total: number
  total: number
  status: string
  cufe: string | null
  created_at: string
}

interface Props {
  brandId: string
  documents: Document[]
  hasConfig: boolean
  environment: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', generated: 'Generado', signed: 'Firmado',
  sent: 'Enviado', accepted: 'Aceptado', rejected: 'Rechazado', voided: 'Anulado',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  generated: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  signed: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  sent: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  accepted: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  voided: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}
const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: 'Factura', credit_note: 'Nota Crédito', debit_note: 'Nota Débito',
}

export default function DocumentosManager({ brandId, documents, hasConfig, environment }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  const filtered = useMemo(() => {
    let result = documents
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.customer_name.toLowerCase().includes(q) ||
        `${d.prefix}${d.consecutive}`.toLowerCase().includes(q) ||
        d.customer_id_number.includes(q)
      )
    }
    if (filterStatus !== 'all') result = result.filter(d => d.status === filterStatus)
    if (filterType !== 'all') result = result.filter(d => d.document_type === filterType)
    return result
  }, [documents, search, filterStatus, filterType])

  function copyCufe(cufe: string, docId: string) {
    navigator.clipboard.writeText(cufe)
    setCopiedId(docId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const dianValidationUrl = (cufe: string) => {
    const base = environment === 'production'
      ? 'https://catalogo-vpfe.dian.gov.co/document/searchqr'
      : 'https://catalogo-vpfe-hab.dian.gov.co/document/searchqr'
    return `${base}?documentkey=${cufe}`
  }

  const totalAccepted = documents.filter(d => d.status === 'accepted').reduce((s, d) => s + d.total, 0)
  const countByStatus = (s: string) => documents.filter(d => d.status === s).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/facturacion" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> Documentos Electrónicos
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{documents.length} documentos</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-lg font-bold text-green-600">{countByStatus('accepted')}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Aceptados</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-lg font-bold text-yellow-600">{countByStatus('sent') + countByStatus('draft')}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Pendientes</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(totalAccepted)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Facturado</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Buscar por cliente, número..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Todos los tipos</option>
          {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Documents list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay documentos electrónicos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(doc => (
              <div key={doc.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${STATUS_COLORS[doc.status] ?? ''}`}>
                      {doc.status === 'accepted' ? <CheckCircle size={14} /> :
                       doc.status === 'rejected' || doc.status === 'voided' ? <XCircle size={14} /> :
                       <Clock size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type} {doc.prefix}{doc.consecutive}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[doc.status] ?? ''}`}>
                          {STATUS_LABELS[doc.status] ?? doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {doc.customer_name} · {doc.customer_id_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fmt(doc.total)}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(doc.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* CUFE row */}
                {doc.cufe && (
                  <div className="mt-2 flex items-center gap-2 pl-11">
                    <p className="text-[10px] text-gray-400 font-mono truncate flex-1">{doc.cufe}</p>
                    <button onClick={() => copyCufe(doc.cufe!, doc.id)}
                      className="text-gray-400 hover:text-gray-600 shrink-0" title="Copiar CUFE">
                      {copiedId === doc.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <a href={dianValidationUrl(doc.cufe)} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 shrink-0" title="Validar en DIAN">
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
