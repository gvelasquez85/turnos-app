'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, UserCheck, UserPlus, RotateCcw, Search,
  Phone, Mail, Building2, Calendar, TrendingUp, Star,
  ChevronDown, ChevronUp, Edit2, X, Check,
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  document_id: string | null
  first_visit_at: string
  last_visit_at: string
  total_visits: number
  establishment_ids: string[]
}

interface Establishment {
  id: string
  name: string
}

interface Props {
  customers: Customer[]
  establishments: Establishment[]
  brandId: string
}

function visitTag(totalVisits: number): { label: string; color: string } {
  if (totalVisits === 1) return { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' }
  if (totalVisits <= 3) return { label: 'Ocasional', color: 'bg-amber-100 text-amber-700' }
  if (totalVisits <= 9) return { label: 'Frecuente', color: 'bg-green-100 text-green-700' }
  return { label: 'Fiel', color: 'bg-purple-100 text-purple-700' }
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function EditModal({ customer, onClose, onSave }: {
  customer: Customer
  onClose: () => void
  onSave: (c: Customer) => void
}) {
  const [form, setForm] = useState({
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    document_id: customer.document_id ?? '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .update({
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        document_id: form.document_id || null,
      })
      .eq('id', customer.id)
      .select()
      .single()
    setSaving(false)
    if (data) onSave({ ...customer, ...data })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Editar cliente</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { key: 'name', label: 'Nombre', type: 'text' },
            { key: 'phone', label: 'Teléfono', type: 'tel' },
            { key: 'email', label: 'Correo', type: 'email' },
            { key: 'document_id', label: 'Documento', type: 'text' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type={type}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CRMDashboard({ customers: initialCustomers, establishments, brandId }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [search, setSearch] = useState('')
  const [filterEst, setFilterEst] = useState('')
  const [filterType, setFilterType] = useState<'' | 'new' | 'occasional' | 'frequent' | 'loyal'>('')
  const [sortField, setSortField] = useState<'last_visit_at' | 'total_visits' | 'name'>('last_visit_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editModal, setEditModal] = useState<Customer | null>(null)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])

  const filtered = useMemo(() => {
    let list = [...customers]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.document_id?.includes(q)
      )
    }

    if (filterEst) {
      list = list.filter(c => c.establishment_ids.includes(filterEst))
    }

    if (filterType) {
      list = list.filter(c => {
        const v = c.total_visits
        if (filterType === 'new') return v === 1
        if (filterType === 'occasional') return v >= 2 && v <= 3
        if (filterType === 'frequent') return v >= 4 && v <= 9
        if (filterType === 'loyal') return v >= 10
        return true
      })
    }

    list.sort((a, b) => {
      let av: any = a[sortField]
      let bv: any = b[sortField]
      if (sortField === 'last_visit_at') { av = new Date(av).getTime(); bv = new Date(bv).getTime() }
      if (sortField === 'name') { av = av.toLowerCase(); bv = bv.toLowerCase() }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

    return list
  }, [customers, search, filterEst, filterType, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  // KPIs
  const total = customers.length
  const newOnes = customers.filter(c => c.total_visits === 1).length
  const returning = customers.filter(c => c.total_visits >= 2).length
  const loyal = customers.filter(c => c.total_visits >= 10).length
  const avgVisits = total > 0 ? (customers.reduce((s, c) => s + c.total_visits, 0) / total).toFixed(1) : '0'

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">Historial de visitas y perfil de cada cliente</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: total, icon: Users, color: 'bg-indigo-100 text-indigo-600' },
          { label: 'Nuevos', value: newOnes, icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
          { label: 'Recurrentes', value: returning, icon: RotateCcw, color: 'bg-green-100 text-green-600' },
          { label: 'Fieles (10+)', value: loyal, icon: Star, color: 'bg-purple-100 text-purple-600' },
          { label: 'Promedio visitas', value: avgVisits, icon: TrendingUp, color: 'bg-amber-100 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {establishments.length > 1 && (
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
            value={filterEst}
            onChange={e => setFilterEst(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
        <select
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none"
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
        >
          <option value="">Todos los tipos</option>
          <option value="new">Nuevos (1 visita)</option>
          <option value="occasional">Ocasionales (2–3)</option>
          <option value="frequent">Frecuentes (4–9)</option>
          <option value="loyal">Fieles (10+)</option>
        </select>
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <UserCheck size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Aún no hay clientes registrados</p>
          <p className="text-sm text-gray-400 mt-1">Se registran automáticamente cuando se atiende un turno</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('name')}>
                      Cliente <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">Contacto</th>
                  <th className="px-4 py-2.5 text-left hidden lg:table-cell">Sucursales</th>
                  <th className="px-4 py-2.5 text-center">
                    <button className="flex items-center gap-1 hover:text-gray-700 mx-auto" onClick={() => toggleSort('total_visits')}>
                      Visitas <SortIcon field="total_visits" />
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort('last_visit_at')}>
                      Última visita <SortIcon field="last_visit_at" />
                    </button>
                  </th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                      Sin resultados para los filtros aplicados
                    </td>
                  </tr>
                ) : filtered.map(customer => {
                  const tag = visitTag(customer.total_visits)
                  const days = daysSince(customer.last_visit_at)
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-700">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${tag.color}`}>{tag.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone size={10} className="shrink-0 text-gray-400" /> {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail size={10} className="shrink-0 text-gray-400" />
                              <span className="truncate max-w-[160px]">{customer.email}</span>
                            </div>
                          )}
                          {!customer.phone && !customer.email && <span className="text-xs text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {customer.establishment_ids.slice(0, 2).map(eid => (
                            <span key={eid} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {estMap[eid] ?? '?'}
                            </span>
                          ))}
                          {customer.establishment_ids.length > 2 && (
                            <span className="text-[10px] text-gray-400">+{customer.establishment_ids.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <p className="text-sm font-bold text-gray-900">{customer.total_visits}</p>
                        <p className="text-[10px] text-gray-400">
                          desde {new Date(customer.first_visit_at).toLocaleDateString('es', { month: 'short', year: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">
                          {days === 0 ? 'Hoy' : days === 1 ? 'Ayer' : `Hace ${days}d`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(customer.last_visit_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setEditModal(customer)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
            {filtered.length} de {total} clientes
          </div>
        </div>
      )}

      {editModal && (
        <EditModal
          customer={editModal}
          onClose={() => setEditModal(null)}
          onSave={updated => {
            setCustomers(cs => cs.map(c => c.id === updated.id ? updated : c))
            setEditModal(null)
          }}
        />
      )}
    </div>
  )
}
