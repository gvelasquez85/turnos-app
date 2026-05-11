-- Migration: Help Articles (Knowledge Base)
-- Created: 2026-05-10

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  body TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_help_views_article ON help_article_views(article_id);
CREATE INDEX idx_help_views_date ON help_article_views(created_at);

CREATE TABLE IF NOT EXISTS help_article_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_help_ratings_article ON help_article_ratings(article_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_ratings ENABLE ROW LEVEL SECURITY;

-- help_articles: public SELECT for published articles
CREATE POLICY "help_articles_public_select"
  ON help_articles FOR SELECT
  USING (published = true);

-- help_articles: full access for superadmin
CREATE POLICY "help_articles_superadmin_all"
  ON help_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'superadmin'
    )
  );

-- help_article_views: public INSERT (anyone can log a view)
CREATE POLICY "help_article_views_public_insert"
  ON help_article_views FOR INSERT
  WITH CHECK (true);

-- help_article_views: superadmin SELECT
CREATE POLICY "help_article_views_superadmin_select"
  ON help_article_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'superadmin'
    )
  );

-- help_article_ratings: public INSERT
CREATE POLICY "help_article_ratings_public_insert"
  ON help_article_ratings FOR INSERT
  WITH CHECK (true);

-- help_article_ratings: superadmin SELECT
CREATE POLICY "help_article_ratings_superadmin_select"
  ON help_article_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'superadmin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO help_articles (slug, title, category, summary, tags, body, published, sort_order) VALUES

-- 1. crear-cuenta
('crear-cuenta', 'Como crear tu cuenta en TurnFlow', 'primeros-pasos',
 'Registrate gratis y configura tu negocio en menos de 5 minutos.',
 ARRAY['registro','cuenta','crear','inicio','onboarding'],
 $$
<h2>Crear tu cuenta</h2>
<ol>
<li>Ve a <strong>app.turnflow.com.co/register</strong></li>
<li>Ingresa tu <strong>nombre completo</strong>, <strong>correo electronico</strong> y una <strong>contrasena segura</strong></li>
<li>Tambien puedes registrarte con <strong>Google</strong> o <strong>Outlook</strong> para un acceso mas rapido</li>
<li>Revisa tu correo y haz clic en el enlace de <strong>activacion</strong></li>
<li>Completa el <strong>asistente de configuracion</strong>: nombre de tu negocio, tipo de negocio (belleza, restaurante, tienda, etc.) y logo</li>
</ol>

<div class="tip">
<strong>Consejo:</strong> Elige bien el tipo de negocio — TurnFlow personaliza las opciones de servicios, intereses de clientes y plantillas de WhatsApp segun tu vertical.
</div>

<h2>Que incluye el plan gratuito</h2>
<ul>
<li><strong>Clientes ilimitados</strong> — CRM completo con historial, tags y seguimiento</li>
<li><strong>Ventas y cotizaciones</strong> — Crea, envia y da seguimiento</li>
<li><strong>Inventario basico</strong> — Control de productos y stock</li>
<li><strong>Mensajes de WhatsApp</strong> — Plantillas personalizables</li>
</ul>
$$, true, 1),

-- 2. configurar-marca
('configurar-marca', 'Configurar tu marca y logo', 'primeros-pasos',
 'Personaliza los colores, logo y datos de tu negocio.',
 ARRAY['marca','logo','colores','configuracion','brand'],
 $$
<h2>Personaliza tu marca</h2>
<ol>
<li>Ve a <strong>Configuracion → Marca</strong> en el menu lateral</li>
<li>Sube tu <strong>logo</strong> (se recomienda PNG transparente de al menos 200x200px)</li>
<li>Selecciona tu <strong>color primario</strong> — se aplica automaticamente a cotizaciones, emails y toda la interfaz</li>
<li>Completa los datos de tu negocio: <strong>nombre, direccion, telefono, email, sitio web y NIT</strong></li>
<li>Haz clic en <strong>Guardar cambios</strong></li>
</ol>

<div class="tip">
<strong>Donde se usa tu marca:</strong> Los emails a clientes, las cotizaciones en PDF, la pagina publica de tu negocio y las previsualizaciones de WhatsApp usan automaticamente tu logo y colores.
</div>
$$, true, 2),

