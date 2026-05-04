-- Phase 33: WhatsApp message templates per brand
-- Run in Supabase SQL editor

-- Template categories match the modules that generate WA messages
CREATE TYPE wa_template_category AS ENUM (
  'appointment_confirmation',   -- Cita confirmada por el negocio
  'appointment_reminder',       -- Recordatorio de cita (1 día antes)
  'appointment_cancelled',      -- Cita cancelada
  'appointment_no_show',        -- No asistió
  'sale_receipt',               -- Comprobante de venta
  'sale_pending_payment',       -- Venta con pago pendiente
  'quote_sent',                 -- Cotización enviada al cliente
  'quote_followup',             -- Seguimiento de cotización sin respuesta
  'customer_reactivation'       -- Cliente inactivo > 30 días
);

CREATE TABLE IF NOT EXISTS wa_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category        wa_template_category NOT NULL,
  name            VARCHAR(100) NOT NULL,        -- friendly name e.g. "Recordatorio de cita"
  body            TEXT NOT NULL,                -- template text with {{variables}}
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, category)
);

ALTER TABLE wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand users can read wa_templates"
  ON wa_templates FOR SELECT
  USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "brand admins can write wa_templates"
  ON wa_templates FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM profiles WHERE id = auth.uid()
    AND role IN ('brand_admin', 'manager', 'superadmin')
  ));

-- Default system templates (global reference, not per-brand — brand overrides via wa_templates)
-- These are the fallback messages when a brand hasn't customized their template
CREATE TABLE IF NOT EXISTS wa_default_templates (
  category    wa_template_category PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  body        TEXT NOT NULL,
  variables   TEXT[] NOT NULL DEFAULT '{}',  -- list of {{variable}} names
  description TEXT
);

INSERT INTO wa_default_templates (category, name, body, variables, description) VALUES
(
  'appointment_confirmation',
  'Confirmación de cita',
  'Hola {{nombre}} 👋, tu cita en *{{negocio}}* ha sido *confirmada* ✅

📅 *{{fecha}}* a las *{{hora}}*
📍 {{sucursal}}
{{#motivo}}🔖 Motivo: {{motivo}}{{/motivo}}

¡Te esperamos! Si necesitas reagendar, escríbenos.',
  ARRAY['nombre','negocio','fecha','hora','sucursal','motivo'],
  'Se envía cuando el asesor confirma una cita pendiente'
),
(
  'appointment_reminder',
  'Recordatorio de cita',
  'Hola {{nombre}} 👋, te recordamos tu cita mañana en *{{negocio}}*

📅 *{{fecha}}* a las *{{hora}}*
📍 {{sucursal}}

¡No olvides asistir! Si necesitas cancelar, avísanos con tiempo 🙏',
  ARRAY['nombre','negocio','fecha','hora','sucursal'],
  'Recordatorio enviado 1 día antes de la cita'
),
(
  'appointment_cancelled',
  'Cita cancelada',
  'Hola {{nombre}}, tu cita del *{{fecha}}* a las *{{hora}}* en *{{negocio}}* ha sido cancelada.

Si deseas agendar una nueva cita, puedes hacerlo en: {{link}}',
  ARRAY['nombre','negocio','fecha','hora','link'],
  'Se envía cuando se cancela una cita'
),
(
  'appointment_no_show',
  'No asistió a la cita',
  'Hola {{nombre}} 👋, notamos que no pudiste asistir a tu cita del *{{fecha}}*.

¿Te gustaría reagendarla? Escríbenos para encontrar el mejor horario para ti 😊',
  ARRAY['nombre','negocio','fecha'],
  'Se envía cuando el cliente no se presentó'
),
(
  'sale_receipt',
  'Comprobante de venta',
  'Hola {{nombre}} 👋, gracias por tu compra en *{{negocio}}* 🛍️

💰 Total: *{{total}}*
📋 Ref: {{referencia}}
📅 {{fecha}}

¡Fue un placer atenderte!',
  ARRAY['nombre','negocio','total','referencia','fecha'],
  'Comprobante enviado después de una venta'
),
(
  'sale_pending_payment',
  'Pago pendiente',
  'Hola {{nombre}}, tu pedido en *{{negocio}}* por *{{total}}* está pendiente de pago.

Por favor realiza el pago antes del {{vencimiento}} para no perder tu reserva. ¡Gracias! 🙏',
  ARRAY['nombre','negocio','total','vencimiento'],
  'Se envía cuando una venta queda en estado de pago pendiente'
),
(
  'quote_sent',
  'Cotización enviada',
  'Hola {{nombre}} 👋, te compartimos la cotización de *{{negocio}}*

💰 Total: *{{total}}*
📋 Ver cotización: {{link}}

¿Tienes alguna pregunta? Escríbenos y con gusto te ayudamos 😊',
  ARRAY['nombre','negocio','total','link'],
  'Se envía cuando se comparte una cotización con el cliente'
),
(
  'quote_followup',
  'Seguimiento de cotización',
  'Hola {{nombre}} 👋, hace {{dias}} día(s) te enviamos una cotización de *{{negocio}}* por *{{total}}*.

¿Pudiste revisarla? Estamos para ayudarte a tomar la mejor decisión 💪

Ver cotización: {{link}}',
  ARRAY['nombre','negocio','total','dias','link'],
  'Seguimiento cuando la cotización no ha sido respondida'
),
(
  'customer_reactivation',
  'Reactivación de cliente',
  'Hola {{nombre}} 👋, hace tiempo que no sabemos de ti en *{{negocio}}*.

¡Te extrañamos! ¿En qué podemos ayudarte hoy? Escríbenos o visítanos. 😊',
  ARRAY['nombre','negocio'],
  'Para clientes inactivos más de 30 días'
)
ON CONFLICT (category) DO NOTHING;
