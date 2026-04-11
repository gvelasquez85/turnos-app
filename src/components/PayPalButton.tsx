'use client'
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface Props {
  moduleKey: string
  amount: number
  currency?: string
  onSuccess: (expiresAt: string) => void
  onError?: (msg: string) => void
}

export function PayPalButton({ moduleKey, amount, currency = 'USD', onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function renderButtons() {
    if (!containerRef.current || rendered.current) return
    const paypal = (window as any).paypal
    if (!paypal) return
    rendered.current = true

    paypal.Buttons({
      style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 44 },
      createOrder: async () => {
        setLoading(true); setErr('')
        const res = await fetch('/api/paypal/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleKey, amount: String(amount), currency }),
        })
        const data = await res.json()
        if (!res.ok) { setErr(data.error); setLoading(false); throw new Error(data.error) }
        return data.id
      },
      onApprove: async (data: any) => {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderID, moduleKey }),
        })
        const result = await res.json()
        setLoading(false)
        if (!res.ok) { setErr(result.error); onError?.(result.error); return }
        onSuccess(result.expiresAt)
      },
      onError: (e: any) => {
        setLoading(false)
        const msg = e?.message ?? 'Error en el pago'
        setErr(msg)
        onError?.(msg)
      },
      onCancel: () => { setLoading(false) },
    }).render(containerRef.current)
  }

  useEffect(() => {
    if (sdkReady) renderButtons()
  }, [sdkReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
        PayPal no configurado. Contacta al soporte para activar el módulo.
      </div>
    )
  }

  return (
    <>
      <Script
        src={`https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`}
        onLoad={() => setSdkReady(true)}
      />
      {err && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1 mb-2 text-center">{err}</p>
      )}
      {loading && (
        <p className="text-xs text-indigo-500 text-center mb-2">Procesando pago…</p>
      )}
      <div ref={containerRef} className={loading ? 'opacity-50 pointer-events-none' : ''} />
      {!sdkReady && (
        <div className="h-11 rounded-lg bg-blue-50 animate-pulse" />
      )}
    </>
  )
}