-- 3. instalar-app
('instalar-app', 'Instalar TurnFlow como app en tu celular', 'primeros-pasos',
 'Agrega TurnFlow a tu pantalla de inicio para acceso rapido.',
 ARRAY['instalar','pwa','celular','movil','app','pantalla inicio'],
 $$
<h2>iPhone / iPad (Safari o cualquier navegador)</h2>
<ol>
<li>Abre <strong>app.turnflow.com.co</strong> en tu navegador</li>
<li>Toca el boton de <strong>Compartir</strong> (cuadrado con flecha hacia arriba)</li>
<li>Busca y toca <strong>"Agregar al escritorio"</strong></li>
<li>Confirma con <strong>"Agregar"</strong></li>
</ol>

<h2>Android (Chrome)</h2>
<ol>
<li>Abre <strong>app.turnflow.com.co</strong> en Chrome</li>
<li>Toca los <strong>3 puntos</strong> en la esquina superior derecha</li>
<li>Selecciona <strong>"Instalar aplicacion"</strong> o <strong>"Agregar a pantalla de inicio"</strong></li>
<li>Confirma la instalacion</li>
</ol>

<div class="tip">
<strong>Ventaja:</strong> La app instalada abre en pantalla completa, sin barra de navegador, y funciona incluso con conexion lenta gracias al cache inteligente.
</div>
$$, true, 3),

-- 4. navegacion-general
('navegacion-general', 'Navegacion general de la plataforma', 'primeros-pasos',
 'Conoce las secciones principales y como moverte en TurnFlow.',
 ARRAY['navegacion','menu','sidebar','secciones','dashboard'],
 $$
<h2>Menu lateral</h2>
<p>El menu lateral izquierdo es tu centro de navegacion. Se organiza en:</p>
<ul>
<li><strong>Inicio</strong> — Dashboard con resumen del dia: ventas, cumpleanos, citas proximas</li>
<li><strong>Clientes</strong> — Tu base de clientes con perfil, historial y tags</li>
<li><strong>Ventas</strong> — Ventas del dia, cotizaciones, inventario y nueva venta</li>
<li><strong>Modulos activos</strong> — Citas, encuestas, menu y otros modulos que hayas activado</li>
<li><strong>Marketplace</strong> — Descubre y activa modulos adicionales</li>
<li><strong>Configuracion</strong> — Marca, usuarios, sucursales y ajustes</li>
</ul>

<h2>Perfil de usuario</h2>
<p>En la esquina superior derecha encontraras tu perfil con opciones de <strong>modo oscuro</strong>, <strong>configuracion personal</strong> y <strong>cerrar sesion</strong>.</p>

<h2>En movil</h2>
<p>En pantallas pequenas, el menu se oculta automaticamente. Toca el icono de <strong>hamburguesa</strong> (tres lineas) en la esquina superior izquierda para abrirlo.</p>
$$, true, 4),

