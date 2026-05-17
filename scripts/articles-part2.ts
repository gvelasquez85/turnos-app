// Part 2: Colas, Citas, Encuestas, Menú, Comunicación, PQRS
export const ARTICLES_PART2 = [
  // ── COLAS ──────────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el módulo de colas de espera y para qué sirve?',
    slug: 'que-es-modulo-colas',
    category: 'colas',
    summary: 'Entiende cómo funciona el sistema de turnos digitales de TurnFlow y qué problemas resuelve.',
    tags: ['colas', 'turnos', 'espera', 'módulo'],
    body: `<div class="help-article">
<p class="help-intro">Con el módulo de colas de espera, tus clientes sacan turno desde su celular y esperan sentados — sin hacer fila física. Tú llamas cada turno desde tu panel cuando estés listo.</p>
<h3>¿Cómo funciona?</h3>
<ol>
<li><strong>El cliente llega y escanea el código QR</strong> que tienes en la puerta o en la caja. En su celular ve un formulario donde ingresa su nombre y el servicio que necesita.</li>
<li><strong>El sistema le asigna un número de turno</strong> automáticamente — por ejemplo T-007 — y le muestra en pantalla cuántas personas hay adelante y el tiempo estimado de espera.</li>
<li><strong>El cliente espera sentado o donde quiera.</strong> En su celular ve en tiempo real cómo avanza la fila. No necesita estar parado mirando la pantalla.</li>
<li><strong>Tú llamas el turno</strong> desde tu panel de asesor haciendo clic en el botón <strong>Llamar siguiente</strong>. La pantalla de TV del local muestra el número en grande con un sonido de llamada.</li>
<li><strong>El cliente se acerca</strong> cuando ve su número en pantalla. Tú lo atiendes y marcas el turno como <strong>Atendido</strong> para que el siguiente turno pueda llamarse.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente necesita descargar una app?</strong> No. Todo funciona en el navegador del celular — solo escanea el QR y listo.</p>
<p><strong>¿Qué pasa si el cliente no tiene celular?</strong> También puedes sacar el turno manualmente desde tu panel haciendo clic en <strong>+ Nuevo turno</strong> y escribiendo el nombre del cliente.</p>
<p><strong>¿Funciona sin conexión a internet?</strong> No. Tanto el panel de asesor como el celular del cliente necesitan conexión. Si se cae el internet, los clientes ya en cola siguen visibles en tu pantalla pero no se actualizan en tiempo real.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo crear una cola de espera nueva',
    slug: 'crear-cola-espera',
    category: 'colas',
    summary: 'Aprende a configurar tu primera cola de turnos en TurnFlow paso a paso.',
    tags: ['colas', 'crear', 'configurar', 'turnos'],
    body: `<div class="help-article">
<p class="help-intro">Una cola es la fila virtual para un servicio específico. Por ejemplo, si tienes una peluquería puedes tener una cola para "Corte" y otra para "Coloración".</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Solo los usuarios con rol Admin o Manager pueden crear colas.</li><li>Piensa qué nombre verán los clientes cuando escaneen el QR.</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve al módulo de Colas:</strong> En el menú izquierdo haz clic en <strong>Colas de espera</strong>. Si no aparece, primero actívalo en el Marketplace.</li>
<li><strong>Haz clic en "+ Nueva cola":</strong> Botón azul en la esquina superior derecha.</li>
<li><strong>Escribe el nombre de la cola:</strong> Elige un nombre claro. Ejemplo: "Atención general", "Caja 1", "Consultoría".</li>
<li><strong>Configura el prefijo del turno:</strong> Es la letra que irá antes del número. Ejemplo: la letra "T" hará que los turnos sean T-001, T-002, etc. Puedes usar cualquier letra.</li>
<li><strong>Define el horario de atención:</strong> Marca los días y horas en que esta cola estará activa. Fuera de ese horario los clientes verán un mensaje de "Cerrado".</li>
<li><strong>Haz clic en Guardar.</strong> La cola queda lista. El sistema generará automáticamente un código QR y un enlace para compartir con tus clientes.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener varias colas al mismo tiempo?</strong> Sí. Puedes crear tantas colas como necesites — una por servicio, por sucursal o por asesor.</p>
<p><strong>¿Puedo cambiar el nombre después?</strong> Sí. Entra a la cola, haz clic en Editar y cambia el nombre. El QR no cambia.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo compartir el código QR de tu cola con los clientes',
    slug: 'compartir-qr-cola',
    category: 'colas',
    summary: 'Aprende a obtener el QR de tu cola y cómo mostrarlo para que los clientes saquen turno.',
    tags: ['colas', 'QR', 'compartir', 'turnos'],
    body: `<div class="help-article">
<p class="help-intro">El código QR es la puerta de entrada de tus clientes al sistema de turnos. Colócalo en un lugar visible y ellos podrán sacar turno solos desde su celular.</p>
<h3>Pasos para obtener y usar el QR</h3>
<ol>
<li><strong>Ve a Colas de espera</strong> en el menú izquierdo y haz clic en la cola que ya creaste.</li>
<li><strong>Busca el botón "Ver QR" o "Compartir"</strong> dentro de la configuración de la cola.</li>
<li><strong>Descarga el QR en PNG:</strong> Haz clic en <strong>Descargar QR</strong>. Se descarga una imagen en alta resolución lista para imprimir.</li>
<li><strong>Imprime y ubica el QR:</strong> Imprímelo en tamaño mínimo de 10x10 cm. Colócalo en la entrada del local, en la caja o en la recepción — en un lugar donde el cliente lo vea al llegar.</li>
<li><strong>También puedes compartir el enlace:</strong> Si prefieres no imprimir, copia el enlace de la cola y compártelo por WhatsApp o ponlo en tus redes sociales para que los clientes saquen turno antes de llegar.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Necesito imprimir el QR o puedo mostrarlo en pantalla?</strong> Ambas opciones funcionan. Puedes poner el QR en una tablet o pantalla en la entrada y los clientes lo escanean desde ahí.</p>
<p><strong>¿El QR cambia si edito la cola?</strong> No. El QR siempre lleva al mismo enlace de esa cola, aunque cambies el nombre o el horario.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo llamar un turno desde el panel de asesor',
    slug: 'llamar-turno-panel',
    category: 'colas',
    summary: 'Aprende a usar el panel de asesor para llamar clientes, marcar atendidos y gestionar la fila.',
    tags: ['colas', 'asesor', 'panel', 'llamar', 'turno'],
    body: `<div class="help-article">
<p class="help-intro">El panel de asesor es donde tú controlas la fila. Desde aquí ves quién está esperando, llamas al siguiente y registras cuando terminas de atender.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Colas → Panel de asesor</strong> en el menú. Si eres asesor, esta pantalla puede ser tu vista principal.</li>
<li><strong>Selecciona la cola que vas a atender</strong> si hay más de una en tu sucursal.</li>
<li><strong>Ve la lista de clientes en espera:</strong> Cada fila muestra el número de turno, el nombre del cliente, el servicio que pidió y cuánto tiempo lleva esperando.</li>
<li><strong>Haz clic en "Llamar siguiente"</strong> cuando estés listo para atender. El número aparecerá en grande en la pantalla TV y el cliente recibirá una notificación en su celular.</li>
<li><strong>Cuando termines de atender, haz clic en "Atendido"</strong> para cerrar ese turno. El contador de la fila se actualiza automáticamente.</li>
<li><strong>Si el cliente no se presenta</strong>, haz clic en "No se presentó" o "Saltar". El turno se marca como no atendido y puedes llamar al siguiente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ver el panel en el celular mientras atiendo?</strong> Sí. El panel funciona en cualquier dispositivo con internet — celular, tablet o computador.</p>
<p><strong>¿Puedo llamar un turno específico sin seguir el orden?</strong> Sí. Haz clic en cualquier turno de la lista (no solo el primero) para llamarlo directamente.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo configurar la pantalla de TV para mostrar los turnos',
    slug: 'pantalla-tv-turnos',
    category: 'colas',
    summary: 'Configura una pantalla o TV en tu local para mostrar los turnos llamados en tiempo real.',
    tags: ['colas', 'TV', 'pantalla', 'display', 'turnos'],
    body: `<div class="help-article">
<p class="help-intro">La pantalla de TV muestra los turnos llamados en grande para que los clientes los vean desde cualquier parte del local. Solo necesitas una TV con internet.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Conecta la TV a internet</strong> por WiFi o cable de red. Asegúrate de que tenga un navegador web (la mayoría de Smart TVs lo tienen).</li>
<li><strong>En TurnFlow, ve a Colas → Pantalla TV.</strong> Verás un enlace especial para la pantalla.</li>
<li><strong>Copia el enlace de la pantalla</strong> y ábrelo en el navegador de la TV. Puedes enviarlo por WhatsApp o email a la TV si tiene esa opción, o escribirlo directamente.</li>
<li><strong>La pantalla mostrará en grande:</strong> El turno que se está llamando ahora, los últimos turnos llamados y el tiempo de espera estimado.</li>
<li><strong>Pon la pantalla en modo pantalla completa:</strong> En el navegador de la TV presiona F11 o busca la opción de pantalla completa para que ocupe toda la TV sin la barra del navegador.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué pasa si no tengo Smart TV?</strong> Puedes usar un computador o tablet conectado a la TV con un cable HDMI y abrir el enlace en el navegador del computador.</p>
<p><strong>¿La pantalla se actualiza sola?</strong> Sí, en tiempo real. Cada vez que llamas un turno desde el panel de asesor, la TV se actualiza automáticamente en segundos.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo agregar un turno manualmente',
    slug: 'agregar-turno-manual',
    category: 'colas',
    summary: 'Aprende a crear un turno desde el panel cuando el cliente no puede escanear el QR.',
    tags: ['colas', 'turno', 'manual', 'agregar'],
    body: `<div class="help-article">
<p class="help-intro">No todos los clientes tienen celular o saben escanear QR. Por eso puedes agregar turnos manualmente desde el panel para que nadie se quede sin atención.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Colas → Panel de asesor.</strong></li>
<li><strong>Haz clic en "+ Nuevo turno"</strong> (botón verde o azul en la parte superior).</li>
<li><strong>Ingresa el nombre del cliente</strong> en el campo de texto. También puedes añadir el servicio que necesita.</li>
<li><strong>Haz clic en Crear turno.</strong> El sistema asigna el siguiente número disponible en la cola y el turno aparece en la lista de espera.</li>
<li><strong>Informa al cliente su número</strong> de turno de voz o muéstraselo en tu pantalla para que sepa cuándo lo llamas.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El turno manual queda en la misma fila que los que se sacan por QR?</strong> Sí. Todos los turnos entran a la misma cola en orden de llegada, sin importar cómo se crearon.</p>
<p><strong>¿El cliente recibe notificación en el celular?</strong> Solo si ingresó su número de teléfono. Si el turno fue creado manualmente sin teléfono, no hay notificación automática.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo pausar o cerrar la cola temporalmente',
    slug: 'pausar-cerrar-cola',
    category: 'colas',
    summary: 'Aprende a detener la llegada de nuevos turnos cuando necesitas un descanso o cierras el local.',
    tags: ['colas', 'pausar', 'cerrar', 'detener'],
    body: `<div class="help-article">
<p class="help-intro">Cuando sales a almorzar, terminas el día o tienes una emergencia, puedes pausar la cola para que no entren más clientes mientras terminas de atender a los que ya están.</p>
<h3>Pasos para pausar la cola</h3>
<ol>
<li><strong>Ve a Colas → Panel de asesor</strong> o a la configuración de tu cola.</li>
<li><strong>Busca el interruptor o botón "Pausar cola" / "Cerrar"</strong> en la parte superior del panel. Generalmente es un botón rojo o naranja.</li>
<li><strong>Haz clic en Pausar.</strong> Desde ese momento, cuando un cliente escanee el QR verá el mensaje "Esta cola está temporalmente cerrada. Por favor intenta más tarde."</li>
<li><strong>Los clientes ya en cola siguen activos.</strong> Solo se bloquean los nuevos. Termina de atender a quienes ya están en la fila.</li>
<li><strong>Para reanudar, haz clic en "Abrir cola"</strong> o "Reanudar". La cola vuelve a aceptar nuevos turnos inmediatamente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿La cola se cierra automáticamente al final del horario?</strong> Sí, si configuraste un horario de atención. Fuera de ese horario la cola se cierra sola.</p>
<p><strong>¿Puedo poner un mensaje personalizado cuando la cola está cerrada?</strong> Dependiendo del plan, sí. Busca en la configuración de la cola el campo "Mensaje de cola cerrada".</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo ver el historial de turnos del día',
    slug: 'historial-turnos-dia',
    category: 'colas',
    summary: 'Consulta cuántos clientes atendiste, tiempos de espera y otros datos del día.',
    tags: ['colas', 'historial', 'reporte', 'turnos', 'estadísticas'],
    body: `<div class="help-article">
<p class="help-intro">El historial de turnos te muestra cuántos clientes atendiste, cuánto tiempo esperaron en promedio y qué horas son las más ocupadas de tu negocio.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Colas de espera</strong> en el menú.</li>
<li><strong>Selecciona la cola</strong> cuyo historial quieres ver.</li>
<li><strong>Haz clic en la pestaña "Historial" o "Reportes".</strong></li>
<li><strong>Selecciona el período:</strong> Hoy, esta semana, este mes o un rango de fechas personalizado.</li>
<li><strong>Lee las estadísticas:</strong> Total de turnos generados, turnos atendidos, turnos no atendidos (no se presentaron), tiempo promedio de espera y hora pico (la hora con más clientes).</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo exportar el historial a Excel?</strong> Sí. Busca el botón Exportar en la pantalla de historial.</p>
<p><strong>¿El historial guarda el nombre del cliente atendido?</strong> Sí. Si el cliente ingresó su nombre al sacar el turno, aparece en el historial junto al turno.</p>
</div></div>`,
    published: true, sort_order: 8,
  },
  {
    title: 'Cómo configurar el mensaje de bienvenida de la cola',
    slug: 'mensaje-bienvenida-cola',
    category: 'colas',
    summary: 'Personaliza el texto que ven los clientes al escanear el QR y sacar su turno.',
    tags: ['colas', 'mensaje', 'bienvenida', 'personalizar'],
    body: `<div class="help-article">
<p class="help-intro">El mensaje de bienvenida es lo primero que ve el cliente al escanear el QR. Personalízalo con el nombre de tu negocio y cualquier instrucción importante.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Colas de espera</strong> y entra a la cola que quieres personalizar.</li>
<li><strong>Haz clic en "Editar" o el ícono de lápiz.</strong></li>
<li><strong>Busca el campo "Mensaje de bienvenida".</strong> Escribe el texto que quieres que vean los clientes. Ejemplo: "Bienvenido a Peluquería Estilo. Tu turno ha sido registrado. Te llamaremos pronto."</li>
<li><strong>También puedes personalizar el mensaje de turno asignado:</strong> El texto que aparece después de que se genera el turno. Ejemplo: "Tu turno es el T-007. Hay 3 personas antes que tú. Tiempo estimado: 15 minutos."</li>
<li><strong>Guarda los cambios.</strong> El próximo cliente que escanee el QR verá el mensaje nuevo.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo poner el logo de mi negocio en la pantalla del turno?</strong> Sí. El logo que subiste en Configuración → Marca aparece automáticamente en la pantalla de turno del cliente.</p>
</div></div>`,
    published: true, sort_order: 9,
  },
  {
    title: '¿Qué diferencia hay entre la versión gratuita y la versión paga de colas?',
    slug: 'diferencia-colas-gratis-pago',
    category: 'colas',
    summary: 'Conoce qué funciones de colas están disponibles gratis y cuáles requieren el módulo premium.',
    tags: ['colas', 'gratis', 'pago', 'plan', 'diferencia'],
    body: `<div class="help-article">
<p class="help-intro">TurnFlow ofrece funciones básicas de colas sin costo y funciones avanzadas con el módulo premium de colas.</p>
<h3>Versión gratuita (disponible para todos)</h3>
<ul>
<li>Los clientes pueden sacar turno escaneando el QR desde su celular.</li>
<li>Cada cliente ve su posición en la fila y el tiempo estimado de espera.</li>
<li>Tú puedes ver la lista de clientes en espera.</li>
</ul>
<h3>Versión premium (módulo de Colas activado)</h3>
<ul>
<li><strong>Panel de asesor completo</strong> — llama turnos, marca atendidos, salta turnos.</li>
<li><strong>Pantalla de TV</strong> — muestra los turnos en grande en tu local.</li>
<li><strong>Múltiples colas simultáneas</strong> — una por servicio o por asesor.</li>
<li><strong>Reportes y estadísticas</strong> — tiempos de espera, hora pico, turnos atendidos.</li>
<li><strong>Notificaciones al cliente</strong> — aviso en el celular cuando le toca su turno.</li>
<li><strong>Gestión de prioridades</strong> — turnos preferencial o de urgencia.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cómo activo el módulo premium de colas?</strong> Ve al Marketplace en el menú izquierdo, busca "Colas de espera" y haz clic en Iniciar prueba gratuita.</p>
</div></div>`,
    published: true, sort_order: 10,
  },

  // ── CITAS ──────────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el módulo de citas y para qué sirve?',
    slug: 'que-es-modulo-citas',
    category: 'citas',
    summary: 'Descubre cómo el sistema de agendamiento de TurnFlow te ayuda a organizar tus citas sin llamadas.',
    tags: ['citas', 'agenda', 'módulo', 'agendamiento'],
    body: `<div class="help-article">
<p class="help-intro">El módulo de citas te da un enlace o QR que puedes compartir con tus clientes para que ellos mismos agenden su cita cuando quieran — sin llamarte, sin WhatsApp de ida y vuelta.</p>
<h3>¿Cómo funciona?</h3>
<ol>
<li>Tú configuras tu disponibilidad: qué días trabajas, en qué horarios y cuánto dura cada cita.</li>
<li>El cliente entra a tu enlace de agendamiento y ve los días y horas disponibles en tiempo real.</li>
<li>El cliente elige la fecha y hora que le quede bien, ingresa su nombre y teléfono, y confirma.</li>
<li>Tú recibes una notificación con la nueva cita y el cliente recibe una confirmación en su celular.</li>
<li>El día de la cita, el sistema puede enviar un recordatorio automático al cliente para que no se olvide.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente necesita crear una cuenta para agendar?</strong> No. Solo ingresa su nombre y teléfono. No necesita contraseña ni cuenta de TurnFlow.</p>
<p><strong>¿Puedo tener varias personas que atienden citas al mismo tiempo?</strong> Sí. Puedes configurar varios asesores o "proveedores" con su propia disponibilidad independiente.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo configurar tu disponibilidad de citas por primera vez',
    slug: 'configurar-disponibilidad-citas',
    category: 'citas',
    summary: 'Aprende a definir tus días y horas de trabajo para que los clientes puedan agendar citas.',
    tags: ['citas', 'disponibilidad', 'horario', 'configurar'],
    body: `<div class="help-article">
<p class="help-intro">Antes de que los clientes puedan agendar, debes decirle a TurnFlow en qué días y horas puedes atenderlos.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Ten claro tu horario de trabajo: qué días de la semana atiendes y desde qué hora hasta qué hora.</li><li>Decide cuánto dura cada cita (ejemplo: 30 minutos, 1 hora).</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas → Configuración</strong> en el menú izquierdo.</li>
<li><strong>Selecciona los días en que trabajas:</strong> Marca los días de la semana (Lunes, Martes, etc.) en que estás disponible para atender citas.</li>
<li><strong>Define el horario por día:</strong> Para cada día marcado, escribe la hora de inicio y fin. Por ejemplo: Lunes a Viernes de 8:00 AM a 6:00 PM.</li>
<li><strong>Define la duración de cada cita:</strong> En el campo "Duración de la cita" selecciona 30 min, 45 min, 1 hora, etc. Este es el bloque de tiempo que se bloquea por cada reserva.</li>
<li><strong>Configura el tiempo de descanso entre citas (opcional):</strong> Si necesitas 10 minutos entre cliente y cliente, agrégalo aquí.</li>
<li><strong>Haz clic en Guardar.</strong> Tu calendario ya estará listo y los clientes podrán ver los espacios disponibles.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener horarios diferentes cada día?</strong> Sí. Por ejemplo Lunes de 8am a 12pm y Miércoles de 2pm a 7pm. Configura cada día por separado.</p>
<p><strong>¿Puedo cambiar la disponibilidad después?</strong> Sí. Cualquier cambio en la configuración aplica para citas nuevas — las ya agendadas no se afectan.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo compartir el enlace de agendamiento con tus clientes',
    slug: 'compartir-enlace-agendamiento',
    category: 'citas',
    summary: 'Aprende a obtener y compartir el enlace para que los clientes agenden sus propias citas.',
    tags: ['citas', 'enlace', 'compartir', 'QR', 'agendamiento'],
    body: `<div class="help-article">
<p class="help-intro">El enlace de agendamiento es la dirección web que le das a tus clientes para que reserven su cita solos. Es como tener una recepcionista disponible 24/7.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas</strong> en el menú izquierdo.</li>
<li><strong>Busca el botón "Ver enlace público" o "Compartir".</strong></li>
<li><strong>Copia el enlace</strong> con el botón Copiar. El enlace tiene un formato similar a: <em>app.turnflow.com.co/citas/tu-negocio</em></li>
<li><strong>Comparte el enlace</strong> por WhatsApp, en tu perfil de Instagram (en la bio), en tu sitio web, o en tu firma de correo electrónico.</li>
<li><strong>También puedes descargar el QR</strong> haciendo clic en "Descargar QR" para imprimirlo y colocarlo en tu local.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo poner el enlace en Instagram?</strong> Sí. En Instagram ve a Editar perfil → Sitio web y pega el enlace. Tus seguidores podrán agendar desde tu perfil.</p>
<p><strong>¿El enlace es el mismo para siempre?</strong> Sí. Una vez configurado, el enlace no cambia aunque modifiques tu disponibilidad.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo agendar una cita manualmente para un cliente',
    slug: 'agendar-cita-manual',
    category: 'citas',
    summary: 'Aprende a crear una cita desde tu panel sin que el cliente tenga que agendar solo.',
    tags: ['citas', 'agendar', 'manual', 'crear'],
    body: `<div class="help-article">
<p class="help-intro">Si un cliente te llama por teléfono o llega en persona, puedes agendar la cita desde tu panel en lugar de pedirle que use el enlace.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas</strong> en el menú.</li>
<li><strong>Haz clic en "+ Nueva cita"</strong> en la esquina superior derecha.</li>
<li><strong>Selecciona el cliente:</strong> Busca el cliente en la base de datos o escribe su nombre. Si es nuevo, escribe sus datos (nombre, teléfono).</li>
<li><strong>Selecciona el servicio</strong> que va a recibir (si tienes varios servicios configurados).</li>
<li><strong>Selecciona la fecha y hora</strong> en el calendario. Solo verás las horas disponibles (las ya reservadas aparecen grises).</li>
<li><strong>Haz clic en Confirmar cita.</strong> El cliente recibirá una confirmación por WhatsApp o SMS si tiene teléfono registrado.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo agendar sin asociar la cita a un cliente registrado?</strong> Sí. Escribe el nombre directamente en el campo de cliente sin buscarlo — la cita quedará registrada con ese nombre.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo ver todas las citas del día en el calendario',
    slug: 'ver-citas-calendario',
    category: 'citas',
    summary: 'Consulta tu agenda del día, semana o mes en el calendario de TurnFlow.',
    tags: ['citas', 'calendario', 'agenda', 'ver'],
    body: `<div class="help-article">
<p class="help-intro">El calendario de citas te muestra de un vistazo qué clientes tienes agendados, a qué hora y para qué servicio — como una agenda física pero digital y automática.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas</strong> en el menú izquierdo.</li>
<li><strong>Verás el calendario</strong> con las citas del día actual marcadas como bloques de colores.</li>
<li><strong>Cambia la vista:</strong> En la parte superior puedes cambiar entre vista de <strong>Día</strong> (solo hoy), <strong>Semana</strong> (los 7 días) o <strong>Mes</strong> (todo el mes). La vista de semana es la más útil para planificar.</li>
<li><strong>Haz clic en cualquier cita</strong> para ver los detalles: nombre del cliente, teléfono, servicio y duración.</li>
<li><strong>Navega entre días o semanas</strong> con las flechas ← → en la parte superior del calendario.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ver el calendario de otro asesor?</strong> Sí (si eres Admin o Manager). Busca el filtro de asesor en la parte superior del calendario.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo confirmar o cancelar una cita',
    slug: 'confirmar-cancelar-cita',
    category: 'citas',
    summary: 'Aprende a gestionar el estado de una cita: confirmar asistencia o cancelarla con aviso al cliente.',
    tags: ['citas', 'confirmar', 'cancelar', 'estado'],
    body: `<div class="help-article">
<p class="help-intro">Cambiar el estado de una cita mantiene tu agenda limpia y le comunica al cliente si todo está en pie o si hay algún cambio.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas</strong> en el menú y haz clic en la cita que quieres gestionar.</li>
<li><strong>Se abre el detalle de la cita</strong> con la información del cliente y los botones de acción.</li>
<li><strong>Para confirmar:</strong> Haz clic en el botón <strong>Confirmar</strong>. La cita cambia a estado "Confirmada" (generalmente verde). El cliente puede recibir un mensaje de confirmación.</li>
<li><strong>Para cancelar:</strong> Haz clic en el botón <strong>Cancelar cita</strong>. Se te pedirá una razón (opcional). El cliente recibirá un aviso de que su cita fue cancelada y el espacio quedará disponible de nuevo para otros.</li>
<li><strong>Para marcar como "Completada":</strong> Cuando el cliente ya fue atendido, haz clic en <strong>Completada</strong> para cerrar la cita.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente puede cancelar su propia cita?</strong> Sí, si el negocio lo permite. En el mensaje de confirmación hay un enlace para que el cliente cancele por su cuenta.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo bloquear un día que no vas a trabajar',
    slug: 'bloquear-dia-no-laboral',
    category: 'citas',
    summary: 'Bloquea días de vacaciones, festivos o imprevistos para que nadie pueda agendar ese día.',
    tags: ['citas', 'bloquear', 'festivo', 'vacaciones', 'disponibilidad'],
    body: `<div class="help-article">
<p class="help-intro">Cuando hay un festivo, una emergencia o planeas vacaciones, puedes bloquear esos días para que el calendario no muestre disponibilidad — sin tener que modificar toda tu configuración.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas → Configuración → Días bloqueados</strong> o busca la opción "Bloquear fechas" en tu panel de citas.</li>
<li><strong>Haz clic en "+ Bloquear fecha"</strong>.</li>
<li><strong>Selecciona el día o rango de días</strong> que quieres bloquear en el selector de fechas.</li>
<li><strong>Agrega una razón (opcional):</strong> Por ejemplo "Festivo", "Vacaciones", "Mantenimiento".</li>
<li><strong>Haz clic en Guardar.</strong> Ese día desaparecerá del calendario de agendamiento y los clientes no podrán reservar en esa fecha.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Las citas ya agendadas en ese día se cancelan automáticamente?</strong> No. Debes cancelarlas manualmente o contactar a los clientes. TurnFlow te mostrará las citas existentes en ese día antes de bloquear.</p>
<p><strong>¿Puedo bloquear solo unas horas del día, no el día completo?</strong> Sí. En la configuración de bloqueo puedes definir un rango de horas dentro del día.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo mover una cita a otro horario',
    slug: 'mover-cita-otro-horario',
    category: 'citas',
    summary: 'Aprende a reprogramar una cita a una fecha u hora diferente sin cancelarla.',
    tags: ['citas', 'reprogramar', 'mover', 'cambiar horario'],
    body: `<div class="help-article">
<p class="help-intro">Cuando un cliente necesita cambiar la hora de su cita, puedes reprogramarla en segundos sin tener que cancelar y crear una nueva.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Citas</strong> y haz clic en la cita que necesitas mover.</li>
<li><strong>En el detalle de la cita, haz clic en "Reprogramar"</strong> o en el ícono de calendario/editar.</li>
<li><strong>Se abrirá el calendario</strong> con la disponibilidad actualizada. Los espacios ya ocupados aparecen grises.</li>
<li><strong>Selecciona la nueva fecha y hora</strong> que el cliente prefiere.</li>
<li><strong>Haz clic en Confirmar reprogramación.</strong> La cita se mueve al nuevo horario y el espacio anterior queda disponible para otros clientes. El cliente puede recibir un aviso del cambio.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente recibe notificación del cambio?</strong> Sí, si tiene teléfono registrado. Recibirá un mensaje con la nueva fecha y hora.</p>
</div></div>`,
    published: true, sort_order: 8,
  },
  {
    title: 'Cómo enviar recordatorios automáticos de citas',
    slug: 'recordatorio-cita-cliente',
    category: 'citas',
    summary: 'Configura recordatorios automáticos para que los clientes no olviden su cita.',
    tags: ['citas', 'recordatorio', 'automático', 'WhatsApp', 'notificación'],
    body: `<div class="help-article">
<p class="help-intro">Los recordatorios automáticos reducen drásticamente las citas perdidas ("no shows"). TurnFlow puede enviar un aviso al cliente 24 horas antes o el mismo día de su cita.</p>
<h3>Pasos para activar los recordatorios</h3>
<ol>
<li><strong>Ve a Citas → Configuración.</strong></li>
<li><strong>Busca la sección "Recordatorios automáticos".</strong></li>
<li><strong>Activa el recordatorio:</strong> Enciende el interruptor (toggle) junto a "Enviar recordatorio antes de la cita".</li>
<li><strong>Define cuándo enviarlo:</strong> Elige si quieres enviar el recordatorio 24 horas antes, 2 horas antes o ambos.</li>
<li><strong>Elige el canal:</strong> WhatsApp, SMS o correo electrónico (depende de los datos registrados del cliente).</li>
<li><strong>Guarda los cambios.</strong> A partir de ese momento, todas las citas futuras tendrán recordatorio automático.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo personalizar el texto del recordatorio?</strong> Sí. En la configuración busca el campo "Mensaje de recordatorio" y edita el texto. Puedes usar variables como {nombre} y {hora_cita}.</p>
<p><strong>¿Tiene costo adicional el envío de recordatorios?</strong> Depende de tu plan. En algunos planes los SMS tienen un costo adicional. Los recordatorios por WhatsApp mediante la API de WhatsApp Business también pueden tener costo.</p>
</div></div>`,
    published: true, sort_order: 9,
  },
  {
    title: 'Cómo ver las citas próximas del día de hoy',
    slug: 'citas-proximas-hoy',
    category: 'citas',
    summary: 'Consulta rápidamente qué clientes tienes agendados para hoy desde el dashboard o el módulo de citas.',
    tags: ['citas', 'hoy', 'agenda', 'próximas'],
    body: `<div class="help-article">
<p class="help-intro">Al empezar el día, lo primero que debes revisar es quién tienes agendado. TurnFlow te lo muestra en dos lugares.</p>
<h3>Opción 1 — Desde el Dashboard (inicio)</h3>
<ol>
<li>Al entrar a TurnFlow, en la pantalla de inicio (Dashboard) hay una tarjeta que dice <strong>"Citas de hoy"</strong>.</li>
<li>Muestra las próximas citas en orden de hora con el nombre del cliente y el servicio.</li>
<li>Haz clic en cualquier cita para ver más detalles o cambiar su estado.</li>
</ol>
<h3>Opción 2 — Desde el módulo de Citas</h3>
<ol>
<li>Ve a <strong>Citas</strong> en el menú izquierdo.</li>
<li>El calendario abre en el día de hoy por defecto.</li>
<li>Cambia a <strong>vista de Día</strong> para ver solo las citas de hoy en orden cronológico.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ver las citas de mañana también?</strong> Sí. En el calendario usa la flecha → para avanzar al día siguiente.</p>
</div></div>`,
    published: true, sort_order: 10,
  },

  // ── ENCUESTAS ──────────────────────────────────────────────────────────────
  {
    title: '¿Para qué sirve el módulo de encuestas de satisfacción?',
    slug: 'para-que-sirven-encuestas',
    category: 'encuestas',
    summary: 'Entiende cómo las encuestas de satisfacción de TurnFlow te ayudan a mejorar tu servicio.',
    tags: ['encuestas', 'satisfacción', 'NPS', 'calificación'],
    body: `<div class="help-article">
<p class="help-intro">Las encuestas de satisfacción te dicen qué piensan realmente tus clientes de tu servicio — no lo que te dicen en la cara por amabilidad, sino lo que sienten de verdad.</p>
<h3>¿Qué puedes medir?</h3>
<ul>
<li><strong>Calificación de 1 a 5 estrellas</strong> — La forma más simple: ¿Qué tan satisfecho estás? Del 1 (muy mal) al 5 (excelente).</li>
<li><strong>NPS (Net Promoter Score)</strong> — Pregunta "¿Recomendarías nuestro negocio a un amigo?" en escala del 0 al 10. Es el estándar global para medir lealtad.</li>
<li><strong>Preguntas abiertas</strong> — "¿Qué podemos mejorar?" El cliente escribe lo que quiera.</li>
<li><strong>Selección múltiple</strong> — "¿Qué te gustó más?" con varias opciones para elegir.</li>
</ul>
<h3>¿Cuándo se envía la encuesta?</h3>
<p>Puedes configurarla para que se envíe automáticamente al terminar una cita o un servicio, o puedes compartir el enlace manualmente cuando quieras recopilar opiniones.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente sabe que es anónimo?</strong> Puedes configurar la encuesta como anónima (no se guarda el nombre) o no anónima. Te recomendamos hacerla no anónima para poder hacer seguimiento.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo crear una encuesta nueva',
    slug: 'crear-encuesta-nueva',
    category: 'encuestas',
    summary: 'Pasos para crear tu primera encuesta de satisfacción en TurnFlow.',
    tags: ['encuestas', 'crear', 'nueva', 'configurar'],
    body: `<div class="help-article">
<p class="help-intro">Crear una encuesta en TurnFlow toma menos de 5 minutos. Puedes empezar con una pregunta simple y agregar más después.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Encuestas</strong> en el menú izquierdo. Si no aparece, actívalo en el Marketplace.</li>
<li><strong>Haz clic en "+ Nueva encuesta".</strong></li>
<li><strong>Escribe el nombre de la encuesta.</strong> Este es un nombre interno para que tú la identifiques. Ejemplo: "Encuesta post-servicio".</li>
<li><strong>Escribe el título que verá el cliente.</strong> Ejemplo: "¿Cómo fue tu experiencia con nosotros hoy?"</li>
<li><strong>Agrega una descripción opcional.</strong> Ejemplo: "Tu opinión nos ayuda a mejorar. Tarda menos de 1 minuto."</li>
<li><strong>Haz clic en "Guardar y agregar preguntas"</strong> para continuar con el siguiente paso.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener varias encuestas activas al mismo tiempo?</strong> Sí. Puedes tener encuestas para diferentes servicios o momentos del proceso.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo agregar preguntas a tu encuesta',
    slug: 'agregar-preguntas-encuesta',
    category: 'encuestas',
    summary: 'Aprende a agregar preguntas de diferentes tipos a tu encuesta de satisfacción.',
    tags: ['encuestas', 'preguntas', 'tipos', 'escala', 'opción múltiple'],
    body: `<div class="help-article">
<p class="help-intro">Una buena encuesta tiene entre 2 y 5 preguntas. Más de eso y los clientes no la terminan. Menos de 2 y no recopilas suficiente información.</p>
<h3>Tipos de preguntas disponibles</h3>
<ul>
<li><strong>Escala de estrellas (1-5):</strong> El cliente toca entre 1 y 5 estrellas. Ideal para calificar la satisfacción general.</li>
<li><strong>Escala numérica (0-10):</strong> Usada para preguntas NPS como "¿Nos recomendarías?"</li>
<li><strong>Texto libre:</strong> El cliente escribe su respuesta. Úsala para "¿Qué podemos mejorar?"</li>
<li><strong>Opción múltiple:</strong> El cliente elige una o varias opciones de una lista. Ejemplo: "¿Qué te gustó?" con opciones Atención, Precio, Rapidez, Instalaciones.</li>
</ul>
<h3>Pasos para agregar una pregunta</h3>
<ol>
<li><strong>Dentro de tu encuesta, haz clic en "+ Agregar pregunta".</strong></li>
<li><strong>Elige el tipo de pregunta</strong> de la lista desplegable.</li>
<li><strong>Escribe el texto de la pregunta.</strong> Sé claro y directo.</li>
<li><strong>Si es opción múltiple, agrega las opciones</strong> haciendo clic en "+ Agregar opción".</li>
<li><strong>Marca si la pregunta es obligatoria</strong> (el cliente debe responderla para enviar la encuesta).</li>
<li><strong>Haz clic en Guardar pregunta.</strong> Repite para cada pregunta.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo cambiar el orden de las preguntas después?</strong> Sí. Arrastra las preguntas con el ícono de puntos (⠿) para reordenarlas.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo compartir la encuesta con tus clientes',
    slug: 'compartir-encuesta-clientes',
    category: 'encuestas',
    summary: 'Aprende las formas de enviarle tu encuesta a los clientes: QR, enlace o WhatsApp.',
    tags: ['encuestas', 'compartir', 'QR', 'enlace', 'WhatsApp'],
    body: `<div class="help-article">
<p class="help-intro">Hay tres formas principales de hacerle llegar la encuesta a tus clientes: en el momento de pagar, después de la visita por WhatsApp, o con un QR en el local.</p>
<h3>Opción 1 — QR en el local</h3>
<ol>
<li>Ve a la encuesta en TurnFlow y haz clic en <strong>"Ver QR"</strong>.</li>
<li>Descarga el QR e imprímelo. Colócalo en la caja, en la mesa o en la salida.</li>
<li>El cliente lo escanea antes de irse y completa la encuesta en su celular.</li>
</ol>
<h3>Opción 2 — Enlace por WhatsApp</h3>
<ol>
<li>Ve a la encuesta y copia el enlace público.</li>
<li>Después de atender al cliente, envíale el enlace por WhatsApp con un mensaje como "Gracias por visitarnos. ¿Nos dejas tu opinión? Solo toma 1 minuto: [enlace]".</li>
</ol>
<h3>Opción 3 — Envío automático post-cita</h3>
<ol>
<li>En la configuración de la encuesta activa <strong>"Enviar automáticamente al completar cita"</strong>.</li>
<li>Define cuánto tiempo después de la cita se envía (inmediatamente, 1 hora después, etc.).</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puede el mismo cliente completar la encuesta varias veces?</strong> Sí, a menos que configures la encuesta para un solo intento por número de teléfono.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo ver las respuestas de tus encuestas',
    slug: 'ver-respuestas-encuesta',
    category: 'encuestas',
    summary: 'Accede a las respuestas individuales y al resumen de resultados de tu encuesta.',
    tags: ['encuestas', 'respuestas', 'resultados', 'ver'],
    body: `<div class="help-article">
<p class="help-intro">Cada vez que un cliente completa tu encuesta, la respuesta queda guardada en TurnFlow. Puedes ver las respuestas una por una o el resumen estadístico.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Encuestas</strong> en el menú y selecciona la encuesta que quieres revisar.</li>
<li><strong>Haz clic en la pestaña "Respuestas".</strong> Verás la lista de todas las respuestas recibidas con la fecha y hora.</li>
<li><strong>Haz clic en una respuesta</strong> para ver en detalle qué respondió ese cliente en cada pregunta.</li>
<li><strong>Para ver el resumen estadístico</strong>, haz clic en la pestaña "Resultados" o "Estadísticas". Aquí verás el promedio de calificación, el gráfico de distribución y las respuestas de texto agrupadas.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo exportar las respuestas a Excel?</strong> Sí. Busca el botón Exportar en la pantalla de respuestas.</p>
<p><strong>¿Puedo ver quién respondió la encuesta?</strong> Si la encuesta no es anónima y el cliente ingresó su teléfono o nombre, sí lo verás.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo ver el puntaje promedio de satisfacción',
    slug: 'puntaje-satisfaccion',
    category: 'encuestas',
    summary: 'Consulta el promedio de calificaciones de tus clientes y cómo ha evolucionado con el tiempo.',
    tags: ['encuestas', 'puntaje', 'promedio', 'satisfacción', 'NPS'],
    body: `<div class="help-article">
<p class="help-intro">El puntaje promedio de satisfacción es el número más importante de tu encuesta — te dice de forma rápida si tus clientes están contentos o hay algo que mejorar.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Encuestas</strong> y selecciona tu encuesta.</li>
<li><strong>Haz clic en la pestaña "Resultados" o "Dashboard".</strong></li>
<li><strong>Lee el puntaje general:</strong> Si usas escala de 1-5, el promedio puede ser 4.2/5. Si usas NPS (0-10), verás también el porcentaje de promotores (quienes dan 9-10), pasivos (7-8) y detractores (0-6).</li>
<li><strong>Revisa la tendencia:</strong> El gráfico de línea muestra cómo ha cambiado el puntaje semana a semana. Una línea que sube es buena señal; una que baja requiere atención inmediata.</li>
<li><strong>Lee los comentarios recientes:</strong> Debajo del gráfico verás las últimas respuestas de texto libre — las más valiosas para entender qué está pasando.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué se considera un buen puntaje?</strong> En escala de 1-5, un promedio de 4.0 o superior es bueno. En NPS, un puntaje mayor a 50 es excelente para pequeños negocios.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: '¿Cuándo le llega la encuesta al cliente automáticamente?',
    slug: 'cuando-llega-encuesta-cliente',
    category: 'encuestas',
    summary: 'Entiende en qué momento se envía la encuesta si tienes activado el envío automático.',
    tags: ['encuestas', 'automático', 'cuándo', 'envío'],
    body: `<div class="help-article">
<p class="help-intro">Si activaste el envío automático de encuestas, TurnFlow envía el enlace sin que tengas que hacer nada — pero es importante entender cuándo exactamente sucede eso.</p>
<h3>Momentos en que se puede enviar la encuesta</h3>
<ul>
<li><strong>Al completar una cita:</strong> Cuando marcas la cita como "Completada" en tu calendario, el sistema espera el tiempo configurado (inmediatamente o X horas después) y envía la encuesta.</li>
<li><strong>Al marcar un turno como atendido:</strong> Si usas el módulo de colas, cuando marcas un turno como atendido en el panel de asesor se dispara el envío.</li>
<li><strong>Al registrar una venta:</strong> En algunos planes, puedes configurar que se envíe la encuesta al momento de registrar una venta completada.</li>
</ul>
<h3>Requisito para que llegue</h3>
<p>El cliente debe tener un número de teléfono o correo registrado en su perfil. Sin ese dato, el sistema no tiene a dónde enviar la encuesta.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué pasa si el cliente no tiene teléfono registrado?</strong> La encuesta no se envía automáticamente. Por eso es importante siempre pedir el teléfono al cliente.</p>
<p><strong>¿El envío es por WhatsApp o por SMS?</strong> Depende de cómo tengas configurado el canal de comunicación. Si tienes WhatsApp Business integrado, va por ahí; si no, por SMS.</p>
</div></div>`,
    published: true, sort_order: 7,
  },

  // ── MENÚ ────────────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el menú digital y cómo funciona?',
    slug: 'que-es-menu-digital',
    category: 'menu',
    summary: 'Descubre cómo TurnFlow te ayuda a crear un menú digital que los clientes pueden ver desde su celular.',
    tags: ['menú', 'digital', 'pedidos', 'QR', 'restaurante'],
    body: `<div class="help-article">
<p class="help-intro">El menú digital es una versión de tu carta o catálogo que los clientes pueden ver en su celular escaneando un QR — sin tener que pedir un menú físico ni esperar a que alguien los atienda.</p>
<h3>¿Cómo funciona?</h3>
<ol>
<li><strong>Tú creas tu menú en TurnFlow</strong> con los nombres de los platos, precios, fotos y descripciones.</li>
<li><strong>TurnFlow genera un QR y un enlace</strong> únicos para tu menú.</li>
<li><strong>El cliente escanea el QR</strong> (que está en la mesa, en la puerta o en tus redes) y ve tu menú completo en su celular.</li>
<li><strong>Si activas los pedidos</strong>, el cliente puede elegir lo que quiere y enviar el pedido directamente. Tú lo ves en tu panel y lo preparas.</li>
</ol>
<h3>¿Para qué tipo de negocio sirve?</h3>
<p>Restaurantes, cafeterías, food trucks, panaderías, y cualquier negocio que venda productos que se puedan mostrar en una lista con precios y fotos.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente necesita descargar una app para ver el menú?</strong> No. El menú abre directamente en el navegador del celular al escanear el QR.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo crear tu menú digital por primera vez',
    slug: 'crear-menu-digital-primera-vez',
    category: 'menu',
    summary: 'Pasos para configurar y publicar tu menú digital en TurnFlow desde cero.',
    tags: ['menú', 'crear', 'primera vez', 'configurar'],
    body: `<div class="help-article">
