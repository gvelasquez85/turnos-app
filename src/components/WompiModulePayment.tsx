'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Lock, CheckCircle, AlertTriangle, Loader2, Zap } from 'lucide-react'
import { formatCurrency, type BillingCurrency } from '@/lib/billing-cop'

function detectCardBrand(num: string): 'visa' | 'mastercard' | 'amex' | null {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]|^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return null
}

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === 'sandbox'
    ? 'https://sandbox.wompi.co/v1'
    : 'https://production.wompi.co/v1'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!

interface Props {
  moduleKey: string
  priceMonthly: number
  currency?: BillingCurrency
  /** Si true, muestra opción de cobrar con tarjeta ya registrada */
  hasStoredCard?: boolean
  onSuccess: (expiresAt: string) => void
  onCancel?: () => void
}

export function WompiModulePayment({
  moduleKey, priceMonthly, currency = 'COP', hasStoredCard = false, onSuccess, onCancel,
}: Props) {
  const [mode, setMode] = useState<'choose' | 'stored' | 'new'>(hasStoredCard ? 'choose' : 'new')

  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptance, setAcceptance] = useState<{
    acceptanceToken: string; acceptancePermalink: string
    personalDataToken: string; personalDataPermalink: string
  } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const brand = detectCardBrand(cardNumber)

  useEffect(() => {
    if (mode === 'new') {
      fetch('/api/billing/acceptance')
        .then(r => r.json())
        .then(setAcceptance)
        .catch(() => setError('No se pudo conectar con el servidor de pagos'))
    }
  }, [mode])

  async function handleStoredCard() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/billing/activate-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleKey, priceMonthly, currency, useStoredCard: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al procesar el pago')
      setSuccess(true)
      onSuccess(json.expiresAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleNewCard(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptance) return
    if (!acceptTerms) { setError('Debes aceptar los términos de Wompi para continuar'); return }
    setLoading(true); setError(null)

    try {
      const expParts = expiry.split('/')
      const expMonth = expParts[0]?.padStart(2, '0')
      const expYear = (expParts[1] ?? '').replace(/\D/g, '').slice(-2)

      const tokenRes = await fetch(`${WOMPI_BASE}/tokens/cards`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PUBLIC_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: cardNumber.replace(/\s/g, ''),
          cvc,
          exp_month: expMonth,
          exp_year: expYear,
          card_holder: cardHolder.trim(),
        }),
      })
      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok || !tokenJson.data?.id)
        throw new Error(tokenJson?.error?.messages?.[0] ?? 'Datos de tarjeta inválidos')

      const res = await fetch('/api/billing/activate-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleKey, priceMonthly, currency,
          cardToken: tokenJson.data.id,
          acceptanceToken: acceptance.acceptanceToken,
          personalDataToken: acceptance.personalDataToken,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al procesar el pago')
      setSuccess(true)
      onSuccess(json.expiresAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle size={40} className="text-green-500" />
        <p className="font-semibold text-gray-900">¡Módulo activado!</p>
        <p className="text-sm text-gray-500">El módulo queda activo hasta el próximo ciclo de facturación.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Monto */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-indigo-700 font-medium">Cobro mensual</span>
        <span className="text-lg font-black text-indigo-800">{formatCurrency(priceMonthly, currency)}/mes</span>
      </div>

      {/* Choose mode */}
      {mode === 'choose' && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleStoredCard}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Cobrar con tarjeta registrada
          </button>
          <button
            onClick={() => setMode('new')}
            className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
          >
            Usar otra tarjeta
          </button>
        </div>
      )}

      {/* New card form */}
      {mode === 'new' && (
        <form onSubmit={handleNewCard} className="flex flex-col gap-4">
          {/* Número de tarjeta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de tarjeta</label>
            <div className="relative">
              <input
                type="text" inputMode="numeric"
                value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456" maxLength={19} required
                className="w-full h-11 rounded-xl border border-gray-300 px-4 pr-16 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 select-none">
                {brand === 'visa' && <span className="text-blue-600">VISA</span>}
                {brand === 'mastercard' && <span className="text-orange-500">MC</span>}
                {brand === 'amex' && <span className="text-green-600">AMEX</span>}
                {!brand && <CreditCard size={16} className="text-gray-300" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimiento</label>
              <input
                type="text" inputMode="numeric"
                value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/AA" maxLength={5} required
                className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
              <input
                type="text" inputMode="numeric"
                value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123" maxLength={4} required
                className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre en la tarjeta</label>
            <input
              type="text"
              value={cardHolder} onChange={e => setCardHolder(e.target.value.toUpperCase())}
              placeholder="JUAN PÉREZ" required
              className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 placeholder-gray-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {acceptance && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                Acepto los{' '}
                <a href={acceptance.acceptancePermalink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  términos y condiciones
                </a>{' '}y la{' '}
                <a href={acceptance.personalDataPermalink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                  política de datos
                </a>{' '}de Wompi.
              </span>
            </label>
          )}

          <button
            type="submit" disabled={loading || !acceptance}
            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Procesando...</>
              : <><Lock size={14} /> Pagar y activar</>
            }
          </button>

          {hasStoredCard && (
            <button type="button" onClick={() => setMode('choose')}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              ← Volver
            </button>
          )}
        </form>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock size={10} /> Pago seguro vía Wompi — Tu tarjeta queda guardada para cobros automáticos
      </div>
    </div>
  )
}