-- 5. agregar-cliente
('agregar-cliente', 'Agregar un nuevo cliente', 'clientes',
 'Registra clientes manualmente o con carga masiva.',
 ARRAY['cliente','agregar','nuevo','crear','registrar'],
 $$
<h2>Agregar cliente manualmente</h2>
<ol>
<li>Ve a <strong>Clientes</strong> en el menu lateral</li>
<li>Haz clic en <strong>"+ Nuevo cliente"</strong></li>
<li>Completa los datos: <strong>nombre</strong> (obligatorio), <strong>telefono</strong>, <strong>email</strong>, <strong>canal de contacto</strong>, <strong>cumpleanos</strong></li>
<li>Selecciona <strong>servicios de interes</strong> de la lista predefinida o agrega intereses personalizados</li>
<li>Haz clic en <strong>Guardar</strong></li>
</ol>

<h2>Carga masiva de clientes</h2>
<ol>
<li>En la pantalla de Clientes, haz clic en <strong>"Carga masiva"</strong></li>
<li>Descarga la <strong>plantilla CSV</strong> con las columnas correctas</li>
<li>Llena la plantilla en Excel o Google Sheets con los datos de tus clientes</li>
<li>Guarda como <strong>CSV</strong> y sube el archivo</li>
<li>Revisa la previsualizacion y confirma la importacion</li>
</ol>

<div class="tip">
<strong>Columnas de la plantilla:</strong> nombre, telefono, email, canal_contacto, cumpleanos (YYYY-MM-DD), intereses (separados por punto y coma)
</div>
$$, true, 5),

-- 6. perfil-cliente
('perfil-cliente', 'Perfil del cliente: historial, tags y notas', 'clientes',
 'Toda la informacion de tu cliente en un solo lugar.',
 ARRAY['perfil','historial','tags','notas','cliente','seguimiento'],
 $$
<h2>Ver el perfil de un cliente</h2>
<p>Haz clic en cualquier cliente de la lista para abrir su panel lateral con:</p>

<h3>Datos de contacto</h3>
<p>Nombre, telefono, email, canal preferido de contacto y cumpleanos.</p>

<h3>Tags automaticos</h3>
<p>TurnFlow asigna automaticamente tags segun el comportamiento del cliente:</p>
<ul>
<li><strong>Cliente nuevo</strong> — Primera visita reciente</li>
<li><strong>Cliente frecuente</strong> — Multiples visitas/compras</li>
<li><strong>Cliente inactivo</strong> — Mas de 30 dias sin actividad</li>
<li><strong>Premium</strong> — Asignable manualmente</li>
</ul>

<h3>Historial de actividad</h3>
<p>En la pestana <strong>"Historial"</strong> veras una linea de tiempo con:</p>
<ul>
<li>Compras realizadas con monto</li>
<li>Cotizaciones enviadas y su estado</li>
<li>Citas (si el modulo esta activo)</li>
<li>Turnos atendidos</li>
<li>Cambios de estado en ventas/cotizaciones</li>
</ul>

<h3>Notas</h3>
<p>En la pestana <strong>"Notas"</strong> puedes agregar anotaciones rapidas sobre el cliente. Cada nota queda registrada con fecha.</p>

<h3>Servicios de interes</h3>
<p>Selecciona los servicios que le interesan al cliente de la lista predefinida segun tu tipo de negocio, o agrega intereses personalizados escribiendo en el campo de texto.</p>
$$, true, 6),

-- 7. buscar-filtrar-clientes
('buscar-filtrar-clientes', 'Buscar y filtrar clientes', 'clientes',
 'Encuentra rapidamente a cualquier cliente por nombre, telefono o tag.',
 ARRAY['buscar','filtrar','cliente','search','encontrar'],
 $$
<h2>Buscador</h2>
<p>En la parte superior de la lista de clientes hay un <strong>buscador</strong> que filtra en tiempo real por:</p>
<ul>
<li>Nombre del cliente</li>
<li>Numero de telefono</li>
<li>Email</li>
</ul>

<h2>Ordenar la lista</h2>
<p>La lista se ordena alfabeticamente por defecto. Los clientes con actividad reciente aparecen primero si hay filtros de fecha activos.</p>

<div class="tip">
<strong>Consejo:</strong> Desde el dashboard de inicio puedes ver los <strong>clientes inactivos</strong> (sin actividad por mas de 30 dias) y los <strong>cumpleanos proximos</strong> para tomar accion rapida.
</div>
$$, true, 7),

