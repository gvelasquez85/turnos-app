'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBrandStore } from '@/stores/brandStore'
import { Building2, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/utils'
import type { TicketStatus } from '@/types/database'

interface Ticket {
  id: string
  queue_number: string
  customer_name: string
  status: TicketStatus
  created_at: string
  establishment_id: string
  visit_reasons: { name: string } | null
}

interface EstablishmentStats {
  id: string
  name: string
  brand_id: string
  waiting: Ticket[]
  inProgress: Ticket[]
}

interface Props {
  brands: { id: string; name: string }[]
  establishments: { id: string; name: string; brand_id: string }[]
  defaultBrandId: string | null
}

export function BrandQueueMonitor({ brands, establishments, defaultBrandId }: Props) {
  const { selectedBrandId: storeBrandId } = useBrandStore()
  // '' = todas las marcas (respeta la selección global), nunca override con autoBrand
  const selectedBrand = storeBrandId

  const [stats, setStats] = useState<EstablishmentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const brandEstablishments = selectedBrand
    ? establishments.filter(e => e.brand_id === selectedBrand)
    : establishments

  const loadTickets = useCallback(async () => {
    if (brandEstablishments.length === 0) { setStats([]); setLoading(false); return }
    const supabase = createClient()
    const estIds = brandEstablishments.map(e => e.id)
    const { data } = await supabase
      .from('tickets')
      .select('id, queue_number, customer_name, status, created_at, establishment_id, visit_reasons(name)')
      .in('establishment_id', estIds)
      .in('status', ['waiting', 'in_progress'])
      .order('created_at', { ascending: true })

    const tickets = (data as unknown as Ticket[]) || []
    const newStats: EstablishmentStats[] = brandEstablishments.map(est => ({
      id: est.id,
      name: est.name,
      brand_id: est.brand_id,
      waiting: tickets.filter(t => t.establishment_id === est.id && t.status === 'waiting'),
      inProgress: tickets.filter(t => t.establishment_id === est.id && t.status === 'in_progress'),
    }))
    setStats(newStats)
    setLastUpdate(new Date())
    setLoading(false)
  }, [selectedBrand, establishments])

  useEffect(() => {
    setLoading(true)
    loadTickets()
  }, [loadTickets])

  // Real-time subscription para todos los establecimientos de la marca
  useEffect(() => {
    if (brandEstablishments.length === 0) return
    const supabase = createClient()
    const channels = brandEstablishments.map(est =>
      supabase
        .channel(`monitor-${est.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'tickets',
          filter: `establishment_id=eq.${est.id}`,
        }, () => loadTickets())
        .subscribe()
    )
    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [selectedBrand, establishments])

  const totalWaiting = stats.reduce((s, e) => s + e.waiting.length, 0)
  const totalInProgress = stats.reduce((s, e) => s + e.inProgress.length, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitor de colas</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Actualizado {lastUpdate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        {selectedBrand ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
            <Building2 size={13} className="text-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700">
              {brands.find(b => b.id === selectedBrand)?.name || 'Marca seleccionada'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
            <Building2 size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500">Todas las marcas</span>
          </div>
        )}
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{brandEstablishments.length}</p>
            <p className="text-xs text-gray-500">Locaciones</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalWaiting}</p>
            <p className="text-xs text-gray-500">En espera</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <Users size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalInProgress}</p>
            <p className="text-xs text-gray-500">En atención</p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">Cargando colas...</div>
      )}

      {!loading && stats.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-40" />
          <p>No hay sucursales activas para esta marca</p>
        </div>
      )}

      {/* Grid de establecimientos */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map(est => (
            <div
              key={est.id}
              className={cn(
                'bg-white rounded-xl border-2 overflow-hidden',
                est.waiting.length > 0 || est.inProgress.length > 0
                  ? 'border-amber-200'
                  : 'border-gray-200',
              )}
            >
              {/* Cabecera del establecimiento */}
              <div className={cn(
                'px-4 py-3 flex items-center justify-between',
                est.waiting.length > 0 ? 'bg-amber-50' : 'bg-gray-50',
              )}>
                <p className="font-semibold text-gray-900 text-sm">{est.name}</p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    est.waiting.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500',
                  )}>
                    {est.waiting.length} esperando
                  </span>
                  {est.inProgress.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {est.inProgress.length} en atención
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de tickets */}
              <div className="p-3">
                {est.waiting.length === 0 && est.inProgress.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-gray-400">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-sm">Sin clientes en espera</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {[...est.inProgress, ...est.waiting].slice(0, 5).map(ticket => (
                      <div key={ticket.id} className="flex items-center gap-3 py-1.5">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700',
                        )}>
                          {ticket.queue_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.customer_name}</p>
                          <p className="text-xs text-gray-400 truncate">{ticket.visit_reasons?.name || '—'}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatTime(ticket.created_at)}</span>
                      </div>
                    ))}
                    {(est.waiting.length + est.inProgress.length) > 5 && (
                      <p className="text-xs text-center text-gray-400 pt-1">
                        +{est.waiting.length + est.inProgress.length - 5} más en cola
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
