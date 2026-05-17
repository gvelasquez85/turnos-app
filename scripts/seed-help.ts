/**
 * Seed script — uploads all help center articles to Supabase.
 * Run with: npx tsx scripts/seed-help.ts
 *
 * Articles are defined in src/lib/helpContent.ts (static) and
 * also in this file's EXTRA_ARTICLES array (new articles from agents).
 * All are upserted by slug, so it's safe to run multiple times.
 */
import { createClient } from '@supabase/supabase-js'
import { HELP_ARTICLES } from '../src/lib/helpContent'
import { ARTICLES_PART2 } from './articles-part2'
import { ARTICLES_PART3 } from './articles-part3'

// ─── Extra articles (Part 1 — primeros pasos, clientes, ventas, productos) ───
const ARTICLES_PART1: any[] = [
  {
    title: 'Cómo ver las ventas que están pendientes de pago',
    slug: 'ventas-pendientes-pago',
    category: 'ventas',
    summary: 'Aprende a ver en TurnFlow cuáles ventas aún no han sido pagadas completamente.',
    tags: ['ventas', 'pendiente', 'cobro', 'cartera'],
    body: `<div class="help-article"><p class="help-intro">Las ventas pendientes de pago son dinero que ya salió de tu negocio pero que aún no ha entrado a tu bolsillo. TurnFlow te ayuda a tenerlas siempre presentes para que no se te escapen.</p><h3>Pasos</h3><ol><li><strong>Ve a la sección Ventas:</strong> En el menú izquierdo haz clic en <strong>Ventas</strong>. Verás la lista completa de ventas registradas.</li><li><strong>Filtra por estado "Pendiente":</strong> En la parte superior de la lista busca el botón <strong>Filtros</strong>. Haz clic en el filtro de estado y selecciona <strong>Pendiente</strong> o <strong>Pago parcial</strong>. La lista mostrará solo las ventas con saldo sin pagar.</li><li><strong>Lee el resumen del total por cobrar:</strong> En la parte superior verás cuántas ventas pendientes hay y cuánto suman. Por ejemplo: "8 ventas pendientes · Total por cobrar: $1.240.000".</li><li><strong>Identifica al cliente y contáctalo:</strong> Cada fila muestra el nombre del cliente, la fecha de la venta y el monto pendiente. Haz clic en la fila para ver el teléfono del cliente.</li><li><strong>Registra el pago cuando el cliente pague:</strong> Abre esa venta, haz clic en <strong>Registrar pago</strong>, elige el método de pago e ingresa el monto. La venta cambiará a estado "Pagada".</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿El Dashboard me muestra cuánto tengo pendiente de cobrar?</strong> Sí. La tarjeta "Pendientes de pago" en el Dashboard muestra el total acumulado de ventas sin pagar.</p><p><strong>¿Puedo exportar la lista de pendientes?</strong> Sí, aplica el filtro de pendientes y usa el botón Exportar para descargar la lista en Excel.</p></div></div>`,
    published: true, sort_order: 11,
  },
  {
    title: '¿Qué significa cada estado de una venta?',
    slug: 'estados-venta',
    category: 'ventas',
    summary: 'Aprende qué quiere decir cada color y etiqueta de estado que aparece en tus ventas de TurnFlow.',
    tags: ['ventas', 'estados', 'pendiente', 'pagada', 'cancelada'],
    body: `<div class="help-article"><p class="help-intro">Cada venta en TurnFlow lleva un estado que te dice en qué punto está — si ya fue pagada, si falta dinero o si se canceló.</p><h3>Los estados de una venta</h3><ol><li><strong>Pendiente (naranja):</strong> La venta fue registrada pero el cliente aún no ha pagado nada.</li><li><strong>Pago parcial (azul claro):</strong> El cliente pagó una parte del total. Falta un saldo pendiente.</li><li><strong>Pagada (verde):</strong> El cliente pagó el total completo. La venta está cerrada.</li><li><strong>Cancelada (rojo/gris):</strong> La venta fue anulada. No cuenta en tus ingresos ni descuenta el inventario.</li><li><strong>Cotización (gris/morado):</strong> Todavía no es una venta real, es solo una propuesta de precio.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Puedo cambiar el estado de una venta manualmente?</strong> Algunos estados cambian solos (registrar un pago pasa de Pendiente a Pagada). Otros como "Cancelada" requieren la acción de cancelar desde el detalle.</p></div></div>`,
    published: true, sort_order: 12,
  },
  {
    title: 'Cómo ver cuánto vendí esta semana o este mes',
    slug: 'resumen-ventas-periodo',
    category: 'ventas',
    summary: 'Aprende a consultar el total de tus ventas en cualquier período de tiempo usando los reportes de TurnFlow.',
    tags: ['ventas', 'reportes', 'semana', 'mes', 'resumen'],
    body: `<div class="help-article"><p class="help-intro">Saber cuánto vendiste esta semana o este mes te permite tomar decisiones inteligentes sobre tu negocio.</p><h3>Pasos</h3><ol><li><strong>Ve a la sección de Reportes o Ventas:</strong> En el menú izquierdo busca la opción <strong>Reportes</strong>.</li><li><strong>Selecciona el período:</strong> Verás opciones rápidas: <strong>Hoy</strong>, <strong>Esta semana</strong>, <strong>Este mes</strong>, <strong>Este año</strong>. También puedes elegir <strong>Rango personalizado</strong>.</li><li><strong>Lee el resumen de ventas:</strong> La pantalla mostrará: Total de ventas, Número de transacciones, Ticket promedio y Total de descuentos.</li><li><strong>Revisa el gráfico de tendencia:</strong> Muestra día por día cuánto vendiste dentro del período.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Los reportes incluyen las ventas canceladas?</strong> No. Los totales de ventas solo cuentan las ventas en estado "Pagada".</p><p><strong>¿Puedo descargar el reporte en Excel?</strong> Sí. Busca el botón <strong>Exportar</strong> en la pantalla de reportes.</p></div></div>`,
    published: true, sort_order: 13,
  },
  {
    title: 'Cómo enviar un recibo al cliente por WhatsApp o correo',
    slug: 'enviar-recibo-cliente',
    category: 'ventas',
    summary: 'Aprende a enviar el recibo o comprobante de una venta directamente al cliente desde TurnFlow.',
    tags: ['ventas', 'recibo', 'WhatsApp', 'correo', 'comprobante'],
    body: `<div class="help-article"><p class="help-intro">Enviar el recibo al cliente después de cada venta genera confianza y profesionalismo — y en TurnFlow lo puedes hacer en dos toques.</p><h3>Pasos</h3><ol><li><strong>Abre el detalle de la venta:</strong> Ve a <strong>Ventas</strong>, busca la venta y haz clic en ella.</li><li><strong>Busca el botón de compartir:</strong> Verás botones como <strong>Enviar por WhatsApp</strong>, <strong>Enviar por correo</strong> o <strong>Compartir recibo</strong>.</li><li><strong>Envía por WhatsApp:</strong> Haz clic en el botón de WhatsApp. Se abrirá WhatsApp con un mensaje ya redactado que incluye el resumen de la venta.</li><li><strong>Envía por correo electrónico:</strong> Haz clic en el botón de correo. TurnFlow enviará automáticamente el recibo en PDF al email del cliente.</li><li><strong>Descarga o imprime el recibo:</strong> Busca el botón <strong>Imprimir</strong> o <strong>Descargar PDF</strong> si prefieres hacerlo en físico.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿El cliente necesita tener TurnFlow para ver el recibo?</strong> No. El recibo se abre en el navegador del cliente o llega como PDF. No necesita ninguna cuenta.</p></div></div>`,
    published: true, sort_order: 14,
  },
  {
    title: 'Cómo ver el ticket promedio de mis ventas',
    slug: 'ticket-promedio-ventas',
    category: 'ventas',
    summary: 'Aprende qué es el ticket promedio y cómo consultarlo en TurnFlow para medir el valor de cada venta.',
    tags: ['ventas', 'ticket promedio', 'métricas', 'reportes'],
    body: `<div class="help-article"><p class="help-intro">El ticket promedio te dice cuánto gasta en promedio cada cliente cuando te compra. Es la división simple entre el total de dinero que entraste y el número de ventas.</p><h3>Pasos</h3><ol><li><strong>Ve a Reportes o al Dashboard.</strong></li><li><strong>Selecciona el período</strong> que quieres analizar.</li><li><strong>Busca la tarjeta "Ticket promedio"</strong> entre las métricas del reporte.</li><li><strong>Interpreta el número:</strong> Si es bajo, considera combinar productos u ofrecer servicios adicionales. Si está bien, busca mantener ese nivel.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Las ventas canceladas afectan el ticket promedio?</strong> No. El cálculo solo usa ventas en estado "Pagada".</p></div></div>`,
    published: true, sort_order: 15,
  },
  {
    title: 'Cómo crear un producto nuevo',
    slug: 'crear-producto-nuevo',
    category: 'ventas',
    summary: 'Aprende a agregar un producto a tu catálogo de TurnFlow con nombre, precio e inventario.',
    tags: ['productos', 'inventario', 'catálogo', 'crear'],
    body: `<div class="help-article"><p class="help-intro">Tener tus productos cargados en TurnFlow te permite registrar ventas más rápido, controlar el inventario y saber qué se vende más.</p><h3>Pasos</h3><ol><li><strong>Ve a la sección Productos:</strong> En el menú izquierdo haz clic en <strong>Productos</strong> o <strong>Inventario</strong>.</li><li><strong>Haz clic en "+ Nuevo producto":</strong> Botón verde o azul en la esquina superior derecha.</li><li><strong>Ingresa el nombre del producto:</strong> Sé específico. En vez de "Shampoo", escribe "Shampoo Sedal Rizos 350ml".</li><li><strong>Escribe el precio de venta:</strong> Solo el número, sin $. Ejemplo: 35000.</li><li><strong>Agrega el stock inicial:</strong> Cuántas unidades tienes disponibles ahora.</li><li><strong>Selecciona la categoría</strong> y haz clic en <strong>Guardar producto</strong>.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Puedo agregar una foto al producto?</strong> Sí. Busca el campo de imagen en el formulario y sube una foto clara.</p><p><strong>¿Puedo agregar el costo del producto?</strong> Sí. Con ese dato TurnFlow puede calcular tu ganancia (margen de utilidad).</p></div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo crear un servicio nuevo',
    slug: 'crear-servicio-nuevo',
    category: 'ventas',
    summary: 'Aprende a crear un servicio en TurnFlow y entiende en qué se diferencia de un producto.',
    tags: ['productos', 'servicios', 'catálogo', 'crear'],
    body: `<div class="help-article"><p class="help-intro">Si tu negocio ofrece servicios (cortes, consultas, reparaciones), puedes crearlos en TurnFlow igual que los productos para incluirlos en cada venta.</p><h3>Diferencia clave</h3><p>Un <strong>producto</strong> tiene inventario (puedes quedarte sin existencias). Un <strong>servicio</strong> no tiene stock (un corte de cabello, una clase de yoga).</p><h3>Pasos</h3><ol><li><strong>Ve a Productos</strong> y haz clic en <strong>+ Nuevo producto</strong>.</li><li><strong>Selecciona el tipo "Servicio"</strong> en la parte superior del formulario.</li><li><strong>Ingresa el nombre y precio del servicio.</strong> Sé descriptivo: "Corte de cabello para hombre", "Manicure sencilla".</li><li><strong>Guarda.</strong> El servicio ya aparecerá en el buscador al registrar ventas.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Los servicios aparecen mezclados con los productos en el buscador de ventas?</strong> Sí, en la misma lista con un ícono o etiqueta que los identifica como "Servicio".</p></div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo organizar mis productos por categoría',
    slug: 'organizar-productos-categoria',
    category: 'ventas',
    summary: 'Aprende a crear categorías en TurnFlow para agrupar tus productos y encontrarlos más rápido.',
    tags: ['productos', 'categorías', 'organización'],
    body: `<div class="help-article"><p class="help-intro">Las categorías organizan tu catálogo — como ordenar un almacén. Todo en su lugar y mucho más fácil de encontrar.</p><h3>Pasos</h3><ol><li><strong>Ve a Productos</strong> y busca la opción <strong>Categorías</strong> o <strong>Gestionar categorías</strong>.</li><li><strong>Haz clic en "+ Nueva categoría"</strong> y escribe el nombre (ej. "Cuidado del cabello").</li><li><strong>Guarda y repite</strong> para cada categoría que necesites.</li><li><strong>Asigna los productos a su categoría:</strong> Edita cada producto y selecciona la categoría correcta.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Puedo renombrar o eliminar una categoría?</strong> Sí. En la gestión de categorías, haz clic en la categoría y busca las opciones de editar o eliminar.</p></div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo actualizar el precio de un producto',
    slug: 'actualizar-precio-producto',
    category: 'ventas',
    summary: 'Aprende a cambiar el precio de un producto en TurnFlow de forma rápida cuando tus costos cambian.',
    tags: ['productos', 'precio', 'actualizar'],
    body: `<div class="help-article"><p class="help-intro">Cuando el proveedor te sube el costo o ajustas tu tarifa, actualizar el precio en TurnFlow garantiza que todas tus ventas futuras usen el precio correcto.</p><h3>Pasos</h3><ol><li><strong>Ve a Productos</strong> y busca el producto.</li><li><strong>Haz clic en él</strong> para abrir la ficha y luego en <strong>Editar</strong>.</li><li><strong>Cambia el precio</strong> en el campo "Precio de venta". Escribe solo el número.</li><li><strong>Haz clic en Guardar cambios.</strong></li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Las ventas anteriores cambian de precio también?</strong> No. El precio de las ventas ya registradas queda fijo. Solo las ventas nuevas usan el precio actualizado.</p></div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo actualizar el stock (inventario) de un producto',
    slug: 'actualizar-stock-producto',
    category: 'ventas',
    summary: 'Aprende a actualizar la cantidad disponible de un producto cuando recibes mercancía nueva.',
    tags: ['productos', 'stock', 'inventario', 'actualizar'],
    body: `<div class="help-article"><p class="help-intro">El stock es la cantidad de unidades disponibles de cada producto. Mantenerlo actualizado evita vender algo que ya no tienes.</p><h3>Pasos</h3><ol><li><strong>Ve a Productos</strong> y abre el producto.</li><li><strong>Haz clic en Editar</strong> o busca la opción <strong>Ajustar inventario</strong> / <strong>Entrada de mercancía</strong>.</li><li><strong>Actualiza la cantidad:</strong> Si usas edición general, escribe el total actual. Si usas "Entrada de mercancía", escribe solo lo que llegó.</li><li><strong>Guarda el cambio.</strong></li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿TurnFlow me avisa cuando el stock llega a cero?</strong> Sí, si tienes activadas las alertas de stock bajo.</p></div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo activar alertas cuando el stock está bajo',
    slug: 'alerta-stock-bajo',
    category: 'ventas',
    summary: 'Aprende a configurar TurnFlow para que te avise cuando un producto está a punto de agotarse.',
    tags: ['productos', 'stock', 'alertas', 'inventario'],
    body: `<div class="help-article"><p class="help-intro">Con las alertas de stock bajo, TurnFlow te avisa cuando un producto está por agotarse para que puedas pedirle al proveedor a tiempo.</p><h3>Pasos</h3><ol><li><strong>Abre el producto</strong> y haz clic en <strong>Editar</strong>.</li><li><strong>Busca el campo "Stock mínimo"</strong> o "Alerta cuando queden menos de".</li><li><strong>Ingresa el número de alerta.</strong> Ejemplo: 5 unidades.</li><li><strong>Guarda.</strong> Cuando el stock llegue a ese número, verás una alerta en el Dashboard.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Qué pasa si no configuro el stock mínimo?</strong> El sistema no te avisará y el stock puede llegar a cero sin que te des cuenta.</p></div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo desactivar un producto sin borrarlo',
    slug: 'desactivar-producto',
    category: 'ventas',
    summary: 'Aprende a ocultar un producto del catálogo sin eliminar su historial ni sus datos.',
    tags: ['productos', 'desactivar', 'ocultar', 'inventario'],
    body: `<div class="help-article"><p class="help-intro">Si un producto ya no lo vendes temporalmente pero no quieres perder su información, puedes desactivarlo.</p><h3>Pasos</h3><ol><li><strong>Ve a Productos</strong> y abre el producto.</li><li><strong>Haz clic en Editar.</strong></li><li><strong>Busca el interruptor "Activo"</strong> y desactívalo. Cambia de verde a gris.</li><li><strong>Guarda.</strong> El producto deja de aparecer en las búsquedas de ventas nuevas.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Es mejor desactivar o borrar definitivamente un producto?</strong> Siempre es mejor desactivar. Borrar puede causar problemas en el historial de ventas.</p></div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo ver qué productos se venden más',
    slug: 'productos-mas-vendidos',
    category: 'ventas',
    summary: 'Aprende a consultar el reporte de productos más vendidos en TurnFlow.',
    tags: ['productos', 'reportes', 'más vendidos', 'estadísticas'],
    body: `<div class="help-article"><p class="help-intro">Saber qué productos se venden más te ayuda a tener siempre suficiente stock de lo popular y dejar de invertir en lo que nadie compra.</p><h3>Pasos</h3><ol><li><strong>Ve a Reportes</strong> en el menú.</li><li><strong>Busca "Productos más vendidos"</strong> o "Top productos".</li><li><strong>Selecciona el período de análisis.</strong></li><li><strong>Lee el ranking:</strong> Verás la lista del más vendido al menos vendido con unidades vendidas y dinero generado.</li></ol><div class="help-faq"><h3>Preguntas frecuentes</h3><p><strong>¿Puedo descargar este reporte en Excel?</strong> Sí. Usa el botón <strong>Exportar</strong> en la pantalla del reporte.</p></div></div>`,
    published: true, sort_order: 8,
  },
]

// ─── All extra articles combined ──────────────────────────────────────────────
const EXTRA_ARTICLES: any[] = [
  ...ARTICLES_PART1,
  ...ARTICLES_PART2,
  ...ARTICLES_PART3,
]

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error('❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const allArticles = [
    ...HELP_ARTICLES.map(a => ({
      title:      a.title,
      slug:       a.slug,
      category:   a.category,
      summary:    a.summary,
      body:       a.body,
      tags:       a.tags,
      published:  true,
      sort_order: 0,
    })),
    ...EXTRA_ARTICLES.map(a => ({
      title:      a.title,
      slug:       a.slug,
      category:   a.category,
      summary:    a.summary,
      body:       a.body,
      tags:       a.tags ?? [],
      published:  a.published ?? true,
      sort_order: a.sort_order ?? 0,
    })),
  ]

  // Deduplicate by slug (last one wins)
  const bySlug = new Map<string, any>()
  for (const a of allArticles) bySlug.set(a.slug, a)
  const unique = Array.from(bySlug.values())

  console.log(`📚  Seeding ${unique.length} articles...`)

  // Upsert in batches of 20
  const BATCH = 20
  let inserted = 0
  let errors   = 0

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)
    const { error } = await supabase
      .from('help_articles')
      .upsert(batch, { onConflict: 'slug' })

    if (error) {
      console.error(`❌  Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
      errors++
    } else {
      inserted += batch.length
      console.log(`✅  ${inserted}/${unique.length} articles upserted`)
    }
  }

  console.log(`\n🎉  Done! ${inserted} articles seeded, ${errors} batch errors.`)
}

main().catch(err => { console.error(err); process.exit(1) })