<p class="help-intro">Crear tu menú digital en TurnFlow es como armar una lista en tu celular — defines categorías, agregas platos con precios y listo.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Ten a mano los nombres de tus platos o productos, sus precios y una foto de cada uno (opcional pero muy recomendado).</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Menú Digital</strong> en el menú izquierdo. Si no aparece, actívalo en el Marketplace.</li>
<li><strong>Haz clic en "Crear menú"</strong> o en el botón de configuración inicial.</li>
<li><strong>Escribe el nombre de tu menú.</strong> Ejemplo: "Menú Restaurante El Rincón" o simplemente el nombre de tu negocio.</li>
<li><strong>Agrega la descripción del menú (opcional).</strong> Ejemplo: "Comida casera colombiana con amor desde 1995."</li>
<li><strong>Haz clic en Guardar.</strong> Ahora tendrás un menú vacío listo para agregar categorías y platos.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener varios menús?</strong> Dependiendo del plan, sí. Por ejemplo, un menú de almuerzo y uno de cena.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo agregar un plato o producto al menú',
    slug: 'agregar-plato-menu',
    category: 'menu',
    summary: 'Aprende a agregar items a tu menú digital con nombre, precio, foto y descripción.',
    tags: ['menú', 'plato', 'producto', 'agregar', 'precio'],
    body: `<div class="help-article">
<p class="help-intro">Cada plato o producto de tu menú puede tener foto, descripción y precio. Entre más completo esté, más fácil le queda al cliente decidir qué pedir.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Dentro de tu menú, selecciona la categoría</strong> donde quieres agregar el item (ejemplo: "Platos fuertes").</li>
<li><strong>Haz clic en "+ Agregar item" o "+ Nuevo plato".</strong></li>
<li><strong>Escribe el nombre del plato.</strong> Sé descriptivo: "Bandeja paisa completa" es mejor que solo "Bandeja".</li>
<li><strong>Escribe la descripción.</strong> Ejemplo: "Frijoles, chicharrón, huevo frito, chorizo, arroz blanco y aguacate." Una buena descripción vende sola.</li>
<li><strong>Ingresa el precio</strong> en el campo correspondiente.</li>
<li><strong>Sube una foto</strong> haciendo clic en el área de imagen. Usa una foto real del plato — no de internet — para generar confianza.</li>
<li><strong>Haz clic en Guardar.</strong> El plato aparece en el menú inmediatamente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo agregar opciones o modificadores al plato?</strong> Sí. Algunos planes permiten agregar modificadores como "¿Con o sin picante?", "Tamaño: pequeño/grande". Busca la opción "Modificadores" al editar el item.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo organizar el menú en categorías',
    slug: 'organizar-menu-categorias',
    category: 'menu',
    summary: 'Crea categorías como Entradas, Platos fuertes y Bebidas para organizar tu menú.',
    tags: ['menú', 'categorías', 'organizar', 'secciones'],
    body: `<div class="help-article">
