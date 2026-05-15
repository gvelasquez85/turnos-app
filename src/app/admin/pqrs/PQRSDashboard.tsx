'use client'

import { useState, useMemo } from 'react'
import { MessageSquareWarning, Search, Plus, Settings, ExternalLink, Clock, CheckCircle, AlertTriangle, XCircle, Filter, Eye, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface PQRSCase {
  id: string; radicado: string; requester_name: string; category: string
  subject: string; status: string; priority: string; sla_due_date: string | null
  sla_breached: boolean; assigned_to: string | null; created_at: string
}

interface Props {
  brandId: string
  config: any | null
  cases: PQRSCase[]
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Abierto', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  in_progress: { label: 'En gestión', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
  waiting_response: { label: 'Esperando respuesta', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: Clock },
  resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400', normal: 'text-blue-500', high: 'text-orange-500', urgent: 'text-red-500',
}

const CAT_COLORS: Record<string, string> = {
  'Petición': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  'Queja': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  'Reclamo': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  'Sugerencia': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  'Felicitación': 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
}

export default function PQRSDashboard({ brandId, config, cases: initialCases }: Props) {
  const [cases, setCases] = useState(initialCases)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [caseDetail, setCaseDetail] = useState<any>(null)
  const [caseNotes, setCaseNotes] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [noteInternal, setNoteInternal] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const needsConfig = !config?.form_slug
  const formUrl = config?.form_slug ? `/pqrs/${config.form_slug}` : null

  const openCount = cases.filter(c => c.status === 'open').length
  const inProgressCount = cases.filter(c => c.status === 'in_progress').length
  const breachedCount = cases.filter(c => c.sla_breached).length

  const filtered = useMemo(() => {
    let result = cases
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c => c.radicado.toLowerCase().includes(q) || c.requester_name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
    }
    if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus)
    if (filterCategory !== 'all') result = result.filter(c => c.category === filterCategory)
    return result
  }, [cases, search, filterStatus, filterCategory])

  async function openCase(caseId: string) {
    setSelectedCase(caseId)
    setLoadingDetail(true)
    const supabase = createClient()
    const [caseRes, notesRes] = await Promise.all([
      supabase.from('pqrs_cases').select('*').eq('id', caseId).single(),
      supabase.from('pqrs_notes').select('*').eq('case_id', caseId).order('created_at', { ascending: true }),
    ])
    setCaseDetail(caseRes.data)
    setCaseNotes(notesRes.data ?? [])
    setLoadingDetail(false)
  }

  async function addNote() {
    if (!newNote.trim() || !selectedCase) return
    setSavingNote(true)
    const supabase = createClient()
    const { data } = await supabase.from('pqrs_notes').insert({
      case_id: selectedCase,
      brand_id: brandId,
      content: newNote.trim(),
      is_internal: noteInternal,
      notify_requester: !noteInternal,
    }).select().single()

    if (data) {
      setCaseNotes(prev => [...prev, data])
      setNewNote('')

      // If notifying requester, send email
      if (!noteInternal && caseDetail?.requester_email) {
        fetch('/api/pqrs/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'update',
            to: caseDetail.requester_email,
            subject: `Actualización de su caso ${caseDetail.radicado}`,
            body: `Estimado/a ${caseDetail.requester_name},\n\nSe ha registrado una actualización en su caso ${caseDetail.radicado}:\n\n${newNote.trim()}\n\nGracias por su paciencia.`,
            radicado: caseDetail.radicado,
          }),
        }).catch(() => {})
      }
    }
    setSavingNote(false)
  }

  async function changeStatus(newStatus: string) {
    if (!selectedCase || !caseDetail) return
    setUpdatingStatus(true)
    const supabase = createClient()

    const update: any = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'resolved') update.resolved_at = new Date().toISOString()
    if (newStatus === 'closed') update.closed_at = new Date().toISOString()

    await supabase.from('pqrs_cases').update(update).eq('id', selectedCase)
    await supabase.from('pqrs_status_history').insert({
      case_id: selectedCase,
      brand_id: brandId,
      old_status: caseDetail.status,
      new_status: newStatus,
    })

    setCaseDetail((prev: any) => ({ ...prev, status: newStatus }))
    setCases(prev => prev.map(c => c.id === selectedCase ? { ...c, status: newStatus } : c))
    setUpdatingStatus(false)
  }

  const isDueSoon = (d: string | null) => {
    if (!d) return false
    const due = new Date(d)
    const diff = (due.getTime() - Date.now()) / 86400000
    return diff <= 3 && diff >= 0
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquareWarning size={22} className="text-orange-500" /> Gestión PQRS
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{cases.length} casos registrados</p>
        </div>
        <div className="flex gap-2">
          {formUrl && (
            <a href={formUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              <ExternalLink size={13} /> Formulario público
            </a>
          )}
          <Link href="/admin/pqrs/config" className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Settings size={13} /> Configurar
          </Link>
        </div>
      </div>

      {/* Config alert */}
      {needsConfig && (
        <Link href="/admin/pqrs/config" className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Configura tu formulario PQRS</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Define un slug para el formulario público y personaliza las categorías</p>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{openCount}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">Abiertos</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">En gestión</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
          <p className={`text-2xl font-bold ${breachedCount > 0 ? 'text-red-500' : 'text-green-600'}`}>{breachedCount}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase">SLA vencidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por radicado, nombre, asunto..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          <option value="all">Todas las categorías</option>
          {(config?.categories || ['Petición', 'Queja', 'Reclamo', 'Sugerencia']).map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Cases list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <MessageSquareWarning size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay casos registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(c => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.open
              const Icon = st.icon
              return (
                <button key={c.id} onClick={() => openCase(c.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${st.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">{c.radicado}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CAT_COLORS[c.category] || ''}`}>{c.category}</span>
                        {c.sla_breached && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">SLA</span>}
                        {isDueSoon(c.sla_due_date) && !c.sla_breached && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-600">Pronto</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.subject}</p>
                      <p className="text-xs text-gray-400 truncate">{c.requester_name} · {new Date(c.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0 ${st.color}`}>{st.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Case detail panel */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={() => setSelectedCase(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 h-full overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-5 py-3 flex items-center justify-between z-10">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{caseDetail?.radicado || '...'}</p>
              <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {loadingDetail ? (
              <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto" /></div>
            ) : caseDetail && (
              <div className="p-5 space-y-5">
                {/* Status + category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_MAP[caseDetail.status]?.color || ''}`}>
                    {STATUS_MAP[caseDetail.status]?.label || caseDetail.status}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CAT_COLORS[caseDetail.category] || ''}`}>{caseDetail.category}</span>
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[caseDetail.priority] || ''}`}>● {caseDetail.priority}</span>
                </div>

                {/* Subject & description */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{caseDetail.subject}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">{caseDetail.description}</p>
                </div>

                {/* Requester info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{caseDetail.requester_name}</p>
                  {caseDetail.requester_email && <p className="text-gray-500">{caseDetail.requester_email}</p>}
                  {caseDetail.requester_phone && <p className="text-gray-500">{caseDetail.requester_phone}</p>}
                  {caseDetail.requester_id_number && <p className="text-gray-400 text-xs">{caseDetail.requester_id_type}: {caseDetail.requester_id_number}</p>}
                  <p className="text-gray-400 text-xs">SLA: {caseDetail.sla_due_date ? new Date(caseDetail.sla_due_date).toLocaleDateString('es') : 'N/A'}</p>
                </div>

                {/* Status change */}
                {!['closed', 'rejected'].includes(caseDetail.status) && (
                  <div className="flex flex-wrap gap-2">
                    {caseDetail.status === 'open' && (
                      <button onClick={() => changeStatus('in_progress')} disabled={updatingStatus}
                        className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50">En gestión</button>
                    )}
                    {['open', 'in_progress'].includes(caseDetail.status) && (
                      <button onClick={() => changeStatus('waiting_response')} disabled={updatingStatus}
                        className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50">Esperando respuesta</button>
                    )}
                    {caseDetail.status !== 'resolved' && (
                      <button onClick={() => changeStatus('resolved')} disabled={updatingStatus}
                        className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50">Resolver</button>
                    )}
                    <button onClick={() => changeStatus('closed')} disabled={updatingStatus}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cerrar</button>
                  </div>
                )}

                {/* Notes */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notas y comentarios</p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {caseNotes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg text-sm ${note.is_internal ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {note.is_internal && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-200 text-yellow-700 rounded font-medium">Interna</span>}
                          <span className="text-xs text-gray-400">{new Date(note.created_at).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                    {caseNotes.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin notas aún</p>}
                  </div>

                  {/* Add note */}
                  <div className="mt-3 space-y-2">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                      rows={3} placeholder="Agregar nota..."
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none" />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                        <input type="checkbox" checked={noteInternal} onChange={e => setNoteInternal(e.target.checked)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-400" />
                        Nota interna (no visible para el solicitante)
                      </label>
                      <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                        className="px-4 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50">
                        {savingNote ? 'Guardando...' : 'Agregar nota'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
