'use client'

import { useState } from 'react'
import { ArrowLeft, DoorOpen, Plus, Check, X, Calendar, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Space {
  id: string; name: string; description: string | null; capacity: number | null
  requires_approval: boolean; max_hours_per_reservation: number; is_active: boolean
  available_days: number[]; available_from: string; available_until: string
}
interface Reservation {
  id: string; space_id: string; unit_number: string; resident_name: string
  reservation_date: string; start_time: string; end_time: string; status: string; notes: string | null
}
interface Props { brandId: string; spaces: Space[]; reservations: Reservation[] }

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function EspaciosManager({ brandId, spaces: initialSpaces, reservations: initialRes }: Props) {
  const [spaces, setSpaces] = useState(initialSpaces)
  const [reservations, setReservations] = useState(initialRes)
  const [creating, setCreating] = useState(false)
  const [reserving, setReserving] = useState<string | null>(null)
  const [tab, setTab] = useState<'spaces' | 'reservations'>('spaces')

  // Space form
  const [sName, setSName] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sCap, setSCap] = useState('')
  const [sApproval, setSApproval] = useState(false)
  const [sMaxHours, setSMaxHours] = useState('4')
  const [sDays, setSDays] = useState([1, 2, 3, 4, 5, 6, 0])
  const [sFrom, setSFrom] = useState('06:00')
  const [sUntil, setSUntil] = useState('22:00')
  const [saving, setSaving] = useState(false)

  // Reservation form
  const [rUnit, setRUnit] = useState('')
  const [rName, setRName] = useState('')
  const [rDate, setRDate] = useState('')
  const [rStart, setRStart] = useState('08:00')
  const [rEnd, setREnd] = useState('10:00')
  const [rNotes, setRNotes] = useState('')

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  function toggleDay(d: number) {
    setSDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function saveSpace() {
    if (!sName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_spaces').insert({
      brand_id: brandId, name: sName.trim(), description: sDesc || null,
      capacity: sCap ? parseInt(sCap) : null, requires_approval: sApproval,
      max_hours_per_reservation: parseInt(sMaxHours) || 4,
      available_days: sDays.sort(), available_from: sFrom, available_until: sUntil,
    }).select().single()
    if (data) { setSpaces(prev => [...prev, data as Space]); setCreating(false); setSName(''); setSDesc(''); setSCap('') }
    setSaving(false)
  }

  async function saveReservation() {
    if (!reserving || !rUnit || !rName || !rDate) return
    setSaving(true)
    const supabase = createClient()
    const space = spaces.find(s => s.id === reserving)
    const status = space?.requires_approval ? 'pending' : 'approved'
    const { data } = await supabase.from('copropiedad_reservations').insert({
      brand_id: brandId, space_id: reserving, unit_number: rUnit.trim(),
      resident_name: rName.trim(), reservation_date: rDate,
      start_time: rStart, end_time: rEnd, status, notes: rNotes || null,
    }).select().single()
    if (data) { setReservations(prev => [...prev, data as Reservation]); setReserving(null); setRUnit(''); setRName(''); setRDate(''); setRNotes('') }
    setSaving(false)
  }

  async function updateResStatus(id: string, status: string) {
    const supabase = createClient()
    const { data } = await supabase.from('copropiedad_reservations').update({ status }).eq('id', id).select().single()
    if (data) setReservations(prev => prev.map(r => r.id === id ? data as Reservation : r))
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500',
    }
    const labels: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' }
    return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[s] || ''}`}>{labels[s] || s}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/copropiedades" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><ArrowLeft size={18} /></Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><DoorOpen size={20} className="text-purple-600" /> Espacios Comunes</h1>
        </div>
        <button onClick={() => tab === 'spaces' ? setCreating(true) : setReserving(spaces[0]?.id || null)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700">
          <Plus size={15} /> {tab === 'spaces' ? 'Nuevo espacio' : 'Nueva reserva'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {(['spaces', 'reservations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${tab === t ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'spaces' ? 'Espacios' : 'Reservas'}
          </button>
        ))}
      </div>

      {/* Create space */}
      {creating && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nuevo espacio común</p>
            <button onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><label className={labelClass}>Nombre *</label><input type="text" value={sName} onChange={e => setSName(e.target.value)} placeholder="Salón social" className={inputClass} /></div>
            <div><label className={labelClass}>Capacidad</label><input type="number" value={sCap} onChange={e => setSCap(e.target.value)} placeholder="50" className={inputClass} /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Descripción</label><input type="text" value={sDesc} onChange={e => setSDesc(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Máx. horas</label><input type="number" value={sMaxHours} onChange={e => setSMaxHours(e.target.value)} min={1} className={inputClass} /></div>
            <div><label className={labelClass}>Desde</label><input type="time" value={sFrom} onChange={e => setSFrom(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Hasta</label><input type="time" value={sUntil} onChange={e => setSUntil(e.target.value)} className={inputClass} /></div>
          </div>
          <div>
            <label className={labelClass}>Días disponibles</label>
            <div className="flex gap-1.5">{DAYS.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className={`w-9 h-9 rounded-lg text-xs font-semibold ${sDays.includes(i) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d}</button>
            ))}</div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={sApproval} onChange={e => setSApproval(e.target.checked)} className="rounded border-gray-300 text-purple-600" />
            Requiere aprobación del administrador
          </label>
          <button onClick={saveSpace} disabled={saving || !sName.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50">
            <Check size={14} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Reserve form */}
      {reserving && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Nueva reserva</p>
            <button onClick={() => setReserving(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div><label className={labelClass}>Espacio</label>
              <select value={reserving} onChange={e => setReserving(e.target.value)} className={inputClass}>
                {spaces.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Inmueble *</label><input type="text" value={rUnit} onChange={e => setRUnit(e.target.value)} placeholder="Apto 101" className={inputClass} /></div>
            <div><label className={labelClass}>Residente *</label><input type="text" value={rName} onChange={e => setRName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha *</label><input type="date" value={rDate} onChange={e => setRDate(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Hora inicio</label><input type="time" value={rStart} onChange={e => setRStart(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Hora fin</label><input type="time" value={rEnd} onChange={e => setREnd(e.target.value)} className={inputClass} /></div>
            <div className="sm:col-span-3"><label className={labelClass}>Notas</label><input type="text" value={rNotes} onChange={e => setRNotes(e.target.value)} className={inputClass} /></div>
          </div>
          <button onClick={saveReservation} disabled={saving || !rUnit || !rName || !rDate}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50">
            <Check size={14} /> {saving ? 'Guardando...' : 'Reservar'}
          </button>
        </div>
      )}

      {/* Content */}
      {tab === 'spaces' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {spaces.length === 0 ? (
            <div className="sm:col-span-2 text-center py-16 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <DoorOpen size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay espacios registrados</p>
            </div>
          ) : spaces.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              {s.description && <p className="text-xs text-gray-500 mb-2">{s.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {s.capacity && <span>Cap: {s.capacity}</span>}
                <span><Clock size={10} className="inline" /> {s.available_from}-{s.available_until}</span>
                <span>Máx {s.max_hours_per_reservation}h</span>
                {s.requires_approval && <span className="text-orange-500">Requiere aprobación</span>}
              </div>
              <div className="flex gap-1 mt-2">{DAYS.map((d, i) => (
                <span key={i} className={`w-6 h-6 rounded text-[9px] flex items-center justify-center font-medium ${s.available_days.includes(i) ? 'bg-purple-100 text-purple-700' : 'bg-gray-50 text-gray-300'}`}>{d[0]}</span>
              ))}</div>
              <button onClick={() => setReserving(s.id)} className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                <Calendar size={12} /> Reservar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {reservations.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><Calendar size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No hay reservas próximas</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Espacio</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Inmueble</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Residente</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Horario</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr></thead>
              <tbody>{reservations.map(r => {
                const space = spaces.find(s => s.id === r.space_id)
                return (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-2 px-3 font-medium text-gray-900 dark:text-gray-100">{space?.name || '—'}</td>
                    <td className="py-2 px-3 text-gray-500">{r.unit_number}</td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{r.resident_name}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{r.reservation_date}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{r.start_time?.slice(0, 5)}-{r.end_time?.slice(0, 5)}</td>
                    <td className="py-2 px-3 text-center">{statusBadge(r.status)}</td>
                    <td className="py-2 px-3 text-right">
                      {r.status === 'pending' && (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => updateResStatus(r.id, 'approved')} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                          <button onClick={() => updateResStatus(r.id, 'rejected')} className="text-red-500 hover:text-red-600"><X size={14} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