<p class="help-intro">Las categorías organizan tu menú en secciones — igual que una carta física. Los clientes navegan más fácil cuando los platos están agrupados por tipo.</p>
<h3>Pasos para crear categorías</h3>
<ol>
<li><strong>Ve a tu menú en TurnFlow.</strong></li>
<li><strong>Haz clic en "+ Nueva categoría".</strong></li>
<li><strong>Escribe el nombre de la categoría.</strong> Ejemplos: "Entradas", "Sopas", "Platos fuertes", "Bebidas", "Postres", "Combos".</li>
<li><strong>Define el orden de la categoría.</strong> Puedes arrastrar las categorías para cambiar el orden en que aparecen en el menú.</li>
<li><strong>Haz clic en Guardar.</strong></li>
<li><strong>Repite para cada categoría</strong> que necesites. Luego agrega los platos dentro de cada una.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener un plato en dos categorías?</strong> No, cada plato pertenece a una sola categoría. Si un item encaja en varias, elige la más relevante.</p>
<p><strong>¿Puedo ocultar una categoría sin borrarla?</strong> Sí. Desactiva la categoría con el interruptor para que no aparezca en el menú público sin perder los items.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo activar o desactivar un item del menú',
    slug: 'activar-desactivar-item-menu',
    category: 'menu',
    summary: 'Aprende a ocultar temporalmente un plato cuando se acaba o no está disponible.',
    tags: ['menú', 'desactivar', 'ocultar', 'disponibilidad'],
    body: `<div class="help-article">
<p class="help-intro">Cuando se acaba un plato o no está disponible ese día, puedes desactivarlo para que no aparezca en el menú — sin tener que borrarlo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a tu menú y encuentra el plato</strong> que quieres desactivar.</li>
<li><strong>Haz clic en el plato</strong> para abrir su edición, o busca el interruptor directamente en la lista del menú.</li>
<li><strong>Desactiva el interruptor "Disponible"</strong> o "Activo". Cambia de verde a gris.</li>
<li><strong>Guarda si es necesario.</strong> El plato desaparece del menú público inmediatamente.</li>
<li><strong>Para reactivarlo</strong>, vuelve a encender el interruptor.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cuánto tarda en actualizarse el menú?</strong> Instantáneamente. Los cambios se reflejan en tiempo real en el menú que ven los clientes.</p>
<p><strong>¿Puedo desactivar todos los items de una categoría a la vez?</strong> Puedes desactivar toda la categoría con su interruptor, lo que oculta todos sus items de golpe.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo ver los pedidos que llegan',
    slug: 'ver-pedidos-llegan',
    category: 'menu',
    summary: 'Aprende a revisar y gestionar los pedidos que hacen los clientes desde tu menú digital.',
    tags: ['menú', 'pedidos', 'ver', 'gestionar'],
    body: `<div class="help-article">
