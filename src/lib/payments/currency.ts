import type { Currency } from './types'

export function formatMoney(amount: number, currency: Currency): string {
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function convertUSDtoCOP(amountUSD: number, rate: number = 4200): number {
  return Math.round(amountUSD * rate)
}

/** Returns dual string: "$15.00 USD · $63,000 COP" */
export function formatDual(amountUSD: number, copRate: number): string {
  const cop = convertUSDtoCOP(amountUSD, copRate)
  return `${formatMoney(amountUSD, 'USD')} · ${formatMoney(cop, 'COP')}`
}
