/**
 * Unified sale status constants.
 *
 * Flow from quote:   pendiente → confirmada → en_alistamiento → despachada → entregada
 * Flow manual sale:  confirmada → en_alistamiento → despachada → entregada
 *
 * SALE_COMPLETED_STATUSES: statuses that represent a committed/successful sale
 * SALE_PENDING_STATUSES: sale created but not yet confirmed/paid
 * SALE_CANCELLED_STATUSES: sale voided
 */

export const SALE_COMPLETED_STATUSES = [
  'confirmada',
  'en_alistamiento',
  'despachada',
  'entregada',
  // Legacy statuses (backwards compat)
  'facturado',
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