<p class="help-intro">Cuando un cliente hace un pedido desde el menú digital, aparece en tu panel en tiempo real. Puedes verlo, aceptarlo y prepararlo desde ahí.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Menú → Pedidos</strong> en el menú izquierdo. También puede aparecer como una notificación en la campana de alertas.</li>
<li><strong>Verás la lista de pedidos activos</strong> ordenados del más reciente al más antiguo. Cada pedido muestra: número de mesa o nombre del cliente, items pedidos con cantidad y precio, y el total.</li>
<li><strong>Haz clic en un pedido</strong> para ver el detalle completo.</li>
<li><strong>Para aceptar el pedido,</strong> haz clic en "Aceptar" o "En preparación". El cliente ve que su pedido fue recibido.</li>
<li><strong>Cuando el pedido esté listo,</strong> haz clic en "Listo" o "Entregar". El cliente recibe una notificación.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Suena una alarma cuando llega un pedido nuevo?</strong> Sí. El navegador emite un sonido y muestra una notificación si lo tienes permitido. Asegúrate de no silenciar el dispositivo.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo marcar un pedido como listo o entregado',
    slug: 'marcar-pedido-listo',
    category: 'menu',
    summary: 'Actualiza el estado de los pedidos para que los clientes sepan cuándo su pedido está listo.',
    tags: ['menú', 'pedido', 'listo', 'entregado', 'estado'],
    body: `<div class="help-article">
<p class="help-intro">Actualizar el estado del pedido mantiene al cliente informado y evita que venga a preguntar "¿y mi pedido?"</p>
<h3>Flujo de estados de un pedido</h3>
<p>Un pedido pasa por estos estados: <strong>Nuevo → En preparación → Listo → Entregado</strong></p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Menú → Pedidos</strong> y selecciona el pedido activo.</li>
<li><strong>Cuando empieces a prepararlo,</strong> haz clic en <strong>"En preparación"</strong>. El cliente ve "Tu pedido está siendo preparado".</li>
<li><strong>Cuando esté listo para recoger o servir,</strong> haz clic en <strong>"Listo"</strong>. El cliente recibe una notificación: "Tu pedido está listo".</li>
<li><strong>Cuando lo entregues,</strong> haz clic en <strong>"Entregado"</strong>. El pedido se mueve a los pedidos completados del historial.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo cancelar un pedido?</strong> Sí. Haz clic en "Cancelar pedido" y escribe el motivo. El cliente recibirá un aviso de cancelación.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo compartir el menú con tus clientes',
    slug: 'compartir-menu-clientes',
    category: 'menu',
    summary: 'Obtén el QR y el enlace de tu menú para compartirlo en tu local y en redes sociales.',
    tags: ['menú', 'compartir', 'QR', 'enlace', 'redes sociales'],
    body: `<div class="help-article">