-- 8. crear-venta
('crear-venta', 'Crear una nueva venta', 'ventas',
 'Registra una venta manual con productos de tu inventario.',
 ARRAY['venta','crear','nueva','registrar','facturar'],
 $$
<h2>Crear una venta</h2>
<ol>
<li>Ve a <strong>Ventas</strong> en el menu lateral</li>
<li>Haz clic en <strong>"+ Nueva venta"</strong></li>
<li>Selecciona el <strong>tipo</strong>: Venta directa o Cotizacion</li>
<li>Selecciona un <strong>cliente</strong> (opcional pero recomendado para llevar historial)</li>
<li>Agrega <strong>productos</strong> buscandolos por nombre o SKU</li>
<li>Ajusta <strong>cantidades</strong> y aplica <strong>descuento</strong> si aplica</li>
<li>Agrega <strong>notas</strong> opcionales</li>
<li>Haz clic en <strong>"Registrar venta"</strong></li>
</ol>

<h2>Flujo de estados de una venta</h2>
<p>Cada venta sigue un flujo claro:</p>

<h3>Venta desde cotizacion:</h3>
<p><strong>Pendiente</strong> → <strong>Confirmada</strong> → <strong>En alistamiento</strong> → <strong>Despachada</strong> → <strong>Entregada</strong></p>

<h3>Venta directa (manual):</h3>
<p><strong>Confirmada</strong> → <strong>En alistamiento</strong> → <strong>Despachada</strong> → <strong>Entregada</strong></p>
<p>(Las ventas directas arrancan ya confirmadas porque se crean en el punto de venta)</p>

<div class="tip">
<strong>Confirmar venta:</strong> Cuando una venta esta pendiente (viene de una cotizacion), veras un boton prominente <strong>"Confirmar venta"</strong> para avanzarla al siguiente estado.
</div>
$$, true, 8),

-- 9. crear-cotizacion
('crear-cotizacion', 'Crear y enviar una cotizacion', 'ventas',
 'Genera cotizaciones profesionales y envialas por email o WhatsApp.',
 ARRAY['cotizacion','crear','enviar','presupuesto','quote'],
 $$
<h2>Crear una cotizacion</h2>
<ol>
<li>Ve a <strong>Ventas → Cotizaciones</strong></li>
<li>Haz clic en <strong>"+ Nueva cotizacion"</strong></li>
<li>Selecciona un <strong>cliente</strong></li>
<li>Agrega <strong>productos/servicios</strong> con cantidades y precios</li>
<li>Agrega <strong>notas</strong> o condiciones especiales</li>
<li>Haz clic en <strong>"Crear cotizacion"</strong></li>
</ol>

<h2>Enviar la cotizacion</h2>
<p>Una vez creada, abre la cotizacion y podras:</p>
<ul>
<li><strong>Enviar por email</strong> — El cliente recibe un correo profesional con tu marca, el detalle de productos y un boton para ver la cotizacion completa en linea</li>
<li><strong>Enviar por WhatsApp</strong> — Se abre WhatsApp con un mensaje prediseñado que incluye el enlace a la cotizacion</li>
<li><strong>Copiar enlace publico</strong> — Para compartir por cualquier medio</li>
</ul>

<h2>Seguimiento</h2>
<p>TurnFlow registra automaticamente:</p>
<ul>
<li><strong>Cuando se envio</strong> — Fecha y destinatario</li>
<li><strong>Si fue abierta</strong> — Indicador de lectura (tracking por email)</li>
<li><strong>Estado</strong> — Borrador, Enviada, Aceptada, Rechazada, Convertida en venta</li>
</ul>

<h2>Personalizar el diseño</h2>
<p>Ve a <strong>Ventas → Cotizaciones → Personalizar</strong> para ajustar colores, fuente, layout del encabezado, que campos mostrar y el pie de pagina.</p>
$$, true, 9),

