'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, fromCents, type BillingCurrency } from '@/lib/billing-cop'

interface Props {
  /** Monto a cobrar en centavos */
  amountCents: number
  currency?: BillingCurrency
  onSuccess: (nextBillingAt: string) => void
  onCancel?: () => void
  /** Asientos deseados — si el usuario cambió el cart antes de registrar tarjeta */
  newEst?: number
  newAdv?: number
}

// ─── Detectar marca de tarjeta ─────────────────────────────────────────────────
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

export function WompiCardForm({ amountCents, currency = 'COP', onSuccess, onCancel, newEst, newAdv }: Props) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [acceptance, setAcceptance] = useState<{
    acceptanceToken: string
    acceptancePermalink: string
    personalDataToken: string
    personalDataPermalink: string
  } | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const brand = detectCardBrand(cardNumber)
  const amount = fromCents(amountCents)

  // Cargar tokens de aceptación al montar
  useEffect(() => {
    fetch('/api/billing/acceptance')
      .then(r => r.json())
      .then(setAcceptance)
      .catch(() => setError('No se pudo conectar con el servidor de pagos'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!acceptance) return
    if (!acceptTerms) { setError('Debes aceptar los términos de Wompi para continuar'); return }

    setLoading(true)
    setError(null)

    try {
      // 1. Tokenizar la tarjeta directamente en Wompi (client-side, usa llave pública)
      const expParts = expiry.split('/')
      const expMonth = expParts[0]?.padStart(2, '0')
      const expYear = expParts[1]?.length === 2 ? '20' + expParts[1] : expParts[1]

      const tokenRes = await fetch(`${WOMPI_BASE}/tokens/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PUBLIC_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cardNumber.replace(/\s/g, ''),
          cvc,
          exp_month: expMonth,
          exp_year: expYear,
          card_holder: cardHolder.trim(),
        }),
      })

      const tokenJson = await tokenRes.json()
      if (!tokenRes.ok || !tokenJson.data?.id) {
        const msg = tokenJson?.error?.messages?.join(', ') ?? 'Datos de tarjeta inválidos'
        throw new Error(msg)
      }

      const cardToken: string = tokenJson.data.id

      // 2. Enviar al backend para crear fuente de pago + cobrar
      const setupRes = await fetch('/api/billing/setup-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardToken,
          acceptanceToken: acceptance.acceptanceToken,
          personalDataToken: acceptance.personalDataToken,
          currency,
          ...(newEst ? { newEst } : {}),
          ...(newAdv ? { newAdv } : {}),
        }),
      })

      const setupJson = await setupRes.json()
      if (!setupRes.ok) throw new Error(setupJson.error ?? 'Error al procesar el pago')

      setSuccess(true)
      onSuccess(setupJson.nextBillingAt)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle size={40} className="text-green-500" />
        <p className="font-semibold text-gray-900">¡Suscripción activada!</p>
        <p className="text-sm text-gray-500">Tu tarjeta quedó guardada para cobros automáticos.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Monto a cobrar */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-indigo-700 font-medium">Cobro inmediato</span>
        <span className="text-lg font-black text-indigo-800">{formatCurrency(amount, currency)}/mes</span>
      </div>

      {/* Número de tarjeta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Número de tarjeta</label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            required
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

      {/* Vencimiento + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimiento</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={e => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            maxLength={5}
            required
            className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
          <input
            type="text"
            inputMode="numeric"
            value={cvc}
            onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            maxLength={4}
            required
            className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Titular */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre en la tarjeta</label>
        <input
          type="text"
          value={cardHolder}
          onChange={e => setCardHolder(e.target.value.toUpperCase())}
          placeholder="JUAN PÉREZ"
          required
          className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm font-mono text-gray-900 placeholder-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Aceptación T&C Wompi */}
      {acceptance && (
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={e => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Acepto los{' '}
            <a href={acceptance.acceptancePermalink} target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 underline">
              términos y condiciones
            </a>
            {' '}y la{' '}
            <a href={acceptance.personalDataPermalink} target="_blank" rel="noopener noreferrer"
              className="text-indigo-600 underline">
              política de tratamiento de datos
            </a>
            {' '}de Wompi.
          </span>
        </label>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botones */}
      <Button
        type="submit"
        disabled={loading || !acceptance || !acceptTerms}
        className="w-full"
      >
        {loading
          ? <><Loader2 size={15} className="mr-2 animate-spin" /> Procesando...</>
          : <><Lock size={14} className="mr-2" /> Guardar tarjeta y pagar {formatCurrency(amount, currency)}</>
        }
      </Button>

      {onCancel && (
        <button type="button" onClick={onCancel}
          className="text-sm text-gray-400 hover:text-gray-600 text-center w-full py-1">
          Cancelar
        </button>
      )}

      <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
        <Lock size={10} /> Pago seguro procesado por{' '}
        <a href="https://wompi.co" target="_blank" rel="noopener noreferrer"
          className="font-semibold text-gray-500 hover:text-gray-700">Wompi</a>
        {' '}· Visa · Mastercard
      </p>
    </form>
  )
}