<p class="help-intro">Tu menú digital tiene un enlace y un QR únicos. Compártelos en tu local, en Instagram, en WhatsApp o donde quieras para que los clientes lo vean.</p>
<h3>Pasos para obtener el QR y el enlace</h3>
<ol>
<li><strong>Ve a Menú Digital</strong> en el menú izquierdo.</li>
<li><strong>Busca el botón "Ver QR" o "Compartir menú".</strong></li>
<li><strong>Descarga el QR</strong> en PNG de alta resolución para imprimirlo. El tamaño mínimo para que se escanee bien es 8x8 cm.</li>
<li><strong>Copia el enlace</strong> del menú. Es algo como: <em>menu.turnflow.com.co/tu-negocio</em></li>
<li><strong>Coloca el QR impreso</strong> en cada mesa (en un portamenú de acrílico o pegado en la mesa).</li>
<li><strong>Comparte el enlace</strong> en la bio de Instagram, en WhatsApp Business, en tu perfil de Google My Business.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cambia el QR si actualizo el menú?</strong> No. El QR siempre lleva al mismo menú aunque cambies los precios o los platos. Solo necesitas imprimir el QR una vez.</p>
</div></div>`,
    published: true, sort_order: 8,
  },

  // ── COMUNICACIÓN ────────────────────────────────────────────────────────────
  {
    title: 'Cómo enviar un mensaje a un cliente por WhatsApp desde TurnFlow',
    slug: 'enviar-mensaje-whatsapp',
    category: 'comunicacion',
    summary: 'Aprende a contactar a un cliente directamente por WhatsApp desde su perfil en TurnFlow.',
    tags: ['comunicación', 'WhatsApp', 'mensaje', 'cliente'],
    body: `<div class="help-article">
