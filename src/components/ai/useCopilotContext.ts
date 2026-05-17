'use client'

import { useEffect } from 'react'
import { setCopilotContext, type CopilotContext } from './AICopilot'

/**
 * Call this hook from any page/dashboard to push context to the Copilot widget.
 * The widget lives in the layout, so it receives the context via the singleton setter.
 *
 * @example
 * useCopilotContext({
 *   moduleKey: 'ventas',
 *   moduleLabel: 'Ventas',
 *   data: { ventasHoy: 45, ticketPromedio: 32000, topProductos: [...] }
 * })
 */
export function useCopilotContext(ctx: CopilotContext) {
  useEffect(() => {
    setCopilotContext(ctx)
    // Clear context on unmount so stale data doesn't linger
    return () => setCopilotContext({ moduleKey: 'home', moduleLabel: 'Dashboard', data: {} })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ctx.data)])
}
