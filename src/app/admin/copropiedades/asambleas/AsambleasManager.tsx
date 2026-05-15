'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Plus, Check, X, Vote, FileText, Play, Square, UserCheck, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Meeting {
  id: string; meeting_type: string; title: string; description: string | null
  scheduled_date: string; scheduled_time: string; status: string
  quorum_coeficiente: number; quorum_required: number; minutes_text: string | null
  created_at: string
}
interface Unit { id: string; unit_number: string; coeficiente: number; owner_name: string | null }
interface Attendee { id: string; meeting_id: string; unit_id: string; unit_number: string; representative_name: string; coeficiente: number; is_delegate: boolean; checked_in_at: string | null }
interface VoteItem { id: string; meeting_id: string; title: string; description: string | null; vote_type: string; status: string; result_summary: any }
interface VoteRecord { id: string; vote_id: string; unit_id: string; unit_number: string; vote_value: string; coeficiente: number }

interface Props { brandId: string; meetings: Meeting[]; units: Unit[] }

const MEETING_TYPES: Record<string, string> = {
  asamblea_ordinaria: 'Asamblea Ordinaria', asamblea_extraordinaria: 'Asamblea Extraordinaria',
  consejo: 'Consejo de Administración',
}

export default function AsambleasManager({ brandId, meetings: initial, units }: Props) {
  const [meetings, setMeetings] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [votes, setVotes] = useState<VoteItem[]>([])
  const [voteRecords, setVoteRecords] = useState<VoteRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'attendees' | 'votes' | 'minutes'>('attendees')

  // Create form
  const [mType, setMType] = useState('asamblea_ordinaria')
  const [mTitle, setMTitle] = useState('')
  const [mDesc, setMDesc] = useState('')
  const [mDate, setMDate] = useState('')
  const [mTime, setMTime] = useState('19:00')
  const [mQuorum, setMQuorum] = useState('51')

  // Vote form
  const [creatingVote, setCreatingVote] = useState(false)
  const [vTitle, setVTitle] = useState('')
  const [vDesc, setVDesc] = useState('')
  const [vType, setVType] = useState('si_no')

  // Minutes
  const [minutesText, setMinutesText] = useState('')
  const [savingMinutes, setSavingMinutes] = useState(false)

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  const totalCoef = units.reduce((s, u) => s + u.coeficiente, 0)
  const attendeeCoef = attendees.filter(a => a.checked_in_at).reduce((s, a) => s + a.coeficiente, 0)
  const quorumPercent = totalCoef > 0 ? (attendeeCoef / totalCoef) * 100 : 0
  const hasQuorum = selected ? quorumPercent >= selected.quorum_required : false

  useEffect(() => {
    if (selected) loadMeetingDetails(selected.id)
  }, [selected?.id])

  async function loadMeetingDetails(meetingId: string) {
    const supabase = createClient()
    const [{ data: att }, { data: vt }, { data: vr }] = await Promise.all([
      supabase.from('copropiedad_attendees').select('*').eq('meeting_id', meetingId),
      supabase.from('copropiedad_votes').select('*').eq('meeting_id', meetingId).order('created_at'),
      supabase.from('copropiedad_vote_records').select('*').eq('vote_id', meetingId), // will filter client-side
    ])
    setAttendees(att ?? [])
    setVotes(vt ?? [])
    // Load vote records for all votes
    if (vt && vt.length > 0) {
      const { data: allRecords } = await supabase.from('copropiedad_vote_records').select('*').in('vote_id', vt.map((v: any) => v.id))
      setVoteRecords(allRecords ?? [])
    } else {
      setVoteRecords([])
    }
    const meeting = meetings.find(m => m.id === meetingId)
    if (meeting) setMinutesText(meeting.minutes_text || '')
  }

  async function createMeeting() {
    if (!mTitle || !mDate) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_meetings').insert({
      brand_id: brandId, meeting_type: mType, title: mTitle.trim(),
      description: mDesc || null, scheduled_date: mDate, scheduled_time: mTime,
      quorum_required: parseFloat(mQuorum) || 51, status: 'scheduled',
    }).select().single()
    if (data) { setMeetings(prev => [data as Meeting, ...prev]); setCreating(false); setMTitle(''); setMDesc('') }
    setSaving(false)
  }

  async function updateMeetingStatus(status: string) {
    if (!selected) return
    const supabase = createClient()
    const update: any = { status }
    if (status === 'in_progress') update.quorum_coeficiente = attendeeCoef
    const { data } = await supabase.from('copropiedad_meetings').update(update).eq('id', selected.id).select().single()
    if (data) {
      const m = data as Meeting
      setSelected(m)
      setMeetings(prev => prev.map(x => x.id === m.id ? m : x))
    }
  }

  async function registerAttendees() {
    if (!selected) return
    setSaving(true)
    const supabase = createClient()
    const existing = new Set(attendees.map(a => a.unit_id))
    const newAttendees = units.filter(u => !existing.has(u.id)).map(u => ({
      meeting_id: selected.id, unit_id: u.id, unit_number: u.unit_number,
      representative_name: u.owner_name || u.unit_number, coeficiente: u.coeficiente,
    }))
    if (newAttendees.length > 0) {
      const { data } = await supabase.from('copropiedad_attendees').insert(newAttendees).select()
      if (data) setAttendees(prev => [...prev, ...(data as Attendee[])])
    }
    setSaving(false)
  }

  async function checkIn(attendeeId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_attendees').update({
      checked_in_at: new Date().toISOString()
    }).eq('id', attendeeId).select().single()
    if (data) setAttendees(prev => prev.map(a => a.id === attendeeId ? data as Attendee : a))
  }

  async function createVote() {
    if (!selected || !vTitle) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_votes').insert({
      meeting_id: selected.id, title: vTitle.trim(), description: vDesc || null,
      vote_type: vType, status: 'pending',
    }).select().single()
    if (data) { setVotes(prev => [...prev, data as VoteItem]); setCreatingVote(false); setVTitle(''); setVDesc('') }
    setSaving(false)
  }

  async function openVote(voteId: string) {
    const supabase = createClient()
    await supabase.from('copropiedad_votes').update({ status: 'open' }).eq('id', voteId)
    setVotes(prev => prev.map(v => v.id === voteId ? { ...v, status: 'open' } : v))
  }

  async function castVote(voteId: string, unitId: string, unitNumber: string, value: string, coef: number) {
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_vote_records').upsert({
      vote_id: voteId, unit_id: unitId, unit_number: unitNumber, vote_value: value, coeficiente: coef,
    }, { onConflict: 'vote_id,unit_id' }).select().single()
    if (data) {
      setVoteRecords(prev => {
        const filtered = prev.filter(r => !(r.vote_id === voteId && r.unit_id === unitId))
        return [...filtered, data as VoteRecord]
      })
    }
  }

  async function closeVote(voteId: string) {
    const records = voteRecords.filter(r => r.vote_id === voteId)
    const summary: Record<string, { count: number; coeficiente: number }> = {}
    records.forEach(r => {
      if (!summary[r.vote_value]) summary[r.vote_value] = { count: 0, coeficiente: 0 }
      summary[r.vote_value].count++
      summary[r.vote_value].coeficiente += r.coeficiente
    })
    const supabase = createClient()
    await supabase.from('copropiedad_votes').update({ status: 'closed', result_summary: summary }).eq('id', voteId)
    setVotes(prev => prev.map(v => v.id === voteId ? { ...v, status: 'closed', result_summary: summary } : v))
  }

  async function saveMinutes() {
    if (!selected) return
    setSavingMinutes(true)
    const supabase = createClient()
    await supabase.from('copropiedad_meetings').update({ minutes_text: minutesText }).eq('id', selected.id)
    setMeetings(prev => prev.map(m => m.id === selected.id ? { ...m, minutes_text: minutesText } : m))
    setSelected(prev => prev ? { ...prev, minutes_text: minutesText } : null)
    setSavingMinutes(false)
  }

  // Also create minutes table records
  async function generateMinutes() {
    if (!selected) return
    const supabase = createClient()
    const attendeeList = attendees.filter(a => a.checked_in_at).map(a => `${a.unit_number} - ${a.representative_name}`).join('\n')
    const voteResults = votes.filter(v => v.status === 'closed').map(v => {
      const results = v.result_summary ? Object.entries(v.result_summary).map(([k, val]: any) => `  ${k}: ${val.count} votos (${val.coeficiente.toFixed(4)}%)`).join('\n') : '  Sin resultados'
      return `\n## ${v.title}\n${v.description || ''}\nResultados:\n${results}`
    }).join('\n')

    const text = `# ACTA - ${selected.title}
Tipo: ${MEETING_TYPES[selected.meeting_type] || selected.meeting_type}
Fecha: ${selected.scheduled_date} ${selected.scheduled_time}
Quórum: ${quorumPercent.toFixed(2)}% (Requerido: ${selected.quorum_required}%)

## Asistentes (${attendees.filter(a => a.checked_in_at).length}/${attendees.length})
${attendeeList}

## Votaciones
${voteResults || 'No se realizaron votaciones'}

## Notas adicionales
`
    setMinutesText(text)
    setActiveTab('minutes')
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700', in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-600',
    }
    const labels: Record<string, string> = { scheduled: 'Programada', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada' }
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] || ''}`}>{labels[s] || s}</span>
  }

  // Detail view
  if (selected) {
    const checkedIn = attendees.filter(a => a.checked_in_at)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selected.title}</h1>
              <p className="text-xs text-gray-500">{MEETING_TYPES[selected.meeting_type]} · {selected.scheduled_date} {selected.scheduled_time}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(selected.status)}
            {selected.status === 'scheduled' && (
              <button onClick={() => updateMeetingStatus('in_progress')} disabled={!hasQuorum}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50" title={hasQuorum ? '' : 'Se requiere quórum'}>
                <Play size={13} /> Iniciar
              </button>
            )}
            {selected.status === 'in_progress' && (
              <button onClick={() => { generateMinutes(); updateMeetingStatus('completed') }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white text-xs font-semibold rounded-xl hover:bg-gray-700">
                <Square size={13} /> Finalizar
              </button>
            )}
          </div>
        </div>

        {/* Quorum bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quórum</p>
            <p className={`text-sm font-bold ${hasQuorum ? 'text-green-600' : 'text-red-500'}`}>
              {quorumPercent.toFixed(2)}% / {selected.quorum_required}% requerido
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${hasQuorum ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${Math.min(quorumPercent / selected.quorum_required * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{checkedIn.length} presentes · {attendeeCoef.toFixed(4)}% coeficiente</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {(['attendees', 'votes', 'minutes'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500'}`}>
              {t === 'attendees' ? 'Asistencia' : t === 'votes' ? 'Votaciones' : 'Acta'}
            </button>
          ))}
        </div>

        {activeTab === 'attendees' && (
          <div className="space-y-3">
            {attendees.length === 0 && (
              <button onClick={registerAttendees} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                <Users size={14} /> {saving ? 'Cargando...' : `Cargar ${units.length} unidades`}
              </button>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              {attendees.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><Users size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Carga las unidades para registrar asistencia</p></div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Inmueble</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Representante</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Coef. %</th>
                    <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Presente</th>
                  </tr></thead>
                  <tbody>{attendees.map(a => (
                    <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{a.unit_number}</td>
                      <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{a.representative_name}</td>
                      <td className="py-2 px-3 text-right font-mono text-gray-500">{a.coeficiente.toFixed(4)}</td>
                      <td className="py-2 px-3 text-center">
                        {a.checked_in_at ? (
                          <span className="text-green-600"><UserCheck size={16} className="inline" /></span>
                        ) : (
                          <button onClick={() => checkIn(a.id)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Registrar</button>
                        )}
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'votes' && (
          <div className="space-y-3">
            {(selected.status === 'in_progress') && (
              creatingVote ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Nueva votación</p>
                    <button onClick={() => setCreatingVote(false)} className="text-gray-400"><X size={18} /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2"><label className={labelClass}>Tema *</label><input type="text" value={vTitle} onChange={e => setVTitle(e.target.value)} className={inputClass} /></div>
                    <div className="sm:col-span-2"><label className={labelClass}>Descripción</label><textarea value={vDesc} onChange={e => setVDesc(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div>
                    <div><label className={labelClass}>Tipo</label>
                      <select value={vType} onChange={e => setVType(e.target.value)} className={inputClass}>
                        <option value="si_no">Sí / No</option>
                        <option value="si_no_abstencion">Sí / No / Abstención</option>
                        <option value="multiple">Opción múltiple</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={createVote} disabled={saving || !vTitle}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                    <Check size={14} /> Crear votación
                  </button>
                </div>
              ) : (
                <button onClick={() => setCreatingVote(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
                  <Plus size={15} /> Nueva votación
                </button>
              )
            )}

            {votes.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-12 text-gray-400">
                <Vote size={24} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay votaciones</p>
              </div>
            ) : votes.map(v => {
              const records = voteRecords.filter(r => r.vote_id === v.id)
              const presentUnits = attendees.filter(a => a.checked_in_at)
              const votedIds = new Set(records.map(r => r.unit_id))
              const pending = presentUnits.filter(u => !votedIds.has(u.unit_id))
              const voteOptions = v.vote_type === 'si_no' ? ['Sí', 'No'] : v.vote_type === 'si_no_abstencion' ? ['Sí', 'No', 'Abstención'] : ['Sí', 'No']

              return (
                <div key={v.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{v.title}</p>
                      {v.description && <p className="text-xs text-gray-500">{v.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${v.status === 'open' ? 'bg-green-100 text-green-700' : v.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                        {v.status === 'open' ? 'Abierta' : v.status === 'closed' ? 'Cerrada' : 'Pendiente'}
                      </span>
                      {v.status === 'pending' && selected.status === 'in_progress' && (
                        <button onClick={() => openVote(v.id)} className="text-xs text-green-600 font-medium">Abrir</button>
                      )}
                      {v.status === 'open' && (
                        <button onClick={() => closeVote(v.id)} className="text-xs text-red-500 font-medium">Cerrar</button>
                      )}
                    </div>
                  </div>

                  {v.status === 'open' && pending.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-500">Pendientes de votar ({pending.length})</p>
                      {pending.slice(0, 10).map(a => (
                        <div key={a.id} className="flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-700/30">
                          <span className="text-xs text-gray-700 dark:text-gray-300">{a.unit_number} — {a.representative_name}</span>
                          <div className="flex gap-1">
                            {voteOptions.map(opt => (
                              <button key={opt} onClick={() => castVote(v.id, a.unit_id, a.unit_number, opt, a.coeficiente)}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200">{opt}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {pending.length > 10 && <p className="text-[10px] text-gray-400">...y {pending.length - 10} más</p>}
                    </div>
                  )}

                  {/* Results */}
                  {(v.status === 'closed' || records.length > 0) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Resultados ({records.length} votos)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {voteOptions.map(opt => {
                          const optRecords = records.filter(r => r.vote_value === opt)
                          const optCoef = optRecords.reduce((s, r) => s + r.coeficiente, 0)
                          return (
                            <div key={opt} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 text-center">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{opt}</p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{optRecords.length}</p>
                              <p className="text-[10px] text-gray-400">{optCoef.toFixed(4)}%</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'minutes' && (
          <div className="space-y-3">
            {!minutesText && selected.status === 'completed' && (
              <button onClick={generateMinutes} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
                <FileText size={14} /> Generar acta
              </button>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <textarea value={minutesText} onChange={e => setMinutesText(e.target.value)} rows={20}
                className={`${inputClass} font-mono text-xs resize-none`} placeholder="El acta se generará automáticamente al finalizar la asamblea..." />
              <button onClick={saveMinutes} disabled={savingMinutes}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                <Check size={14} /> {savingMinutes ? 'Guardando...' : 'Guardar acta'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/copropiedades" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Users size={20} className="text-indigo-600" /> Asambleas y Reuniones</h1>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
          <Plus size={15} /> Nueva reunión
        </button>
      </div>

      {creating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nueva reunión</p>
            <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className={labelClass}>Tipo</label>
              <select value={mType} onChange={e => setMType(e.target.value)} className={inputClass}>
                {Object.entries(MEETING_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><label className={labelClass}>Título *</label><input type="text" value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Asamblea ordinaria 2026" className={inputClass} /></div>
            <div><label className={labelClass}>Fecha *</label><input type="date" value={mDate} onChange={e => setMDate(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Hora</label><input type="time" value={mTime} onChange={e => setMTime(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Quórum requerido %</label><input type="number" value={mQuorum} onChange={e => setMQuorum(e.target.value)} min={1} max={100} className={inputClass} /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Descripción</label><textarea value={mDesc} onChange={e => setMDesc(e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div>
          </div>
          <button onClick={createMeeting} disabled={saving || !mTitle || !mDate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            <Check size={14} /> {saving ? 'Guardando...' : 'Crear reunión'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center py-16 text-gray-400">
            <Users size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay reuniones programadas</p>
          </div>
        ) : meetings.map(m => (
          <button key={m.id} onClick={() => setSelected(m)}
            className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{m.title}</p>
                <p className="text-xs text-gray-500">{MEETING_TYPES[m.meeting_type]} · {m.scheduled_date} {m.scheduled_time}</p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(m.status)}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