-- 10. gestionar-inventario
('gestionar-inventario', 'Gestionar tu inventario de productos', 'ventas',
 'Agrega productos, controla stock y recibe alertas de bajo inventario.',
 ARRAY['inventario','productos','stock','agregar','producto'],
 $$
<h2>Agregar productos</h2>
<ol>
<li>Ve a <strong>Ventas → Inventario</strong></li>
<li>Haz clic en <strong>"+ Nuevo producto"</strong></li>
<li>Ingresa: <strong>nombre</strong>, <strong>SKU</strong> (codigo unico), <strong>precio</strong>, <strong>stock actual</strong> y <strong>stock minimo</strong></li>
<li>Opcionalmente agrega <strong>descripcion</strong> y <strong>categoria</strong></li>
<li>Guarda el producto</li>
</ol>

<h2>Carga masiva de productos</h2>
<ol>
<li>Haz clic en <strong>"Carga masiva"</strong></li>
<li>Descarga la plantilla CSV</li>
<li>Llena con tus productos y sube el archivo</li>
</ol>

<h2>Control de stock</h2>
<p>Cuando registras una venta, el stock se <strong>descuenta automaticamente</strong>. En el dashboard de inicio veras alertas de <strong>productos con stock bajo</strong> (por debajo del minimo configurado).</p>

<div class="tip">
<strong>SKU duplicados:</strong> Si subes productos con un SKU que ya existe, el sistema actualiza el producto existente en vez de crear uno nuevo.
</div>
$$, true, 10),

-- 11. confirmar-venta-email
('confirmar-venta-email', 'Enviar confirmacion de venta por email', 'ventas',
 'Envia un comprobante profesional al cliente por correo o WhatsApp.',
 ARRAY['confirmacion','email','comprobante','venta','correo'],
 $$
<h2>Enviar confirmacion por email</h2>
<ol>
<li>Abre una venta haciendo clic en ella</li>
<li>Haz clic en <strong>"Enviar confirmacion por email"</strong></li>
<li>El cliente recibira un correo profesional con tu logo, colores, detalle de productos y total</li>
</ol>

<h2>Enviar comprobante por WhatsApp</h2>
<ol>
<li>Si el cliente tiene telefono registrado, veras el boton <strong>"Comprobante WA"</strong></li>
<li>Se abre WhatsApp con un mensaje prediseñado con los datos de la venta</li>
</ol>

<h2>Notificar cambios de estado</h2>
<p>Al cambiar el estado de una venta (confirmar, despachar, entregar), puedes activar la casilla <strong>"Notificar al cliente por email"</strong> para que reciba un correo automatico con el nuevo estado.</p>
$$, true, 11),

-- 12. modulo-citas
('modulo-citas', 'Activar y usar el modulo de citas', 'citas',
 'Administra la agenda de tu negocio con el modulo de citas.',
 ARRAY['citas','agenda','horario','reservar','appointment'],
 $$
<h2>Activar el modulo</h2>
<ol>
<li>Ve a <strong>Marketplace</strong> en el menu lateral</li>
<li>Busca el modulo <strong>"Citas"</strong></li>
<li>Haz clic en <strong>"Probar gratis 7 dias"</strong></li>
</ol>

<h2>Configurar horarios</h2>
<ol>
<li>Ve a <strong>Citas → Configuracion</strong></li>
<li>Define los <strong>dias y horarios</strong> de atencion de cada sucursal</li>
<li>Configura la <strong>duracion</strong> por defecto de las citas</li>
<li>Define los <strong>motivos de cita</strong> disponibles</li>
</ol>

<h2>Gestionar citas</h2>
<p>En la vista de calendario podras:</p>
<ul>
<li>Ver citas del dia, semana o mes</li>
<li>Crear citas manualmente</li>
<li>Confirmar, cancelar o marcar como no-show</li>
<li>Enviar recordatorios por WhatsApp</li>
</ul>

<div class="tip">
<strong>Reserva publica:</strong> Tus clientes pueden agendar citas directamente desde un enlace publico que puedes compartir en redes sociales o poner en tu local con un QR.
</div>
$$, true, 12),

