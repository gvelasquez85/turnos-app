/**
 * Unified sale status constants.
 *
 * SALE_COMPLETED_STATUSES: statuses that represent a committed/successful sale
 * (facturado counts as sold — the client has purchased)
 *
 * SALE_PENDING_STATUSES: sale created but not yet confirmed/paid
 * SALE_CANCELLED_STATUSES: sale voided
 */

export const SALE_COMPLETED_STATUSES = [
  'facturado',
  'en_alistamiento',
  'despachado',
  'entregado',
  'completado',
  'completed',
] as const

export const SALE_PENDING_STATUSES = ['pending'] as const
export const SALE_CANCELLED_STATUSES = ['cancelled'] as const

export const SALE_COMPLETED_SET = new Set<string>(SALE_COMPLETED_STATUSES)
export const SALE_PENDING_SET   = new Set<string>(SALE_PENDING_STATUSES)

export function isSaleCompleted(status: string) {
  return SALE_COMPLETED_SET.has(status)
}

export function isSalePending(status: string) {
  return SALE_PENDING_SET.has(status)
}