<p class="help-intro">Desde el perfil de cualquier cliente en TurnFlow puedes abrir una conversación de WhatsApp con un clic — sin tener que copiar el número ni salir de la plataforma.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Clientes</strong> en el menú y busca el cliente al que quieres escribir.</li>
<li><strong>Abre el perfil del cliente</strong> haciendo clic en su nombre.</li>
<li><strong>Busca el botón de WhatsApp</strong> — generalmente un ícono verde con el logo de WhatsApp — junto al número de teléfono del cliente.</li>
<li><strong>Haz clic en el ícono de WhatsApp.</strong> Se abrirá WhatsApp en tu celular o en WhatsApp Web en el computador, con el número del cliente ya cargado.</li>
<li><strong>Escribe tu mensaje y envíalo.</strong> La conversación queda en tu WhatsApp normal.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿TurnFlow envía el mensaje por su cuenta o abre WhatsApp?</strong> Abre WhatsApp (app o web) con el número precargado. Tú escribes y envías el mensaje desde tu propia cuenta de WhatsApp.</p>
<p><strong>¿Puedo enviar mensajes masivos a varios clientes?</strong> Lee el artículo "Cómo enviar el mismo mensaje a varios clientes a la vez" para esa función.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo enviar el mismo mensaje a varios clientes a la vez',
    slug: 'mensaje-masivo-clientes',
    category: 'comunicacion',
    summary: 'Aprende a hacer envíos masivos de WhatsApp o SMS a grupos de clientes filtrados.',
    tags: ['comunicación', 'masivo', 'WhatsApp', 'SMS', 'campaña'],
    body: `<div class="help-article">
<p class="help-intro">Los mensajes masivos te permiten llegar a decenas o cientos de clientes con un solo envío — ideal para promociones, recordatorios o avisos importantes.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Los clientes deben tener número de teléfono registrado para recibir el mensaje.</li><li>Algunos planes limitan la cantidad de mensajes masivos por mes.</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Clientes → Comunicaciones</strong> o busca la opción <strong>Envío masivo</strong> en el menú.</li>
<li><strong>Filtra el grupo de clientes</strong> a quienes quieres enviar. Puedes filtrar por: todos los clientes, clientes con tag específico (ejemplo: "clientes frecuentes"), clientes inactivos más de 30 días, clientes con cumpleaños este mes, etc.</li>
<li><strong>Selecciona o crea la plantilla del mensaje.</strong> Puedes usar una plantilla ya guardada o escribir el mensaje ahora.</li>
<li><strong>Previsualiza el mensaje</strong> para asegurarte de que el texto y las variables (como {nombre}) se ven bien.</li>
<li><strong>Haz clic en "Enviar".</strong> El sistema procesará el envío y te mostrará cuántos mensajes se enviaron.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Se pueden bloquear los mensajes masivos por spam?</strong> Si envías demasiados mensajes o los clientes los marcan como spam, WhatsApp puede restringir el número. Por eso es importante enviar solo mensajes relevantes y no abusar de la frecuencia.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo crear una plantilla de mensaje para reutilizar',
    slug: 'crear-plantilla-mensaje',
    category: 'comunicacion',
    summary: 'Crea mensajes prediseñados que puedes usar una y otra vez con variables personalizadas.',
    tags: ['comunicación', 'plantilla', 'mensaje', 'variables', 'WhatsApp'],
    body: `<div class="help-article">
