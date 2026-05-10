'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload, Download, FileSpreadsheet, CheckCircle,
  AlertTriangle, X, Loader2,
} from 'lucide-react'

interface BulkUploadModalProps {
  type: 'customers' | 'products'
  brandId: string
  open: boolean
  onClose: () => void
  onComplete: () => void
}

type Step = 'template' | 'upload' | 'results'

interface ImportResult {
  ok: boolean
  inserted: number
  updated: number
  errors: string[]
}

const CUSTOMER_HEADERS = ['nombre', 'telefono', 'email', 'canal_contacto', 'cumpleanos', 'intereses']
const CUSTOMER_EXAMPLES = [
  ['María García', '3001234567', 'maria@email.com', 'WhatsApp', '15/03/1990', 'Corte de cabello;Tinte'],
  ['Juan Pérez', '3109876543', '', 'Llamada', '22/11/1985', 'Manicure'],
]

const PRODUCT_HEADERS = ['nombre', 'sku', 'precio', 'stock', 'stock_minimo', 'descripcion', 'categoria']
const PRODUCT_EXAMPLES = [
  ['Shampoo Premium', 'SH-001', '25000', '50', '10', 'Shampoo para cabello seco', 'Cuidado capilar'],
  ['Esmalte Rojo', 'ES-045', '8500', '100', '20', 'Esmalte semipermanente rojo', 'Uñas'],
]

function getHeaders(type: 'customers' | 'products'): string[] {
  return type === 'customers' ? CUSTOMER_HEADERS : PRODUCT_HEADERS
}

function getExamples(type: 'customers' | 'products'): string[][] {
  return type === 'customers' ? CUSTOMER_EXAMPLES : PRODUCT_EXAMPLES
}

function buildCsvContent(type: 'customers' | 'products'): string {
  const headers = getHeaders(type)
  const examples = getExamples(type)
  const lines = [headers.join(','), ...examples.map(row => row.map(cell =>
    cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell
  ).join(','))]
  return lines.join('\n')
}

function parseCsv(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM
  let content = text.startsWith('﻿') ? text.slice(1) : text

  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const ch = content[i]
    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current)
      current = ''
      if (ch === '\r' && content[i + 1] === '\n') i++
    } else {
      current += ch
    }
  }
  if (current.trim()) lines.push(current)

  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (q && line[i + 1] === '"') { cell += '"'; i++ }
        else q = !q
      } else if (ch === ',' && !q) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += ch
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, j) => {
      if (h) row[h] = cells[j] ?? ''
    })
    // Skip completely empty rows
    if (Object.values(row).some(v => v.trim())) {
      rows.push(row)
    }
  }

  return rows
}

export function BulkUploadModal({ type, brandId, open, onClose, onComplete }: BulkUploadModalProps) {
  const [step, setStep] = useState<Step>('template')
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep('template')
    setParsedRows([])
    setFileName('')
    setImporting(false)
    setResult(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'csv') {
      alert('Por favor exporta tu archivo como CSV (.csv) antes de subirlo.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCsv(text)
      if (rows.length === 0) {
        alert('No se encontraron filas de datos en el archivo. Verifica que tenga encabezados y al menos una fila.')
        return
      }
      setParsedRows(rows)
      setStep('upload')
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = useCallback(async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, rows: parsedRows }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
      setStep('results')
      if (data.ok || data.inserted > 0 || data.updated > 0) {
        onComplete()
      }
    } catch (err) {
      setResult({ ok: false, inserted: 0, updated: 0, errors: ['Error de conexión al servidor'] })
      setStep('results')
    } finally {
      setImporting(false)
    }
  }, [type, parsedRows, onComplete])

  if (!open) return null

  const headers = getHeaders(type)
  const previewRows = parsedRows.slice(0, 5)
  const previewHeaders = parsedRows.length > 0 ? Object.keys(parsedRows[0]) : []
  const typeLabel = type === 'customers' ? 'clientes' : 'productos'

  const csvContent = buildCsvContent(type)
  const csvBlob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
  const csvUrl = URL.createObjectURL(csvBlob)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Carga masiva de {typeLabel}</h2>
              <p className="text-xs text-gray-400">
                {step === 'template' && 'Paso 1: Descarga la plantilla'}
                {step === 'upload' && 'Paso 2: Revisa y confirma'}
                {step === 'results' && 'Paso 3: Resultados'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1: Template */}
          {step === 'template' && (
            <div className="space-y-6">
              {/* Download template */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-indigo-900 mb-1">1. Descarga la plantilla CSV</p>
                <p className="text-xs text-indigo-700 mb-4">
                  Usa esta plantilla con los encabezados correctos. Incluye 2 filas de ejemplo que puedes borrar.
                </p>
                <a
                  href={csvUrl}
                  download={`plantilla_${type}.csv`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Download size={15} />
                  Descargar plantilla
                </a>
                <div className="mt-4">
                  <p className="text-xs font-medium text-indigo-800 mb-1.5">Columnas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {headers.map(h => (
                      <span key={h} className="text-[11px] px-2 py-0.5 bg-white rounded-full text-indigo-700 font-mono border border-indigo-200">{h}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload area */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-3">2. Sube tu archivo CSV</p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Upload size={32} className={`mx-auto mb-3 ${dragOver ? 'text-indigo-400' : 'text-gray-300'}`} />
                  <p className="text-sm font-medium text-gray-700">
                    Arrastra tu archivo CSV aqui o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Solo archivos .csv - Si tienes .xlsx, exporta como CSV primero
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Vista previa: {fileName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {parsedRows.length} fila{parsedRows.length !== 1 ? 's' : ''} encontrada{parsedRows.length !== 1 ? 's' : ''}
                    {parsedRows.length > 5 && ` (mostrando primeras 5)`}
                  </p>
                </div>
                <button
                  onClick={() => { setParsedRows([]); setFileName(''); setStep('template') }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Cambiar archivo
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">#</th>
                        {previewHeaders.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {previewRows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          {previewHeaders.map(h => (
                            <td key={h} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{row[h] || <span className="text-gray-300">-</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {importing
                    ? <><Loader2 size={15} className="animate-spin" /> Importando...</>
                    : <><Upload size={15} /> Importar {parsedRows.length} {typeLabel}</>
                  }
                </button>
                <button
                  onClick={() => { setParsedRows([]); setFileName(''); setStep('template') }}
                  disabled={importing}
                  className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && result && (
            <div className="space-y-5">
              {/* Summary */}
              <div className={`rounded-xl p-5 border ${
                result.errors.length === 0
                  ? 'bg-green-50 border-green-100'
                  : 'bg-amber-50 border-amber-100'
              }`}>
                <div className="flex items-center gap-2.5 mb-3">
                  {result.errors.length === 0
                    ? <CheckCircle size={22} className="text-green-600" />
                    : <AlertTriangle size={22} className="text-amber-600" />
                  }
                  <p className={`text-sm font-bold ${result.errors.length === 0 ? 'text-green-900' : 'text-amber-900'}`}>
                    {result.errors.length === 0 ? 'Importacion completada' : 'Importacion completada con errores'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-2xl font-bold text-green-700">{result.inserted}</p>
                    <p className="text-xs text-green-600">Nuevos {typeLabel}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{result.updated}</p>
                    <p className="text-xs text-blue-600">Actualizados</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-2">
                    Errores ({result.errors.length}):
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-700">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={reset}
                  className="px-5 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cargar otro archivo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
