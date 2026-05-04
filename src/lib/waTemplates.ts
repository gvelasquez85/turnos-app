/**
 * WhatsApp message template definitions.
 * Categories map to contexts where WA messages are sent throughout the app.
 */

export type WaCategory =
  | 'appointment_confirmation'
  | 'appointment_reminder'
  | 'appointment_cancelled'
  | 'appointment_no_show'
  | 'sale_receipt'
  | 'sale_pending_payment'
  | 'quote_sent'
  | 'quote_followup'
  | 'customer_reactivation'

export interface WaTemplateDef {
  category: WaCategory
  name: string
  description: string
  variables: string[]       // {{variable}} placeholders in the template
  defaultBody: string
  module: 'appointments' | 'sales' | 'clientes'  // which module this belongs to
  icon: string              // emoji icon for display
}

export const WA_TEMPLATE_DEFS: WaTemplateDef[] = [
  {
    category: 'appointment_confirmation',
    name: 'Confirmación de cita',
    description: 'Se envía cuando confirmas una cita pendiente',
    variables: ['nombre', 'negocio', 'fecha', 'hora', 'sucursal', 'motivo'],
    defaultBody: `Hola {{nombre}} 👋, tu cita en *{{negocio}}* ha sido *confirmada* ✅

📅 *{{fecha}}* a las *{{hora}}*
📍 {{sucursal}}

¡Te esperamos! Si necesitas reagendar, escríbenos.`,
    module: 'appointments',
    icon: '✅',
  },
  {
    category: 'appointment_reminder',
    name: 'Recordatorio de cita',
    description: 'Recordatorio enviado manualmente antes de la cita',
    variables: ['nombre', 'negocio', 'fecha', 'hora', 'sucursal'],
    defaultBody: `Hola {{nombre}} 👋, te recordamos tu cita en *{{negocio}}*

📅 *{{fecha}}* a las *{{hora}}*
📍 {{sucursal}}

¡No olvides asistir! Si necesitas cancelar, avísanos con tiempo 🙏`,
    module: 'appointments',
    icon: '⏰',
  },
  {
    category: 'appointment_cancelled',
    name: 'Cita cancelada',
    description: 'Se envía cuando se cancela una cita',
    variables: ['nombre', 'negocio', 'fecha', 'hora', 'link'],
    defaultBody: `Hola {{nombre}}, tu cita del *{{fecha}}* a las *{{hora}}* en *{{negocio}}* ha sido cancelada.

Si deseas agendar una nueva cita: {{link}}`,
    module: 'appointments',
    icon: '❌',
  },
  {
    category: 'appointment_no_show',
    name: 'No asistió a la cita',
    description: 'Para clientes que no se presentaron',
    variables: ['nombre', 'negocio', 'fecha'],
    defaultBody: `Hola {{nombre}} 👋, notamos que no pudiste asistir a tu cita del *{{fecha}}* en *{{negocio}}*.

¿Te gustaría reagendarla? Escríbenos y encontramos el mejor horario 😊`,
    module: 'appointments',
    icon: '🚫',
  },
  {
    category: 'sale_receipt',
    name: 'Comprobante de venta',
    description: 'Comprobante enviado al cliente después de una venta',
    variables: ['nombre', 'negocio', 'total', 'referencia', 'fecha'],
    defaultBody: `Hola {{nombre}} 👋, gracias por tu compra en *{{negocio}}* 🛍️

💰 Total: *{{total}}*
📋 Ref: {{referencia}}
📅 {{fecha}}

¡Fue un placer atenderte!`,
    module: 'sales',
    icon: '🧾',
  },
  {
    category: 'sale_pending_payment',
    name: 'Pago pendiente',
    description: 'Cuando una venta queda con pago pendiente',
    variables: ['nombre', 'negocio', 'total', 'vencimiento'],
    defaultBody: `Hola {{nombre}}, tu pedido en *{{negocio}}* por *{{total}}* está pendiente de pago.

Por favor realiza el pago antes del {{vencimiento}} 🙏`,
    module: 'sales',
    icon: '💳',
  },
  {
    category: 'quote_sent',
    name: 'Cotización enviada',
    description: 'Al compartir una cotización con el cliente',
    variables: ['nombre', 'negocio', 'total', 'link'],
    defaultBody: `Hola {{nombre}} 👋, te compartimos la cotización de *{{negocio}}*

💰 Total: *{{total}}*
📋 Ver cotización: {{link}}

¿Tienes preguntas? ¡Con gusto te ayudamos! 😊`,
    module: 'sales',
    icon: '📄',
  },
  {
    category: 'quote_followup',
    name: 'Seguimiento de cotización',
    description: 'Para cotizaciones sin respuesta después de 2+ días',
    variables: ['nombre', 'negocio', 'total', 'dias', 'link'],
    defaultBody: `Hola {{nombre}} 👋, hace {{dias}} día(s) te enviamos una cotización de *{{negocio}}* por *{{total}}*.

¿Pudiste revisarla? Estamos aquí para ayudarte 💪

Ver cotización: {{link}}`,
    module: 'sales',
    icon: '🔔',
  },
  {
    category: 'customer_reactivation',
    name: 'Reactivación de cliente',
    description: 'Para clientes inactivos más de 30 días',
    variables: ['nombre', 'negocio'],
    defaultBody: `Hola {{nombre}} 👋, hace tiempo que no sabemos de ti en *{{negocio}}*.

¡Te extrañamos! ¿En qué podemos ayudarte hoy? 😊`,
    module: 'clientes',
    icon: '💙',
  },
]

export const WA_TEMPLATE_BY_CATEGORY: Record<WaCategory, WaTemplateDef> =
  Object.fromEntries(WA_TEMPLATE_DEFS.map(d => [d.category, d])) as Record<WaCategory, WaTemplateDef>

/** Fill template variables and return ready-to-send WhatsApp URL */
export function buildWaMessage(
  template: string,
  vars: Record<string, string>,
  phone: string,
): string {
  let body = template
  for (const [key, val] of Object.entries(vars)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), val)
  }
  // Remove unfilled optional blocks {{#var}}...{{/var}}
  body = body.replace(/{{#\w+}}[\s\S]*?{{\/\w+}}/g, '')
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(body)}`
}

/** Module group labels for display */
export const MODULE_LABELS: Record<string, string> = {
  appointments: '📅 Citas',
  sales: '🛍️ Ventas',
  clientes: '👥 Clientes',
}