-- 13. plantillas-whatsapp
('plantillas-whatsapp', 'Personalizar plantillas de WhatsApp', 'comunicacion',
 'Edita los mensajes prediseñados que se envian a tus clientes por WA.',
 ARRAY['whatsapp','plantillas','mensajes','personalizar','wa'],
 $$
<h2>Acceder a las plantillas</h2>
<ol>
<li>Ve a <strong>Mensajes WhatsApp</strong> en el menu lateral</li>
<li>Veras las plantillas organizadas por modulo: <strong>Ventas</strong>, <strong>Citas</strong> (si esta activo) y <strong>Clientes</strong></li>
</ol>

<h2>Personalizar un mensaje</h2>
<ol>
<li>Haz clic en <strong>"Editar"</strong> en la plantilla que quieras modificar</li>
<li>Modifica el texto como prefieras</li>
<li>Usa <strong>variables</strong> para insertar datos automaticamente:
  <ul>
    <li><code>{{nombre}}</code> — Nombre del cliente</li>
    <li><code>{{negocio}}</code> — Nombre de tu negocio</li>
    <li><code>{{total}}</code> — Total de la venta/cotizacion</li>
    <li><code>{{fecha}}</code> — Fecha relevante</li>
    <li><code>{{link}}</code> — Enlace a la cotizacion</li>
  </ul>
</li>
<li>Haz clic en <strong>"Guardar"</strong></li>
</ol>

<h2>Plantillas disponibles</h2>
<ul>
<li><strong>Comprobante de venta</strong> — Se envia al completar una venta</li>
<li><strong>Pago pendiente</strong> — Recordatorio de pago</li>
<li><strong>Cotizacion enviada</strong> — Al compartir cotizacion</li>
<li><strong>Seguimiento de cotizacion</strong> — Para cotizaciones sin respuesta</li>
<li><strong>Reactivacion de cliente</strong> — Para clientes inactivos</li>
<li><strong>Confirmacion/recordatorio de cita</strong> — Si el modulo de citas esta activo</li>
</ul>

<div class="tip">
<strong>Nota:</strong> Puedes restaurar el mensaje original en cualquier momento haciendo clic en "Restaurar predeterminado".
</div>
$$, true, 13),

-- 14. configurar-email
('configurar-email', 'Configurar el envio de correos electronicos', 'comunicacion',
 'Conecta Brevo para enviar cotizaciones y confirmaciones por email.',
 ARRAY['email','correo','brevo','configurar','smtp'],
 $$
<h2>Configurar Brevo (envio de emails)</h2>
<p>TurnFlow usa <strong>Brevo</strong> (antes Sendinblue) para enviar emails profesionales. Necesitas una cuenta gratuita:</p>

<ol>
<li>Crea una cuenta en <a href="https://www.brevo.com" target="_blank" rel="noopener">brevo.com</a> (gratis hasta 300 emails/dia)</li>
<li>En Brevo, ve a <strong>SMTP & API → API Keys</strong> y crea una API key</li>
<li>En TurnFlow, ve a <strong>Configuracion → Ajustes</strong> (solo superadmin) o contacta a soporte</li>
<li>Ingresa:
  <ul>
    <li><strong>BREVO_API_KEY</strong> — Tu API key de Brevo</li>
    <li><strong>Email remitente</strong> — El email desde el cual se envian los correos (debe estar verificado en Brevo)</li>
    <li><strong>Nombre remitente</strong> — El nombre que aparece como remitente (ej: "Mi Negocio")</li>
  </ul>
</li>
<li>Usa el boton <strong>"Enviar email de prueba"</strong> para verificar</li>
</ol>

<div class="tip">
<strong>Emails que se envian automaticamente:</strong> Confirmacion de registro, cotizaciones, comprobantes de venta, notificaciones de cambio de estado.
</div>
$$, true, 14),