<p class="help-intro">Las plantillas son mensajes que escribes una vez y puedes usar cuantas veces quieras — solo cambian los datos del cliente (nombre, fecha, total) gracias a las variables.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Comunicaciones → Plantillas</strong> en el menú.</li>
<li><strong>Haz clic en "+ Nueva plantilla".</strong></li>
<li><strong>Escribe el nombre interno</strong> de la plantilla. Ejemplo: "Recordatorio de cita" o "Promoción cumpleaños".</li>
<li><strong>Escribe el cuerpo del mensaje.</strong> Usa variables para personalizar: escribe <code>{nombre}</code> donde quieres que aparezca el nombre del cliente, <code>{fecha}</code> para la fecha, <code>{total}</code> para un monto, etc.</li>
<li><strong>Guarda la plantilla.</strong> Ya estará disponible cuando vayas a enviar un mensaje individual o masivo.</li>
</ol>
<h3>Ejemplo de mensaje con variables</h3>
<p>"Hola {nombre}, te recordamos que tienes una cita con nosotros el {fecha} a las {hora}. Si necesitas cambiarla, escríbenos. ¡Te esperamos! — {nombre_negocio}"</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué variables puedo usar?</strong> Las más comunes son: {nombre}, {fecha}, {hora}, {total}, {nombre_negocio}, {servicio}. La lista completa aparece en el editor de plantillas.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo usar el nombre del cliente automáticamente en los mensajes',
    slug: 'variables-mensaje',
    category: 'comunicacion',
    summary: 'Entiende cómo funcionan las variables en los mensajes para personalizar cada envío.',
    tags: ['comunicación', 'variables', 'personalización', 'nombre'],
    body: `<div class="help-article">
<p class="help-intro">Una variable es un "marcador de posición" en el mensaje que se reemplaza automáticamente con el dato real del cliente. Por ejemplo, escribes {nombre} y el sistema lo cambia por "María" o "Carlos" según el cliente.</p>
<h3>¿Cómo se usan las variables?</h3>
<ol>
<li>Al escribir un mensaje o plantilla, escribe la variable entre llaves: <code>{nombre}</code></li>
<li>Cuando el mensaje se envía, el sistema reemplaza <code>{nombre}</code> con el nombre real del cliente.</li>
<li>Si el cliente se llama "Doña Martha", el mensaje dirá "Hola Doña Martha" en lugar de "Hola {nombre}".</li>
</ol>
<h3>Variables más útiles</h3>
<ul>
<li><code>{nombre}</code> — Nombre del cliente</li>
<li><code>{fecha}</code> — Fecha de la cita o evento</li>
<li><code>{hora}</code> — Hora de la cita</li>
<li><code>{total}</code> — Monto de la venta o saldo pendiente</li>
<li><code>{nombre_negocio}</code> — Nombre de tu establecimiento</li>
<li><code>{servicio}</code> — Nombre del servicio agendado</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué pasa si el cliente no tiene nombre registrado?</strong> El sistema enviará el mensaje con el campo vacío o con un texto genérico como "Cliente". Por eso es importante siempre registrar el nombre.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo saber si el cliente recibió tu mensaje',
    slug: 'confirmar-mensaje-recibido',
    category: 'comunicacion',
    summary: 'Verifica el estado de entrega de tus mensajes enviados desde TurnFlow.',
    tags: ['comunicación', 'entregado', 'leído', 'estado', 'WhatsApp'],
    body: `<div class="help-article">
<p class="help-intro">TurnFlow guarda un registro de los mensajes enviados y su estado de entrega para que sepas si llegaron correctamente.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Comunicaciones → Enviados</strong> o al historial de mensajes del cliente.</li>
<li><strong>Busca el mensaje que enviaste.</strong> Verás el estado al lado de cada mensaje.</li>
<li><strong>Lee el estado del mensaje:</strong>
<ul>
<li>✓ <strong>Enviado</strong> — El mensaje salió de TurnFlow hacia la red.</li>
<li>✓✓ <strong>Entregado</strong> — Llegó al celular del cliente.</li>
<li>✓✓ (azul) <strong>Leído</strong> — El cliente lo abrió (solo disponible con WhatsApp Business API).</li>
<li>✗ <strong>Fallido</strong> — No se pudo entregar. El número puede estar incorrecto o sin WhatsApp.</li>
</ul>
</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué hago si el mensaje aparece como "Fallido"?</strong> Verifica que el número del cliente sea correcto y que tenga WhatsApp activo. Si el número tiene prefijo internacional (+57 para Colombia), asegúrate de que esté bien escrito.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: '¿Qué canales de mensajería están disponibles en TurnFlow?',
    slug: 'canales-mensajeria-disponibles',
    category: 'comunicacion',
    summary: 'Conoce los canales de comunicación disponibles en TurnFlow: WhatsApp, SMS y correo electrónico.',
    tags: ['comunicación', 'canales', 'WhatsApp', 'SMS', 'correo'],
    body: `<div class="help-article">
<p class="help-intro">TurnFlow puede enviar mensajes a tus clientes por diferentes canales según lo que tengas configurado y el plan que uses.</p>
<h3>Canales disponibles</h3>
<ul>
<li><strong>WhatsApp (enlace directo):</strong> Abre WhatsApp en el celular o WhatsApp Web con el número del cliente cargado. Gratuito, pero tú escribes y envías manualmente.</li>
<li><strong>WhatsApp Business API:</strong> Envío automático de mensajes desde TurnFlow sin abrir WhatsApp. Permite mensajes masivos, confirmaciones automáticas y recordatorios. Requiere configuración adicional y tiene un costo por mensaje.</li>
<li><strong>SMS:</strong> Mensajes de texto al celular del cliente. Llegan aunque el cliente no tenga WhatsApp. Costo adicional por mensaje.</li>
<li><strong>Correo electrónico:</strong> Para enviar recibos, cotizaciones, confirmaciones de citas y comunicados formales. Incluido en todos los planes.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué canal es mejor?</strong> WhatsApp tiene la tasa de apertura más alta (más del 90% de los mensajes de WhatsApp se leen). El correo es mejor para documentos formales.</p>
<p><strong>¿Cómo configuro WhatsApp Business API?</strong> Ve a Configuración → Integraciones → WhatsApp Business y sigue los pasos. Necesitarás una cuenta de Meta Business.</p>
</div></div>`,
    published: true, sort_order: 6,
  },

  // ── PQRS ────────────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el módulo de PQRS y para qué sirve?',
    slug: 'que-es-pqrs',
    category: 'pqrs',
    summary: 'Entiende qué son las PQRS, por qué son importantes y cómo TurnFlow te ayuda a gestionarlas.',
    tags: ['PQRS', 'petición', 'queja', 'reclamo', 'sugerencia'],
    body: `<div class="help-article">
<p class="help-intro">PQRS significa Peticiones, Quejas, Reclamos y Sugerencias. Es el canal formal para que tus clientes puedan comunicarte algo importante — y tú obligarte a responder.</p>
<h3>¿Qué significa cada letra?</h3>
<ul>
<li><strong>Petición:</strong> El cliente solicita algo. Ejemplo: "Necesito una factura de mi compra de hace 3 meses."</li>
<li><strong>Queja:</strong> El cliente expresa una inconformidad con el servicio. Ejemplo: "Me atendieron mal."</li>
<li><strong>Reclamo:</strong> El cliente exige que se corrija algo. Ejemplo: "Me cobraron de más y quiero el reintegro."</li>
<li><strong>Sugerencia:</strong> El cliente propone una mejora. Ejemplo: "Sería bueno que tuvieran horario los sábados."</li>
</ul>
<h3>¿Por qué es importante?</h3>
<p>En Colombia, ciertos tipos de negocios (especialmente los que prestan servicios públicos o están regulados) están obligados a tener un canal de PQRS. Pero incluso si no eres obligado, tenerlo demuestra profesionalismo y ayuda a retener clientes insatisfechos.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cuánto tiempo tengo para responder una PQRS?</strong> En Colombia, la ley general establece 15 días hábiles para quejas y reclamos. Para copropiedades horizontales, los tiempos pueden ser diferentes según el reglamento. TurnFlow te alerta cuando un caso está próximo a vencer.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo configurar el formulario público de PQRS',
    slug: 'configurar-formulario-pqrs',
    category: 'pqrs',
    summary: 'Personaliza el formulario que ven los clientes cuando quieren enviar una PQRS.',
    tags: ['PQRS', 'formulario', 'configurar', 'personalizar'],
    body: `<div class="help-article">
<p class="help-intro">El formulario de PQRS es la página web donde los clientes envían sus casos. Puedes personalizarlo con el nombre de tu negocio, logo y campos relevantes.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a PQRS</strong> en el menú izquierdo. Si no aparece, actívalo en el Marketplace.</li>
<li><strong>Entra a Configuración del módulo PQRS.</strong></li>
<li><strong>Personaliza el encabezado:</strong> Sube tu logo y escribe el título del formulario. Ejemplo: "Envíanos tu PQRS — Conjunto Residencial Los Andes".</li>
<li><strong>Define los campos del formulario:</strong> Por defecto incluye nombre, tipo de caso (P/Q/R/S), descripción y datos de contacto. Puedes agregar campos adicionales según tus necesidades.</li>
<li><strong>Escribe el mensaje de confirmación</strong> que verá el cliente al enviar. Ejemplo: "Tu caso fue registrado con el número {radicado}. Te responderemos en máximo 15 días hábiles."</li>
<li><strong>Guarda los cambios.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo hacer algunos campos obligatorios?</strong> Sí. Marca la casilla "Requerido" junto a cada campo para que el cliente no pueda enviar el formulario sin completarlo.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo compartir el enlace del formulario con tus clientes',
    slug: 'compartir-enlace-pqrs',
    category: 'pqrs',
    summary: 'Obtén el enlace y QR del formulario de PQRS para publicarlo donde los clientes lo encuentren.',
    tags: ['PQRS', 'enlace', 'QR', 'compartir'],
    body: `<div class="help-article">
<p class="help-intro">Para que los clientes puedan enviarte PQRS, deben conocer el enlace de tu formulario. Compártelo en lugares visibles.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a PQRS → Configuración.</strong></li>
<li><strong>Busca el botón "Ver enlace público" o "Compartir formulario".</strong></li>
<li><strong>Copia el enlace.</strong> Es único para tu negocio.</li>
<li><strong>Comparte el enlace en estos lugares:</strong>
<ul>
<li>En tu sitio web (pie de página o sección de contacto).</li>
<li>En las carteleras del edificio o local.</li>
<li>En el portal de residentes (si es copropiedad).</li>
<li>En el correo de bienvenida a clientes nuevos.</li>
</ul>
</li>
<li><strong>Descarga el QR</strong> para imprimirlo y colocarlo en puntos físicos.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El enlace cambia si edito el formulario?</strong> No. El enlace es permanente.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo ver los casos PQRS recibidos',
    slug: 'ver-casos-pqrs',
    category: 'pqrs',
    summary: 'Accede a la bandeja de entrada de PQRS y revisa todos los casos registrados.',
    tags: ['PQRS', 'casos', 'bandeja', 'ver', 'lista'],
    body: `<div class="help-article">
