import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Shield, CheckCircle, User, Phone, Mail, Calendar, Building2 } from 'lucide-react'

export default async function ValidarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: consent } = await supabase
    .from('data_consents')
    .select('*, establishments(name, brands(name))')
    .eq('id', id)
    .single()

  if (!consent) notFound()

  const maskedPhone = consent.customer_phone
    ? consent.customer_phone.slice(0, -4).replace(/\d/g, '•') + consent.customer_phone.slice(-4)
    : null

  const maskedEmail = consent.customer_email
    ? consent.customer_email.replace(/^(..)(.*?)(@.*)$/, (_: string, a: string, b: string, c: string) => a + b.replace(/./g, '•') + c)
    : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Shield size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Validación de autorización</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de consentimiento de tratamiento de datos</p>
        </div>

        {/* Status badge */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Autorización válida</p>
            <p className="text-sm text-green-600">El cliente autorizó el tratamiento de sus datos</p>
          </div>
        </div>

        {/* Data card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Datos del registro</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">{consent.customer_name}</span>
            </div>
            {maskedPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-500">{maskedPhone}</span>
              </div>
            )}
            {maskedEmail && (
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-500">{maskedEmail}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">
                {new Date(consent.consented_at).toLocaleString('es-CO', {
                  dateStyle: 'long', timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={16} className="text-gray-400 shrink-0" />
              <span className="text-gray-500">
                {(consent.establishments as any)?.name} — {(consent.establishments as any)?.brands?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Consent details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Detalles del consentimiento</h2>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tratamiento de datos</span>
              <span className={`font-medium ${consent.data_processing_consent ? 'text-green-600' : 'text-red-600'}`}>
                {consent.data_processing_consent ? '✓ Autorizado' : '✗ No autorizado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Marketing y promociones</span>
              <span className={`font-medium ${consent.marketing_opt_in ? 'text-green-600' : 'text-gray-500'}`}>
                {consent.marketing_opt_in ? '✓ Autorizado' : '— No autorizado'}
              </span>
            </div>
          </div>
        </div>

        {/* Policy text */}
        {consent.consent_text && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Política aceptada</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{consent.consent_text}</p>
          </div>
        )}

        {/* Record ID */}
        <p className="text-center text-xs text-gray-400 mt-4">
          ID de registro: <span className="font-mono">{id}</span>
        </p>
        <p className="text-center text-xs text-gray-400 mt-1">
          Powered by <span className="font-semibold text-indigo-600">TurnApp</span>
        </p>
      </div>
    </div>
  )
}