-- 15. gestionar-usuarios
('gestionar-usuarios', 'Agregar y gestionar usuarios del equipo', 'configuracion',
 'Invita a tu equipo y asigna roles con permisos diferentes.',
 ARRAY['usuarios','equipo','roles','permisos','invitar'],
 $$
<h2>Roles disponibles</h2>
<ul>
<li><strong>Administrador de marca</strong> — Acceso total: configuracion, ventas, clientes, reportes, marketplace</li>
<li><strong>Manager</strong> — Similar al administrador pero sin acceso a configuracion de marca</li>
<li><strong>Asesor</strong> — Acceso limitado: atiende turnos, ve citas asignadas, registra ventas</li>
</ul>

<h2>Invitar un usuario</h2>
<ol>
<li>Ve a <strong>Configuracion → Usuarios</strong></li>
<li>Haz clic en <strong>"Agregar usuario"</strong></li>
<li>Ingresa el <strong>email</strong> del nuevo usuario</li>
<li>Selecciona su <strong>rol</strong></li>
<li>El usuario recibira un email de invitacion para crear su contrasena</li>
</ol>

<div class="tip">
<strong>Seguridad:</strong> Los asesores no pueden ver la configuracion de marca, marketplace ni reportes financieros detallados. Solo tienen acceso a las funciones operativas del dia a dia.
</div>
$$, true, 15),

-- 16. sucursales
('sucursales', 'Configurar sucursales o puntos de venta', 'configuracion',
 'Administra multiples ubicaciones de tu negocio.',
 ARRAY['sucursales','puntos de venta','ubicaciones','sedes'],
 $$
<h2>Agregar una sucursal</h2>
<ol>
<li>Ve a <strong>Configuracion → Sucursales</strong></li>
<li>Haz clic en <strong>"+ Nueva sucursal"</strong></li>
<li>Ingresa el <strong>nombre</strong> y <strong>direccion</strong></li>
<li>Activa o desactiva segun necesites</li>
</ol>

<h2>Para que sirven las sucursales</h2>
<ul>
<li>Las <strong>ventas</strong> se pueden asociar a una sucursal especifica</li>
<li>Las <strong>citas</strong> se configuran con horarios por sucursal</li>
<li>Los <strong>reportes</strong> pueden filtrarse por sucursal</li>
</ul>
$$, true, 16),

-- 17. modo-oscuro
('modo-oscuro', 'Activar el modo oscuro', 'configuracion',
 'Cambia la apariencia de la plataforma a tema oscuro.',
 ARRAY['modo oscuro','dark mode','tema','apariencia'],
 $$
<h2>Activar modo oscuro</h2>
<ol>
<li>Haz clic en tu <strong>foto de perfil</strong> en la esquina superior derecha</li>
<li>Selecciona <strong>"Configuracion"</strong></li>
<li>En la pestana <strong>"Preferencias"</strong>, activa el switch de <strong>Modo oscuro</strong></li>
</ol>
<p>El modo oscuro se aplica a toda la plataforma y se guarda en tu dispositivo.</p>
$$, true, 17),