<p class="help-intro">Todos los casos PQRS recibidos llegan a una bandeja de entrada organizada por fecha y tipo. Desde ahí puedes gestionarlos uno a uno.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a PQRS</strong> en el menú izquierdo.</li>
<li><strong>Verás la lista de todos los casos</strong> con: número de radicado, tipo (P/Q/R/S), nombre del cliente, fecha de ingreso y estado actual (Abierto, En proceso, Resuelto).</li>
<li><strong>Filtra por estado, tipo o fecha</strong> usando los filtros en la parte superior.</li>
<li><strong>Haz clic en cualquier caso</strong> para ver el detalle completo: la descripción del cliente, el historial de respuestas y los documentos adjuntos.</li>
<li><strong>Ordena por fecha de vencimiento</strong> para atender primero los casos más urgentes.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo asignar un caso a un empleado específico?</strong> Sí. Dentro del caso, busca el campo "Asignado a" y selecciona el usuario responsable de atenderlo.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo responderle a un cliente sobre su caso PQRS',
    slug: 'responder-caso-pqrs',
    category: 'pqrs',
    summary: 'Aprende a enviar respuestas al cliente y a agregar notas internas en un caso PQRS.',
    tags: ['PQRS', 'responder', 'nota', 'pública', 'interna'],
    body: `<div class="help-article">
<p class="help-intro">Cada caso tiene dos tipos de mensajes: la respuesta pública (que el cliente lee) y la nota interna (que solo ve tu equipo).</p>
<h3>Para enviar una respuesta al cliente</h3>
<ol>
<li><strong>Abre el caso</strong> desde la lista de PQRS.</li>
<li><strong>Busca el área de respuesta</strong> en la parte inferior del caso.</li>
<li><strong>Selecciona "Respuesta pública".</strong></li>
<li><strong>Escribe tu respuesta.</strong> Sé claro y específico — el cliente verá exactamente lo que escribes.</li>
<li><strong>Haz clic en Enviar.</strong> El cliente recibirá la respuesta por correo y podrá verla en el enlace de seguimiento de su caso.</li>
</ol>
<h3>Para agregar una nota interna</h3>
<ol>
<li>En el mismo campo de respuesta, selecciona <strong>"Nota interna"</strong>.</li>
<li>Escribe la nota para tu equipo. Ejemplo: "Revisé la factura — el cliente tiene razón, hay que hacer el reintegro."</li>
<li>Haz clic en Guardar nota. Solo los usuarios de TurnFlow pueden ver esta nota, no el cliente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente puede ver las notas internas?</strong> No. Las notas internas son solo para el equipo interno. Solo las respuestas públicas son visibles para el cliente.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo cambiar el estado de un caso PQRS',
    slug: 'cambiar-estado-caso-pqrs',
    category: 'pqrs',
    summary: 'Actualiza el estado de un caso entre Abierto, En proceso y Resuelto para mantener la gestión organizada.',
    tags: ['PQRS', 'estado', 'abierto', 'resuelto', 'en proceso'],
    body: `<div class="help-article">
<p class="help-intro">Cambiar el estado del caso te permite organizar tu trabajo y cumplir con los tiempos de respuesta. El cliente también puede ver el estado para saber cómo va su caso.</p>
<h3>Los estados de un caso PQRS</h3>
<ul>
<li><strong>Abierto:</strong> El caso llegó pero aún no ha sido atendido.</li>
<li><strong>En proceso:</strong> Estás trabajando en la respuesta o solución.</li>
<li><strong>Resuelto:</strong> Diste respuesta definitiva al cliente.</li>
<li><strong>Cerrado:</strong> El caso fue cerrado (puede ser resuelto o no procedente).</li>
</ul>
<h3>Pasos para cambiar el estado</h3>
<ol>
<li><strong>Abre el caso</strong> desde la lista de PQRS.</li>
<li><strong>Busca el selector de estado</strong> en la esquina superior derecha del caso. Muestra el estado actual (ejemplo: "Abierto").</li>
<li><strong>Haz clic en el selector</strong> y elige el nuevo estado.</li>
<li><strong>Guarda el cambio.</strong> El historial del caso registra quién cambió el estado y cuándo.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente recibe notificación cuando cambio el estado?</strong> Sí, si así lo configuraste. El cliente puede recibir un correo cada vez que el estado de su caso cambia.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: '¿Qué es el número de radicado de una PQRS?',
    slug: 'numero-radicado-pqrs',
    category: 'pqrs',
    summary: 'Entiende qué es el número de radicado y cómo el cliente puede usarlo para hacer seguimiento.',
    tags: ['PQRS', 'radicado', 'número', 'seguimiento'],
    body: `<div class="help-article">
<p class="help-intro">El número de radicado es como el número de turno de un caso PQRS — es el identificador único que le permite al cliente hacer seguimiento de su caso sin confusiones.</p>
<h3>¿Cómo funciona el radicado?</h3>
<ol>
<li>Cuando el cliente envía una PQRS, el sistema genera automáticamente un número de radicado único. Ejemplo: PQRS-2024-00342.</li>
<li>El cliente recibe ese número en la pantalla de confirmación y en su correo electrónico.</li>
<li>Con ese número, el cliente puede consultar el estado de su caso en cualquier momento en el enlace de seguimiento.</li>
<li>Tú también puedes buscar casos por número de radicado en la bandeja de PQRS.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo personalizar el formato del número de radicado?</strong> En algunos planes sí. Por ejemplo, puedes configurarlo para que incluya el año y un número consecutivo: 2024-001, 2024-002, etc.</p>
<p><strong>¿Qué pasa si el cliente pierde su número de radicado?</strong> Puedes buscarlo por nombre o correo electrónico en la bandeja de PQRS y decirle su número.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: '¿Qué es el SLA y por qué importa en las PQRS?',
    slug: 'sla-pqrs',
    category: 'pqrs',
    summary: 'Entiende qué es el tiempo de respuesta (SLA) y cómo TurnFlow te ayuda a cumplirlo.',
    tags: ['PQRS', 'SLA', 'tiempo de respuesta', 'vencimiento'],
    body: `<div class="help-article">
<p class="help-intro">SLA significa "Service Level Agreement" — en español simple es el tiempo máximo que tienes para responder un caso. Si se vence y no has respondido, el cliente tiene derecho a escalar o reclamar.</p>
<h3>¿Cómo funciona el SLA en TurnFlow?</h3>
<ol>
<li>Cuando configuras el módulo de PQRS, defines cuántos días hábiles tienes para responder cada tipo de caso (Petición, Queja, Reclamo, Sugerencia).</li>
<li>TurnFlow cuenta los días hábiles desde que se radica el caso y calcula la fecha de vencimiento.</li>
<li>Cuando un caso está próximo a vencer (por defecto, 2 días antes), el sistema te envía una alerta.</li>
<li>Los casos próximos a vencer aparecen destacados en rojo en tu bandeja de PQRS.</li>
</ol>
<h3>¿Qué tiempos son los estándar en Colombia?</h3>
<ul>
<li>Quejas y reclamos: 15 días hábiles (Ley 1480)</li>
<li>Peticiones a entidades públicas: 15 días hábiles</li>
<li>Peticiones a privados: no hay un tiempo legal estricto, pero 10-15 días es la práctica recomendada</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo configurar tiempos diferentes para cada tipo de caso?</strong> Sí. En la configuración de PQRS puedes poner tiempos diferentes para P, Q, R y S.</p>
</div></div>`,
    published: true, sort_order: 8,
  },
  {
    title: 'Cómo configurar los tiempos de respuesta para cada tipo de caso',
    slug: 'configurar-sla-pqrs',
    category: 'pqrs',
    summary: 'Define cuántos días hábiles tienes para responder peticiones, quejas, reclamos y sugerencias.',
    tags: ['PQRS', 'SLA', 'configurar', 'días', 'tiempo'],
    body: `<div class="help-article">
<p class="help-intro">Cada tipo de caso puede tener un tiempo de respuesta diferente. Configúralos una sola vez y TurnFlow calculará la fecha de vencimiento automáticamente.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a PQRS → Configuración.</strong></li>
<li><strong>Busca la sección "Tiempos de respuesta" o "SLA".</strong></li>
<li><strong>Ingresa el número de días hábiles</strong> para cada tipo de caso:
<ul>
<li>Petición: ___ días hábiles</li>
<li>Queja: ___ días hábiles</li>
<li>Reclamo: ___ días hábiles</li>
<li>Sugerencia: ___ días hábiles</li>
</ul>
</li>
<li><strong>Define cuándo alertar antes del vencimiento.</strong> Ejemplo: 2 días antes del vencimiento enviar alerta al responsable.</li>
<li><strong>Guarda los cambios.</strong> A partir de ese momento, todos los casos nuevos tendrán fecha de vencimiento calculada automáticamente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Los días son hábiles o calendario?</strong> Por defecto son días hábiles (excluye sábados, domingos y festivos colombianos). Puedes cambiar esto en la configuración.</p>
</div></div>`,
    published: true, sort_order: 9,
  },
  {
    title: 'Cómo agregar una nota interna a un caso PQRS',
    slug: 'nota-interna-caso-pqrs',
    category: 'pqrs',
    summary: 'Deja comentarios internos en un caso que solo tu equipo puede ver, sin que el cliente los lea.',
    tags: ['PQRS', 'nota interna', 'comentario', 'equipo'],
    body: `<div class="help-article">
<p class="help-intro">Las notas internas son mensajes dentro del caso que solo ven tú y tu equipo — perfectas para coordinar, dejar contexto o documentar acciones sin que el cliente lo sepa.</p>
<h3>¿Para qué sirven las notas internas?</h3>
<ul>
<li>Dejar instrucciones para tu equipo: "Contactar al proveedor antes de responder".</li>
<li>Documentar acciones tomadas: "Revisé la factura y el error fue nuestro".</li>
<li>Coordinar la respuesta: "Andrés se encarga de responder este caso".</li>
</ul>
<h3>Pasos</h3>
<ol>
<li><strong>Abre el caso PQRS</strong> desde la bandeja.</li>
<li><strong>En la sección de respuesta</strong>, selecciona la pestaña o el selector que dice <strong>"Nota interna"</strong> (a veces aparece como "Nota privada" o "Comentario interno").</li>
<li><strong>Escribe la nota.</strong></li>
<li><strong>Haz clic en Guardar nota.</strong> La nota aparece en el historial del caso con un fondo diferente (generalmente amarillo o gris) para distinguirla de las respuestas públicas.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo editar o eliminar una nota interna después?</strong> Dependiendo de la configuración, sí. Algunos planes permiten editar notas propias pero no las de otros usuarios.</p>
</div></div>`,
    published: true, sort_order: 10,
  },
]
