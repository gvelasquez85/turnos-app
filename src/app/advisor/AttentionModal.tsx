'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Ticket, AdvisorField } from '@/types/database'
import { X, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'

interface TicketRow extends Ticket {
  visit_reasons: { name: string } | null
}

interface Props {
  ticket: TicketRow
  advisorId: string
  advisorFields: AdvisorField[]
  onClose: () => void
  onComplete: () => void
}

export function AttentionModal({ ticket, advisorId, advisorFields, onClose, onComplete }: Props) {
  const [fieldsData, setFieldsData] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const errs: Record<string, string> = {}
    advisorFields.forEach(field => {
      if (field.required && !fieldsData[field.id]?.trim()) {
        errs[field.id] = `${field.label} es obligatorio`
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleComplete() {
    if (!validate()) return
    setLoading(true)
    const supabase = createClient()

    await supabase.from('attentions').insert({
      ticket_id: ticket.id,
      advisor_id: advisorId,
      establishment_id: ticket.establishment_id,
      fields_data: fieldsData,
      notes: notes || null,
      completed_at: new Date().toISOString(),
    })

    await supabase.from('tickets').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('id', ticket.id)

    setLoading(false)
    onComplete()
  }

  function renderField(field: AdvisorField) {
    const value = fieldsData[field.id] || ''
    const error = errors[field.id]
    const onChange = (val: string) => {
      setFieldsData(d => ({ ...d, [field.id]: val }))
      // Limpiar error al escribir
      if (errors[field.id]) setErrors(e => { const n = { ...e }; delete n[field.id]; return n })
    }

    if (field.field_type === 'select' && field.options) {
      return (
        <div key={field.id}>
          <Select
            label={`${field.label}${field.required ? ' *' : ''}`}
            value={value}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">Seleccionar...</option>
            {(field.options as string[]).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
          {error && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        </div>
      )
    }

    if (field.field_type === 'textarea') {
      return (
        <div key={field.id} className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {field.label}{field.required && ' *'}
          </label>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
              error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          />
          {error && <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        </div>
      )
    }

    return (
      <Input
        key={field.id}
        label={`${field.label}${field.required ? ' *' : ''}`}
        type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        error={error}
      />
    )
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900">Atendiendo turno #{ticket.queue_number}</h2>
            <p className="text-sm text-gray-500">{ticket.visit_reasons?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Datos del cliente */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos del cliente</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-gray-400" />
                <span className="font-medium text-gray-900">{ticket.customer_name}</span>
              </div>
              {ticket.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-700">{ticket.customer_phone}</span>
                </div>
              )}
              {ticket.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-700">{ticket.customer_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className={`px-2 py-0.5 rounded-full ${ticket.marketing_opt_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {ticket.marketing_opt_in ? '✓ Acepta publicidad' : 'No acepta publicidad'}
                </span>
              </div>
            </div>
          </div>

          {/* Campos del asesor */}
          {advisorFields.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Información de la atención
              </h3>
              <div className="flex flex-col gap-3">
                {advisorFields.map(renderField)}
              </div>

              {/* Resumen de errores si intentó guardar con campos vacíos */}
              {hasErrors && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-700">
                    Completa los campos obligatorios antes de cerrar el turno.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notas internas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones..."
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <Button size="lg" className="w-full" loading={loading} onClick={handleComplete}>
            <CheckCircle size={16} className="mr-2" />
            Marcar como atendido
          </Button>
        </div>
      </div>
    </div>
  )
}