-- 18. activar-modulos
('activar-modulos', 'Activar modulos desde el Marketplace', 'marketplace',
 'Descubre y prueba modulos adicionales para tu negocio.',
 ARRAY['marketplace','modulos','activar','trial','prueba'],
 $$
<h2>Explorar modulos</h2>
<ol>
<li>Ve a <strong>Marketplace</strong> en el menu lateral</li>
<li>Veras tres secciones:
  <ul>
    <li><strong>Incluidos gratis</strong> — Clientes, Ventas, Mensajes WA (siempre disponibles)</li>
    <li><strong>Modulos activos</strong> — Los que ya tienes contratados o en prueba</li>
    <li><strong>Modulos adicionales</strong> — Disponibles para contratar</li>
  </ul>
</li>
</ol>

<h2>Activar un modulo</h2>
<ol>
<li>Busca el modulo que necesitas (Citas, Encuestas, Menu/Preorden, etc.)</li>
<li>Haz clic en <strong>"Probar gratis 7 dias"</strong></li>
<li>El modulo se activa inmediatamente y aparece en tu menu lateral</li>
<li>Al terminar la prueba, puedes <strong>contratar</strong> o el modulo se desactiva</li>
</ol>

<div class="tip">
<strong>Sin riesgo:</strong> La prueba gratuita no requiere tarjeta de credito. Tus datos se conservan aunque el modulo se desactive — puedes reactivarlo cuando quieras.
</div>
$$, true, 18),

-- 19. dashboard-inicio
('dashboard-inicio', 'Entender el dashboard de inicio', 'reportes',
 'Tu resumen diario de ventas, clientes y actividad.',
 ARRAY['dashboard','inicio','resumen','kpi','metricas'],
 $$
<h2>Que muestra el dashboard</h2>
<p>El dashboard de inicio es tu centro de control diario. Muestra:</p>

<h3>Ventas del dia</h3>
<ul>
<li>Numero de ventas hoy</li>
<li>Total facturado</li>
<li>Comparacion con la semana</li>
</ul>

<h3>Clientes</h3>
<ul>
<li>Total de clientes registrados</li>
<li>Clientes inactivos (mas de 30 dias sin comprar) con opcion de enviarles un WhatsApp</li>
</ul>

<h3>Cumpleanos proximos</h3>
<p>Lista de clientes que cumplen anos hoy o en los proximos 30 dias, con boton para enviar felicitacion por WhatsApp.</p>

<h3>Cotizaciones abiertas</h3>
<p>Cotizaciones enviadas hace mas de 2 dias sin respuesta — ideal para hacer seguimiento.</p>

<h3>Stock bajo</h3>
<p>Productos que estan por debajo del stock minimo configurado.</p>

<h3>Citas de la semana</h3>
<p>Si tienes el modulo de citas activo, veras las proximas citas programadas.</p>
$$, true, 19),

-- 20. cumpleanos-clientes
('cumpleanos-clientes', 'Cumpleanos de clientes y felicitaciones', 'reportes',
 'Felicita a tus clientes automaticamente en su cumpleanos.',
 ARRAY['cumpleanos','felicitar','whatsapp','fidelizacion'],
 $$
<h2>Como funciona</h2>
<p>Si registras la fecha de cumpleanos de tus clientes, TurnFlow mostrara en el dashboard:</p>
<ul>
<li><strong>Cumpleanos de hoy</strong> — Marcados con "Hoy" en color especial</li>
<li><strong>Proximos 30 dias</strong> — Con cuenta regresiva ("en 3 dias", "en 2 semanas")</li>
</ul>

<h2>Enviar felicitacion</h2>
<p>Cada cliente con cumpleanos tiene un boton <strong>"Felicitar"</strong> que abre WhatsApp con un mensaje personalizado listo para enviar.</p>

<div class="tip">
<strong>Consejo de marketing:</strong> Usa los cumpleanos como excusa para ofrecer un descuento especial. Los clientes valoran el toque personal y es una de las tacticas de fidelizacion mas efectivas.
</div>
$$, true, 20);

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Get aggregated ratings per article
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_help_article_ratings()
RETURNS TABLE(article_id UUID, helpful_count BIGINT, unhelpful_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.article_id,
    COUNT(*) FILTER (WHERE r.helpful = true) AS helpful_count,
    COUNT(*) FILTER (WHERE r.helpful = false) AS unhelpful_count
  FROM help_article_ratings r
  GROUP BY r.article_id;
$$;
