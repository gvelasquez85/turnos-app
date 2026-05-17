// Part 3: Copropiedades, Contabilidad, Facturación, Copilot, Configuración, Marketplace, Reportes
export const ARTICLES_PART3 = [
  // ── COPROPIEDADES ──────────────────────────────────────────────────────────
  {
    title: '¿Para qué sirve el módulo de copropiedades?',
    slug: 'para-que-sirve-copropiedades',
    category: 'copropiedades',
    summary: 'Descubre cómo TurnFlow ayuda a administrar conjuntos residenciales, edificios y copropiedades.',
    tags: ['copropiedades', 'conjunto', 'edificio', 'administración'],
    body: `<div class="help-article">
<p class="help-intro">El módulo de copropiedades de TurnFlow es una herramienta diseñada para que administradores de conjuntos residenciales, edificios y parques industriales gestionen todo en un solo lugar.</p>
<h3>¿Qué puedes hacer con este módulo?</h3>
<ul>
<li><strong>Gestionar las unidades:</strong> Registra cada apartamento, casa u oficina con su propietario, coeficiente y datos de contacto.</li>
<li><strong>Cuotas de administración:</strong> Genera las cuotas mensuales automáticamente proporcional al coeficiente de cada unidad y lleva control de pagos y morosos.</li>
<li><strong>Espacios comunes:</strong> Administra reservas del salón comunal, piscina, cancha, BBQ y otros espacios.</li>
<li><strong>Asambleas:</strong> Convoca, valida quórum y registra votaciones de las asambleas ordinarias y extraordinarias.</li>
<li><strong>PQRS de residentes:</strong> Canal formal para peticiones, quejas y reclamos de la comunidad.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Es solo para conjuntos residenciales?</strong> No. También sirve para edificios de oficinas, centros comerciales, parques industriales y cualquier propiedad horizontal que tenga gastos comunes y órganos de gobierno.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo registrar las unidades del conjunto',
    slug: 'registrar-unidades-conjunto',
    category: 'copropiedades',
    summary: 'Aprende a crear y configurar cada apartamento, casa u oficina de tu copropiedad en TurnFlow.',
    tags: ['copropiedades', 'unidades', 'apartamento', 'coeficiente'],
    body: `<div class="help-article">
<p class="help-intro">Las unidades son los apartamentos, casas u oficinas de tu copropiedad. Cada una tiene un coeficiente que determina cuánto paga de cuota de administración.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Ten el manual de convivencia o el reglamento de propiedad horizontal con el coeficiente de cada unidad.</li><li>El coeficiente es un porcentaje (ejemplo: 2.35%) que indica la participación de cada unidad en los gastos comunes. La suma de todos los coeficientes debe ser 100%.</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Unidades</strong> en el menú.</li>
<li><strong>Haz clic en "+ Nueva unidad".</strong></li>
<li><strong>Ingresa el número o nombre de la unidad.</strong> Ejemplo: "Apto 101", "Casa 15", "Local 3B".</li>
<li><strong>Ingresa el coeficiente</strong> en el campo correspondiente. Escribe el número tal como está en el reglamento. Ejemplo: 2.35</li>
<li><strong>Registra el propietario:</strong> Busca el propietario en la base de clientes o créalo nuevo con nombre, teléfono y correo.</li>
<li><strong>Indica si hay arrendatario</strong> (si la unidad está en arriendo). Puedes registrar también los datos del arrendatario.</li>
<li><strong>Haz clic en Guardar.</strong> Repite para cada unidad.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo importar las unidades desde Excel?</strong> Sí. Busca el botón "Importar unidades" en la pantalla de Unidades para subir un archivo CSV con todas las unidades de una vez.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo generar las cuotas de administración del mes',
    slug: 'generar-cuotas-administracion',
    category: 'copropiedades',
    summary: 'Aprende a generar automáticamente las cuotas de administración para todas las unidades.',
    tags: ['copropiedades', 'cuotas', 'administración', 'generar', 'cobro'],
    body: `<div class="help-article">
<p class="help-intro">En lugar de calcular manualmente lo que debe cada unidad, TurnFlow genera las cuotas automáticamente usando el coeficiente de cada apartamento.</p>
<h3>¿Cómo funciona el cálculo?</h3>
<p>Cuota de cada unidad = Presupuesto mensual total × (Coeficiente de la unidad ÷ 100)</p>
<p>Ejemplo: Si el presupuesto mensual es $10.000.000 y el apartamento 101 tiene coeficiente 2.35%, su cuota es: $10.000.000 × 0.0235 = $235.000.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Cuotas.</strong></li>
<li><strong>Haz clic en "Generar cuotas del mes".</strong></li>
<li><strong>Selecciona el mes y año</strong> para el que generas las cuotas.</li>
<li><strong>Ingresa el valor base del presupuesto mensual.</strong> Este es el total que necesitas recaudar para cubrir los gastos del mes.</li>
<li><strong>Haz clic en "Generar".</strong> TurnFlow calculará automáticamente la cuota de cada unidad según su coeficiente y creará un cobro pendiente para cada una.</li>
<li><strong>Revisa el resumen</strong> antes de confirmar. Verás el detalle de cuánto le corresponde a cada unidad.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ajustar la cuota de una unidad específica?</strong> Sí. Después de generar, puedes entrar a la cuota de una unidad y modificar el valor manualmente si hay alguna excepción.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo registrar el pago de una cuota de administración',
    slug: 'registrar-pago-cuota',
    category: 'copropiedades',
    summary: 'Aprende a marcar como pagada la cuota de un apartamento cuando el propietario cancela.',
    tags: ['copropiedades', 'pago', 'cuota', 'registrar'],
    body: `<div class="help-article">
<p class="help-intro">Cuando un propietario paga su cuota de administración, debes registrarlo en TurnFlow para que quede fuera de la lista de morosos y puedas llevar el control exacto del recaudo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Cuotas.</strong></li>
<li><strong>Filtra por el período (mes) correspondiente.</strong></li>
<li><strong>Busca la unidad que pagó</strong> en la lista. Aparece con estado "Pendiente".</li>
<li><strong>Haz clic en la unidad o en el botón "Registrar pago".</strong></li>
<li><strong>Ingresa los datos del pago:</strong> fecha, monto, método de pago (transferencia, efectivo, PSE) y número de comprobante o referencia bancaria.</li>
<li><strong>Haz clic en Confirmar.</strong> La cuota cambia a estado "Pagada" y el propietario queda al día.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo enviar el recibo de pago al propietario?</strong> Sí. Después de registrar el pago, busca el botón "Enviar recibo" para mandarlo por correo o WhatsApp al propietario.</p>
<p><strong>¿Qué pasa si el propietario pagó un valor diferente al de la cuota?</strong> Puedes registrar el valor exacto que pagó. Si pagó menos, quedará como "Pago parcial" con saldo pendiente.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo ver la lista de morosos',
    slug: 'ver-lista-morosos',
    category: 'copropiedades',
    summary: 'Consulta qué unidades están atrasadas en el pago de sus cuotas de administración.',
    tags: ['copropiedades', 'morosos', 'deuda', 'pendiente', 'cartera'],
    body: `<div class="help-article">
<p class="help-intro">La lista de morosos te muestra quién le debe a la copropiedad, cuánto y desde cuándo — para que puedas hacer el cobro de cartera de manera organizada.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Cuotas.</strong></li>
<li><strong>Filtra por estado "Pendiente" o "Vencida".</strong></li>
<li><strong>Verás la lista de unidades con cuotas sin pagar,</strong> con el detalle de: unidad, propietario, meses vencidos, monto total adeudado y días de mora.</li>
<li><strong>Haz clic en una unidad morosa</strong> para ver el detalle de qué períodos debe.</li>
<li><strong>Desde ahí puedes enviar un recordatorio</strong> al propietario por WhatsApp o correo con el total adeudado.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo cobrar intereses por mora?</strong> Sí. En la configuración de Cuotas puedes definir un porcentaje de interés por mora mensual. El sistema lo calcula automáticamente sobre el saldo vencido.</p>
<p><strong>¿Puedo exportar la lista de morosos a Excel?</strong> Sí. Usa el botón Exportar en la pantalla de cuotas filtrada por pendientes.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo registrar una reserva de espacio común',
    slug: 'reservar-espacio-comun',
    category: 'copropiedades',
    summary: 'Gestiona las reservas del salón comunal, BBQ, piscina y otros espacios comunes.',
    tags: ['copropiedades', 'espacios', 'reserva', 'salón', 'BBQ'],
    body: `<div class="help-article">
<p class="help-intro">El módulo de espacios comunes te permite llevar un control ordenado de quién usa el salón comunal, la piscina u otros espacios — evitando conflictos de doble reserva.</p>
<h3>Pasos para crear una reserva</h3>
<ol>
<li><strong>Ve a Copropiedades → Espacios comunes.</strong></li>
<li><strong>Selecciona el espacio</strong> que quieres reservar (ejemplo: "Salón comunal").</li>
<li><strong>Haz clic en la fecha deseada</strong> en el calendario del espacio.</li>
<li><strong>Haz clic en "+ Nueva reserva".</strong></li>
<li><strong>Selecciona la unidad</strong> que hace la reserva y el propietario o residente responsable.</li>
<li><strong>Define el rango horario</strong> de la reserva (hora inicio y hora fin).</li>
<li><strong>Haz clic en Confirmar reserva.</strong> El espacio queda bloqueado para esa fecha y hora.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Los residentes pueden hacer la reserva ellos mismos?</strong> Sí, si activas el portal de residentes. Ellos ingresan con su correo y pueden ver la disponibilidad y reservar directamente.</p>
<p><strong>¿Se pueden cobrar las reservas?</strong> Sí. En la configuración del espacio puedes definir una tarifa por reserva que se agrega automáticamente a la cuenta de la unidad.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo convocar una asamblea',
    slug: 'convocar-asamblea',
    category: 'copropiedades',
    summary: 'Crea una asamblea ordinaria o extraordinaria y registra los asistentes y votaciones.',
    tags: ['copropiedades', 'asamblea', 'convocar', 'quórum', 'votación'],
    body: `<div class="help-article">
<p class="help-intro">Las asambleas son la máxima autoridad de la copropiedad. TurnFlow te ayuda a convocarlas, registrar asistencia, validar quórum y documentar las votaciones.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Asambleas.</strong></li>
<li><strong>Haz clic en "+ Nueva asamblea".</strong></li>
<li><strong>Selecciona el tipo:</strong> Ordinaria (anual) o Extraordinaria (cuando surge una necesidad urgente).</li>
<li><strong>Define la fecha, hora y lugar</strong> de la asamblea.</li>
<li><strong>Agrega el orden del día</strong> (los temas a tratar). Ejemplo: "1. Aprobación de presupuesto. 2. Elección del consejo. 3. Varios."</li>
<li><strong>Establece el quórum requerido</strong> en porcentaje de coeficiente (ejemplo: 50% + 1 de los coeficientes para quórum decisorio).</li>
<li><strong>Haz clic en Guardar.</strong> La asamblea queda programada y puedes comenzar a registrar asistentes el día del evento.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cómo registro la asistencia el día de la asamblea?</strong> En la asamblea, ve a la pestaña "Asistentes" y marca cada unidad que se registra. El sistema suma los coeficientes automáticamente y muestra si hay quórum.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo validar el quórum de una asamblea',
    slug: 'validar-quorum-asamblea',
    category: 'copropiedades',
    summary: 'Verifica en tiempo real si la asamblea tiene el quórum necesario para sesionar y tomar decisiones.',
    tags: ['copropiedades', 'quórum', 'asamblea', 'coeficiente'],
    body: `<div class="help-article">
<p class="help-intro">El quórum es el porcentaje mínimo de coeficiente representado en la asamblea para que esta sea válida. TurnFlow lo calcula automáticamente mientras registras asistentes.</p>
<h3>¿Cómo funciona el cálculo de quórum?</h3>
<p>A medida que marcas cada unidad como presente, el sistema suma sus coeficientes. Cuando la suma llega al porcentaje de quórum requerido (ejemplo: 50.01%), la barra de quórum se pone verde y la asamblea puede sesionar.</p>
<h3>Pasos para validar el quórum</h3>
<ol>
<li><strong>Abre la asamblea programada</strong> en Copropiedades → Asambleas.</li>
<li><strong>Ve a la pestaña "Asistencia".</strong></li>
<li><strong>A medida que llegan los propietarios, márcalos como presentes</strong> haciendo clic en el nombre de la unidad.</li>
<li><strong>Observa la barra de quórum</strong> en la parte superior. Muestra el porcentaje de coeficiente presente en tiempo real.</li>
<li><strong>Cuando la barra llega al mínimo requerido</strong>, aparece el mensaje "Quórum alcanzado — la asamblea puede sesionar".</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Los poderes (representaciones) se pueden registrar?</strong> Sí. Al marcar un propietario como presente, puedes indicar si viene en persona o está representado por poder. El coeficiente se suma igual.</p>
</div></div>`,
    published: true, sort_order: 8,
  },
  {
    title: 'Cómo registrar una votación en la asamblea',
    slug: 'registrar-votacion-asamblea',
    category: 'copropiedades',
    summary: 'Documenta las votaciones de la asamblea con resultados ponderados por coeficiente.',
    tags: ['copropiedades', 'votación', 'asamblea', 'resultado', 'coeficiente'],
    body: `<div class="help-article">
<p class="help-intro">En una asamblea, cada unidad vota con el peso de su coeficiente. TurnFlow registra los votos y calcula los resultados ponderados automáticamente.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Durante la asamblea, ve a la pestaña "Votaciones".</strong></li>
<li><strong>Haz clic en "+ Nueva votación".</strong></li>
<li><strong>Escribe el tema a votar.</strong> Ejemplo: "Aprobación del presupuesto 2025 por $250.000.000".</li>
<li><strong>Abre la votación:</strong> Haz clic en "Iniciar votación". Los asistentes presentes pueden emitir su voto.</li>
<li><strong>Registra el voto de cada unidad:</strong> A favor, En contra o Abstención.</li>
<li><strong>Cierra la votación</strong> cuando todos hayan votado.</li>
<li><strong>Lee los resultados:</strong> TurnFlow muestra el porcentaje de coeficiente que votó a favor, en contra y se abstuvo. Si el porcentaje a favor supera el umbral requerido (generalmente 50% + 1 del quórum presente), la decisión es aprobada.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener varias votaciones en la misma asamblea?</strong> Sí. Puedes crear tantas votaciones como puntos del orden del día lo requieran.</p>
</div></div>`,
    published: true, sort_order: 9,
  },
  {
    title: 'Cómo generar el acta de la asamblea',
    slug: 'generar-acta-asamblea',
    category: 'copropiedades',
    summary: 'Genera automáticamente el acta oficial de la asamblea con todos los datos registrados.',
    tags: ['copropiedades', 'acta', 'asamblea', 'documento', 'PDF'],
    body: `<div class="help-article">
<p class="help-intro">El acta es el documento legal que certifica lo que pasó en la asamblea. TurnFlow la genera automáticamente con los datos de asistencia, quórum y votaciones que registraste.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Al finalizar la asamblea</strong>, ve a la asamblea en TurnFlow.</li>
<li><strong>Haz clic en "Finalizar asamblea".</strong> Esto cierra el registro de asistencia y votaciones.</li>
<li><strong>Haz clic en "Generar acta".</strong></li>
<li><strong>Revisa el borrador del acta</strong> que TurnFlow genera automáticamente. Incluye: fecha, lugar, asistentes, quórum validado, orden del día y resultado de cada votación.</li>
<li><strong>Edita si necesitas</strong> agregar algún detalle adicional en el campo de texto libre.</li>
<li><strong>Descarga el acta en PDF</strong> para firmarla y archivarla.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El acta tiene validez legal?</strong> El acta generada contiene toda la información requerida. Para que tenga plena validez legal, debe ser firmada por el presidente y secretario de la asamblea según lo establecido en el reglamento de propiedad horizontal.</p>
</div></div>`,
    published: true, sort_order: 10,
  },
  {
    title: 'Cómo enviar comunicados a los residentes',
    slug: 'enviar-comunicados-residentes',
    category: 'copropiedades',
    summary: 'Notifica a todos los residentes sobre eventos, mantenimientos o decisiones importantes.',
    tags: ['copropiedades', 'comunicado', 'residentes', 'notificación', 'circular'],
    body: `<div class="help-article">
<p class="help-intro">Cuando necesitas informarle algo a toda la comunidad — un corte de agua, una asamblea, un mantenimiento — puedes enviar un comunicado a todos los residentes de una vez.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Comunicados</strong> o a Comunicaciones → Envío masivo filtrado por residentes.</li>
<li><strong>Haz clic en "+ Nuevo comunicado".</strong></li>
<li><strong>Escribe el asunto</strong> del comunicado. Ejemplo: "Mantenimiento de ascensores — jueves 23 de mayo".</li>
<li><strong>Escribe el cuerpo del mensaje.</strong> Sé claro y específico con horarios, zonas afectadas e instrucciones.</li>
<li><strong>Selecciona los destinatarios:</strong> Todos los residentes, solo propietarios, solo arrendatarios, o filtrado por torre o bloque.</li>
<li><strong>Elige el canal:</strong> Correo electrónico, WhatsApp o ambos.</li>
<li><strong>Haz clic en Enviar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo programar el comunicado para que se envíe después?</strong> Sí. Usa la opción "Programar envío" y define la fecha y hora en que quieres que salga.</p>
</div></div>`,
    published: true, sort_order: 11,
  },
  {
    title: 'Cómo registrar un gasto del conjunto',
    slug: 'registrar-gasto-conjunto',
    category: 'copropiedades',
    summary: 'Documenta los gastos del conjunto para llevar la contabilidad de la copropiedad.',
    tags: ['copropiedades', 'gasto', 'contabilidad', 'registro'],
    body: `<div class="help-article">
<p class="help-intro">Para que la contabilidad de la copropiedad cuadre, debes registrar cada gasto que hagas con el dinero de las cuotas: servicios públicos, mantenimientos, personal de vigilancia, etc.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Contabilidad</strong> o <strong>Copropiedades → Gastos.</strong></li>
<li><strong>Haz clic en "+ Nuevo gasto".</strong></li>
<li><strong>Selecciona la categoría del gasto:</strong> Servicios públicos, Mantenimiento, Nómina, Administración, Otros.</li>
<li><strong>Describe el gasto:</strong> Ejemplo: "Pago de servicio de vigilancia — mayo 2025".</li>
<li><strong>Ingresa el monto y la fecha del pago.</strong></li>
<li><strong>Sube el comprobante (factura o recibo)</strong> como imagen o PDF.</li>
<li><strong>Haz clic en Guardar.</strong> El gasto queda registrado en la contabilidad del conjunto para el período correspondiente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ver el balance (ingresos vs gastos) del conjunto?</strong> Sí. En la sección de Contabilidad o Reportes hay un informe de ingresos (cuotas recaudadas) vs gastos del período seleccionado.</p>
</div></div>`,
    published: true, sort_order: 12,
  },
  {
    title: 'Cómo ver el estado de cuenta de una unidad',
    slug: 'estado-cuenta-unidad',
    category: 'copropiedades',
    summary: 'Consulta el detalle de pagos y saldos pendientes de un apartamento específico.',
    tags: ['copropiedades', 'estado de cuenta', 'unidad', 'saldo', 'historial'],
    body: `<div class="help-article">
<p class="help-intro">El estado de cuenta de una unidad es el historial completo de cuotas generadas, pagos realizados y saldo pendiente — como un extracto bancario pero de la copropiedad.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Unidades.</strong></li>
<li><strong>Busca y haz clic en la unidad</strong> cuyo estado de cuenta quieres ver.</li>
<li><strong>Ve a la pestaña "Estado de cuenta" o "Historial de pagos".</strong></li>
<li><strong>Verás la lista cronológica:</strong> Cada período con el valor de la cuota, la fecha de pago (si pagó) y el saldo pendiente acumulado.</li>
<li><strong>Para enviar el estado de cuenta al propietario,</strong> haz clic en "Enviar por correo" o "Enviar por WhatsApp".</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo descargar el estado de cuenta en PDF?</strong> Sí. Haz clic en "Descargar PDF" para obtener el documento listo para imprimir o enviar.</p>
</div></div>`,
    published: true, sort_order: 13,
  },
  {
    title: 'Cómo configurar los espacios comunes del conjunto',
    slug: 'configurar-espacios-comunes',
    category: 'copropiedades',
    summary: 'Crea y configura los espacios comunes disponibles para reserva por los residentes.',
    tags: ['copropiedades', 'espacios comunes', 'configurar', 'salón', 'BBQ'],
    body: `<div class="help-article">
<p class="help-intro">Antes de que los residentes puedan reservar espacios, debes crear cada espacio y definir sus reglas: horarios disponibles, capacidad máxima, si requiere aprobación y si tiene costo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Espacios comunes → Configuración.</strong></li>
<li><strong>Haz clic en "+ Nuevo espacio".</strong></li>
<li><strong>Escribe el nombre del espacio.</strong> Ejemplo: "Salón comunal", "BBQ zona 1", "Cancha múltiple".</li>
<li><strong>Define la capacidad máxima</strong> (número máximo de personas).</li>
<li><strong>Define el horario disponible</strong> para reservas: días de la semana y rango de horas.</li>
<li><strong>Activa "Requiere aprobación"</strong> si prefieres revisar y aprobar cada reserva manualmente antes de confirmarla.</li>
<li><strong>Define el costo por reserva</strong> si el espacio tiene tarifa. Puedes dejarlo en $0 si es gratuito.</li>
<li><strong>Haz clic en Guardar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener el mismo espacio pero con diferentes tarifas según el día?</strong> Dependiendo del plan, puedes configurar tarifas diferenciadas por día de semana (ejemplo: más caro en fin de semana).</p>
</div></div>`,
    published: true, sort_order: 14,
  },
  {
    title: 'Cómo ver el reporte financiero del conjunto',
    slug: 'reporte-financiero-conjunto',
    category: 'copropiedades',
    summary: 'Genera el informe mensual o anual de ingresos, gastos y balance de la copropiedad.',
    tags: ['copropiedades', 'reporte', 'financiero', 'balance', 'ingresos'],
    body: `<div class="help-article">
<p class="help-intro">El reporte financiero es el resumen contable del conjunto: cuánto se recaudó, cuánto se gastó y si hay superávit o déficit. Es el documento principal para las asambleas.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Copropiedades → Reportes</strong> o <strong>Copropiedades → Contabilidad → Informes.</strong></li>
<li><strong>Selecciona el tipo de reporte:</strong> Mensual o Anual.</li>
<li><strong>Selecciona el período.</strong></li>
<li><strong>El reporte mostrará:</strong>
<ul>
<li>Total de cuotas generadas (lo que se debía recaudar)</li>
<li>Total recaudado (lo que efectivamente pagaron)</li>
<li>Total de gastos del período</li>
<li>Balance: recaudado menos gastos</li>
<li>Cartera: cuotas pendientes de cobro</li>
</ul>
</li>
<li><strong>Descarga el informe en PDF o Excel</strong> para presentarlo en la asamblea.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El reporte incluye el detalle de cada gasto?</strong> Sí. En el desglose de gastos aparece cada registro con su descripción, fecha y monto.</p>
</div></div>`,
    published: true, sort_order: 15,
  },

  // ── CONTABILIDAD ────────────────────────────────────────────────────────────
  {
    title: '¿Para qué sirve el módulo de contabilidad?',
    slug: 'para-que-sirve-contabilidad',
    category: 'contabilidad',
    summary: 'Descubre cómo TurnFlow te ayuda a llevar el control de ingresos y gastos de tu negocio.',
    tags: ['contabilidad', 'ingresos', 'gastos', 'balance'],
    body: `<div class="help-article">
<p class="help-intro">El módulo de contabilidad de TurnFlow no es para contadores — es para el microempresario que quiere saber si su negocio está ganando o perdiendo dinero sin necesitar un título universitario.</p>
<h3>¿Qué puedes hacer?</h3>
<ul>
<li><strong>Registrar ingresos:</strong> Ventas, servicios, arriendos u otros ingresos del negocio.</li>
<li><strong>Registrar gastos:</strong> Arriendo, nómina, servicios públicos, materia prima, etc.</li>
<li><strong>Ver el balance:</strong> Ingresos menos gastos = utilidad (o pérdida) del período.</li>
<li><strong>Categorizar transacciones:</strong> Agrupa los movimientos por categoría para entender en qué gastas más.</li>
<li><strong>Generar reportes:</strong> Informe mensual, estado de resultados, flujo de caja.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿TurnFlow reemplaza a mi contador?</strong> No. TurnFlow te da la información del día a día. Tu contador seguirá necesitando esa información para hacer la declaración de renta y los estados financieros formales.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo registrar un gasto en TurnFlow',
    slug: 'registrar-gasto',
    category: 'contabilidad',
    summary: 'Aprende a registrar los gastos de tu negocio para llevar un control contable básico.',
    tags: ['contabilidad', 'gasto', 'registrar', 'egreso'],
    body: `<div class="help-article">
<p class="help-intro">Cada pago que haces por tu negocio es un gasto que debes registrar. Si no lo haces, al final del mes no sabrás realmente cuánto ganaste.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad</strong> en el menú izquierdo.</li>
<li><strong>Haz clic en "+ Nuevo gasto".</strong></li>
<li><strong>Selecciona la categoría del gasto:</strong> Arriendo, Nómina, Servicios públicos, Materia prima, Publicidad, Otros.</li>
<li><strong>Escribe la descripción.</strong> Ejemplo: "Pago arriendo local — mayo 2025".</li>
<li><strong>Ingresa el monto.</strong></li>
<li><strong>Selecciona la fecha del gasto.</strong></li>
<li><strong>Sube el comprobante (opcional pero recomendado):</strong> Foto de la factura o el recibo.</li>
<li><strong>Haz clic en Guardar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Tengo que registrar cada gasto uno por uno?</strong> Sí, para que los reportes sean exactos. Pero puedes crear gastos recurrentes (como el arriendo) para que el sistema te los recuerde cada mes.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo ver el balance de ingresos y gastos',
    slug: 'ver-balance-ingresos-gastos',
    category: 'contabilidad',
    summary: 'Consulta cuánto ganaste y cuánto gastaste en un período para conocer tu utilidad real.',
    tags: ['contabilidad', 'balance', 'utilidad', 'ingresos', 'gastos'],
    body: `<div class="help-article">
<p class="help-intro">El balance es la foto financiera de tu negocio: muestra cuánto entraste, cuánto saliste y cuánto te quedó de ganancia (o cuánto perdiste).</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad → Balance</strong> o <strong>Contabilidad → Reportes.</strong></li>
<li><strong>Selecciona el período:</strong> Este mes, este trimestre, este año o rango personalizado.</li>
<li><strong>Lee las tres cifras clave:</strong>
<ul>
<li><strong>Total ingresos:</strong> Suma de todas las ventas y otros ingresos del período.</li>
<li><strong>Total gastos:</strong> Suma de todos los gastos registrados en el período.</li>
<li><strong>Utilidad neta:</strong> Ingresos menos Gastos. Si es positivo, estás ganando. Si es negativo, estás perdiendo.</li>
</ul>
</li>
<li><strong>Revisa el desglose por categoría</strong> para entender en qué gastas más y dónde generaste más ingresos.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Las ventas registradas en Ventas aparecen automáticamente en la contabilidad?</strong> Sí. Las ventas marcadas como "Pagadas" se sincronizan automáticamente como ingresos en el módulo de contabilidad.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo categorizar los gastos de tu negocio',
    slug: 'categorizar-gastos',
    category: 'contabilidad',
    summary: 'Organiza tus gastos en categorías para entender en qué está saliendo el dinero.',
    tags: ['contabilidad', 'categorías', 'gastos', 'organizar'],
    body: `<div class="help-article">
<p class="help-intro">Las categorías de gastos son como las "gavetas" donde ordenas tus pagos. Cuando tienes todo categorizado, de un vistazo sabes si gastas demasiado en arriendo, en publicidad o en personal.</p>
<h3>Categorías típicas para un microempresario</h3>
<ul>
<li>Arriendo o local</li>
<li>Nómina y pagos a empleados</li>
<li>Servicios públicos (agua, luz, internet)</li>
<li>Materia prima o inventario</li>
<li>Publicidad y marketing</li>
<li>Transporte</li>
<li>Mantenimiento y reparaciones</li>
<li>Impuestos</li>
<li>Otros gastos</li>
</ul>
<h3>Cómo crear una categoría nueva</h3>
<ol>
<li><strong>Ve a Contabilidad → Configuración → Categorías de gastos.</strong></li>
<li><strong>Haz clic en "+ Nueva categoría".</strong></li>
<li><strong>Escribe el nombre</strong> de la categoría.</li>
<li><strong>Guarda.</strong> La categoría ya estará disponible al registrar nuevos gastos.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo cambiar la categoría de un gasto ya registrado?</strong> Sí. Abre el gasto y edita el campo de categoría.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo generar el reporte mensual de tu negocio',
    slug: 'reporte-mensual-negocio',
    category: 'contabilidad',
    summary: 'Genera el informe mensual de ventas, gastos y utilidad de tu negocio.',
    tags: ['contabilidad', 'reporte', 'mensual', 'utilidad', 'PDF'],
    body: `<div class="help-article">
<p class="help-intro">El reporte mensual es el informe que te dice si tu negocio fue rentable ese mes. Guárdalo cada mes para tener un histórico y compartirlo con tu contador.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad → Reportes.</strong></li>
<li><strong>Selecciona "Reporte mensual".</strong></li>
<li><strong>Elige el mes y año.</strong></li>
<li><strong>El reporte incluirá:</strong> Total de ventas, total de gastos por categoría, utilidad neta, comparación con el mes anterior (si hay datos) y los 5 gastos más grandes del mes.</li>
<li><strong>Descarga en PDF</strong> para archivarlo o enviárselo a tu contador.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo ver el reporte de varios meses al mismo tiempo?</strong> Sí. Usa la opción "Rango personalizado" para seleccionar varios meses y ver el acumulado.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo registrar un ingreso adicional que no es una venta',
    slug: 'registrar-ingreso-adicional',
    category: 'contabilidad',
    summary: 'Registra ingresos como arriendos, inversiones o cualquier dinero que no viene de ventas.',
    tags: ['contabilidad', 'ingreso', 'adicional', 'arriendo'],
    body: `<div class="help-article">
<p class="help-intro">No todos los ingresos son ventas de productos o servicios. Si recibes dinero por arriendo de una bodega, devolución de impuestos u otro concepto, también puedes registrarlo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad → Ingresos.</strong></li>
<li><strong>Haz clic en "+ Nuevo ingreso".</strong></li>
<li><strong>Selecciona el tipo:</strong> Venta, Arriendo, Intereses, Devolución, Otro.</li>
<li><strong>Escribe la descripción.</strong> Ejemplo: "Arriendo bodega trasera — mayo 2025".</li>
<li><strong>Ingresa el monto y la fecha.</strong></li>
<li><strong>Guarda.</strong> El ingreso se sumará al total de ingresos del período.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Las ventas que registro en el módulo de Ventas se duplican si también las registro aquí?</strong> No. Las ventas del módulo de Ventas se sincronizan automáticamente. Solo registra aquí los ingresos que no son ventas de productos/servicios.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo registrar gastos recurrentes (arriendo, servicios)',
    slug: 'gastos-recurrentes',
    category: 'contabilidad',
    summary: 'Configura gastos que se repiten cada mes para no tener que registrarlos manualmente.',
    tags: ['contabilidad', 'recurrente', 'arriendo', 'servicios', 'automático'],
    body: `<div class="help-article">
<p class="help-intro">El arriendo, los servicios públicos y la nómina se pagan todos los meses. En lugar de registrarlos uno a uno cada mes, puedes crear un gasto recurrente y TurnFlow te recordará cada período.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad → Gastos → Recurrentes.</strong></li>
<li><strong>Haz clic en "+ Nuevo gasto recurrente".</strong></li>
<li><strong>Configura el gasto:</strong> Categoría, descripción, monto y día del mes en que se genera.</li>
<li><strong>Define la frecuencia:</strong> Mensual, trimestral o anual.</li>
<li><strong>Haz clic en Guardar.</strong> Cada período, TurnFlow creará automáticamente el gasto con esas características y te notificará para que confirmes si se pagó.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué pasa si el valor del gasto recurrente cambia?</strong> Entra al gasto recurrente, edita el monto y guarda. El siguiente período ya usará el nuevo valor.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo ver el flujo de caja de tu negocio',
    slug: 'flujo-caja-negocio',
    category: 'contabilidad',
    summary: 'Consulta el flujo de caja para entender cuándo entra y cuándo sale el dinero en tu negocio.',
    tags: ['contabilidad', 'flujo de caja', 'liquidez', 'dinero'],
    body: `<div class="help-article">
<p class="help-intro">El flujo de caja te dice cuándo tienes dinero disponible y cuándo no — aunque seas rentable, puedes quedarte sin caja si los clientes te pagan muy tarde.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Contabilidad → Flujo de caja.</strong></li>
<li><strong>Selecciona el período.</strong></li>
<li><strong>El gráfico mostrará:</strong> Barras verdes (dinero que entró) y barras rojas (dinero que salió) día a día o semana a semana durante el período.</li>
<li><strong>Identifica los días críticos:</strong> Los días donde la barra roja es más alta que la verde, o donde el saldo acumulado baja mucho, son momentos de tensión de caja.</li>
<li><strong>Planifica:</strong> Si ves que el 5 de cada mes salen muchos pagos (arriendo, nómina), asegúrate de tener suficiente recaudo antes de esa fecha.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El flujo de caja incluye las ventas a crédito pendientes?</strong> Puedes configurarlo para mostrar solo el dinero que ya entró (caja real) o también las ventas pendientes de cobro (flujo proyectado).</p>
</div></div>`,
    published: true, sort_order: 8,
  },

  // ── FACTURACIÓN ─────────────────────────────────────────────────────────────
  {
    title: '¿Qué es la factura electrónica y por qué debo usarla?',
    slug: 'que-es-factura-electronica',
    category: 'facturacion',
    summary: 'Entiende qué es la factura electrónica, a quiénes aplica en Colombia y por qué es obligatoria.',
    tags: ['facturación', 'factura electrónica', 'DIAN', 'obligación'],
    body: `<div class="help-article">
<p class="help-intro">La factura electrónica es la versión digital de la factura de venta, obligatoria para la mayoría de negocios en Colombia según la DIAN. TurnFlow te ayuda a generarlas sin necesitar software especializado.</p>
<h3>¿Qué diferencia a la factura electrónica de una factura normal?</h3>
<ul>
<li>Es generada y enviada en formato digital (PDF y XML).</li>
<li>Tiene un código QR de validación de la DIAN.</li>
<li>El cliente la recibe por correo electrónico en tiempo real.</li>
<li>Queda registrada automáticamente en la DIAN — no necesitas ir a ninguna oficina.</li>
</ul>
<h3>¿A quiénes aplica?</h3>
<p>La DIAN ha estado incorporando gradualmente a todos los responsables del impuesto. Si tu negocio supera los topes de ingresos o estás en el régimen común, ya eres obligado. Consulta con tu contador si tienes dudas.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿TurnFlow está habilitado por la DIAN?</strong> TurnFlow trabaja con proveedores tecnológicos habilitados por la DIAN para la generación y transmisión de facturas electrónicas. Pregunta a nuestro equipo de soporte por los detalles de habilitación.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo configurar tu información de facturación',
    slug: 'configurar-informacion-facturacion',
    category: 'facturacion',
    summary: 'Configura el NIT, resolución de facturación y otros datos necesarios para emitir facturas electrónicas.',
    tags: ['facturación', 'NIT', 'resolución', 'configurar', 'DIAN'],
    body: `<div class="help-article">
<p class="help-intro">Antes de emitir tu primera factura electrónica, debes configurar los datos de tu negocio: NIT, nombre de la empresa, resolución de facturación y datos del representante legal.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Ten a la mano tu RUT, el NIT de tu empresa y la resolución de facturación que te dio la DIAN.</li><li>Si no tienes resolución de facturación, debes solicitarla en la DIAN primero.</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Facturación → Configuración.</strong></li>
<li><strong>Ingresa el NIT</strong> de tu empresa (con el dígito de verificación).</li>
<li><strong>Escribe la razón social</strong> (nombre legal de tu empresa como aparece en el RUT).</li>
<li><strong>Ingresa la resolución de facturación:</strong> Número de resolución, fecha de expedición y rango autorizado (desde qué número hasta qué número puedes facturar).</li>
<li><strong>Completa la dirección, ciudad y departamento</strong> del establecimiento.</li>
<li><strong>Haz clic en Guardar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Dónde encuentro el número de mi resolución de facturación?</strong> En el documento que te entregó la DIAN cuando habilitaste la facturación electrónica. También puedes consultarlo en el portal de la DIAN con tu NIT.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo generar una factura electrónica desde una venta',
    slug: 'generar-factura-electronica-venta',
    category: 'facturacion',
    summary: 'Convierte una venta registrada en TurnFlow en una factura electrónica válida ante la DIAN.',
    tags: ['facturación', 'factura', 'generar', 'venta', 'DIAN'],
    body: `<div class="help-article">
<p class="help-intro">Cuando el cliente necesita factura, puedes generarla directamente desde la venta ya registrada en TurnFlow en segundos.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Ventas</strong> y abre la venta para la que quieres generar factura.</li>
<li><strong>Haz clic en el botón "Generar factura electrónica"</strong> o "Facturar".</li>
<li><strong>Ingresa los datos del cliente (si no están):</strong> NIT o cédula, nombre y correo electrónico. El correo es obligatorio para enviar la factura.</li>
<li><strong>Revisa el borrador de la factura</strong> con los ítems, precios e impuestos. Asegúrate de que todo esté correcto.</li>
<li><strong>Haz clic en "Emitir factura".</strong> TurnFlow envía la factura a la DIAN para validación y automáticamente se la envía al cliente por correo.</li>
<li><strong>La factura queda en el módulo de Facturación</strong> con su número, fecha y estado (válida o rechazada).</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cuánto tarda en validarse la factura?</strong> Normalmente es inmediato. En ocasiones de alta carga en los servidores de la DIAN puede tardar unos minutos.</p>
<p><strong>¿Puedo anular una factura ya emitida?</strong> Sí, mediante una nota crédito. Lee el artículo "Cómo anular una factura electrónica".</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo enviar la factura al cliente',
    slug: 'enviar-factura-cliente',
    category: 'facturacion',
    summary: 'Envía la factura electrónica al correo del cliente o comparte el enlace de descarga.',
    tags: ['facturación', 'enviar', 'correo', 'cliente', 'factura'],
    body: `<div class="help-article">
<p class="help-intro">Después de emitir la factura, el cliente necesita recibirla. TurnFlow puede enviársela automáticamente al correo o puedes hacerlo manualmente.</p>
<h3>Envío automático al emitir</h3>
<p>Si el cliente tiene correo registrado, la factura se envía automáticamente cuando se emite. No necesitas hacer nada adicional.</p>
<h3>Envío manual desde el módulo de Facturación</h3>
<ol>
<li><strong>Ve a Facturación</strong> y busca la factura que quieres enviar.</li>
<li><strong>Haz clic en la factura</strong> para abrirla.</li>
<li><strong>Haz clic en "Enviar por correo".</strong></li>
<li><strong>Verifica o escribe el correo del destinatario</strong> y haz clic en Enviar.</li>
<li><strong>También puedes compartir el enlace:</strong> Copia el enlace de descarga de la factura y envíalo por WhatsApp si el cliente lo prefiere así.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El cliente puede descargar la factura en PDF y XML?</strong> Sí. El enlace de la factura permite descargar ambos formatos. El XML es necesario para los sistemas contables del cliente.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo ver todas las facturas emitidas',
    slug: 'ver-facturas-emitidas',
    category: 'facturacion',
    summary: 'Consulta el historial completo de facturas electrónicas emitidas desde TurnFlow.',
    tags: ['facturación', 'historial', 'facturas', 'lista'],
    body: `<div class="help-article">
<p class="help-intro">El módulo de Facturación guarda todas las facturas que has emitido para que puedas consultarlas, reenviarlas o descargarlas cuando las necesites.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Facturación</strong> en el menú izquierdo.</li>
<li><strong>Verás la lista de todas las facturas emitidas</strong> con: número de factura, fecha, cliente, monto total y estado (válida, anulada).</li>
<li><strong>Usa los filtros</strong> para buscar por fecha, cliente, número o estado.</li>
<li><strong>Haz clic en cualquier factura</strong> para ver el detalle completo o reenviarla al cliente.</li>
<li><strong>Para exportar el listado a Excel,</strong> haz clic en "Exportar".</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Las facturas se guardan indefinidamente?</strong> Sí. Por obligación fiscal, las facturas deben conservarse por al menos 5 años. TurnFlow las guarda de forma permanente.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo anular una factura electrónica (nota crédito)',
    slug: 'anular-factura-nota-credito',
    category: 'facturacion',
    summary: 'Aprende a anular o corregir una factura ya emitida mediante una nota crédito.',
    tags: ['facturación', 'anular', 'nota crédito', 'corrección'],
    body: `<div class="help-article">
<p class="help-intro">Una factura electrónica no se puede borrar — en su lugar, se anula mediante una "nota crédito" que es el documento legal para revertir o corregir una factura ya emitida.</p>
<h3>¿Cuándo usar una nota crédito?</h3>
<ul>
<li>El cliente devolvió el producto.</li>
<li>Hubo un error en el precio o en los ítems de la factura.</li>
<li>Se aplicó un descuento después de emitir la factura.</li>
<li>La venta fue cancelada después de facturar.</li>
</ul>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Facturación</strong> y abre la factura que quieres anular.</li>
<li><strong>Haz clic en "Generar nota crédito".</strong></li>
<li><strong>Selecciona el motivo</strong> de la anulación (devolución, descuento, error, etc.).</li>
<li><strong>Define si es una anulación total</strong> (anula toda la factura) o parcial (solo una parte).</li>
<li><strong>Haz clic en "Emitir nota crédito".</strong> Se envía a la DIAN y al cliente automáticamente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿La nota crédito tiene un número propio?</strong> Sí. La nota crédito es un documento legal con su propio número de referencia, separado de la factura original.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo configurar los impuestos en las facturas',
    slug: 'configurar-impuestos-facturas',
    category: 'facturacion',
    summary: 'Define el IVA y otros impuestos que aplican a tus productos y servicios en las facturas.',
    tags: ['facturación', 'IVA', 'impuestos', 'configurar'],
    body: `<div class="help-article">
<p class="help-intro">En Colombia, el IVA más común es del 19%. Pero hay productos y servicios exentos o con tarifas especiales. Configura los impuestos una vez y TurnFlow los aplicará automáticamente.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Facturación → Configuración → Impuestos.</strong></li>
<li><strong>Verás el IVA del 19% ya configurado por defecto.</strong> Puedes agregar otros si aplican a tu negocio.</li>
<li><strong>Para agregar un impuesto:</strong> Haz clic en "+ Nuevo impuesto", escribe el nombre (IVA, ICA, Retención), el porcentaje y el tipo.</li>
<li><strong>Asigna los impuestos a cada producto:</strong> Ve a Productos, edita un producto y en el campo "Impuesto" selecciona el que aplica. Si el producto está exento de IVA, selecciona "Exento".</li>
<li><strong>Guarda los cambios.</strong> Las próximas facturas calcularán los impuestos automáticamente según la configuración de cada producto.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué hago si no sé qué impuesto aplica a mi producto?</strong> Consulta con tu contador. Él puede decirte si tu producto o servicio está gravado con IVA y a qué tarifa.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo generar un reporte de ventas para la declaración de renta',
    slug: 'reporte-ventas-declaracion-renta',
    category: 'facturacion',
    summary: 'Exporta el resumen de facturas emitidas en el año para entregárselo a tu contador.',
    tags: ['facturación', 'declaración de renta', 'reporte', 'contador', 'anual'],
    body: `<div class="help-article">
<p class="help-intro">Cada año tu contador necesita el total de ventas facturadas para hacer la declaración de renta. TurnFlow te genera ese reporte en segundos.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Facturación → Reportes.</strong></li>
<li><strong>Selecciona "Reporte anual" o "Reporte de facturación".</strong></li>
<li><strong>Selecciona el año fiscal</strong> (generalmente del 1 de enero al 31 de diciembre).</li>
<li><strong>El reporte incluirá:</strong> Total de facturas emitidas, total de ventas brutas, total de IVA facturado, notas crédito emitidas y ventas netas (sin IVA).</li>
<li><strong>Descarga en Excel o PDF</strong> y envíaselo a tu contador.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo descargar todas las facturas del año en un ZIP?</strong> Dependiendo del plan, sí. Busca la opción "Descargar todas las facturas del período".</p>
</div></div>`,
    published: true, sort_order: 8,
  },

  // ── COPILOT ─────────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el Copilot de IA y para qué sirve?',
    slug: 'que-es-copilot-ia',
    category: 'copilot',
    summary: 'Descubre cómo el asistente de inteligencia artificial de TurnFlow puede ayudarte a entender tu negocio.',
    tags: ['copilot', 'IA', 'inteligencia artificial', 'asistente'],
    body: `<div class="help-article">
<p class="help-intro">El Copilot de IA es tu asistente inteligente dentro de TurnFlow. Puedes hacerle preguntas sobre tu negocio y te responde con datos reales — como tener un analista disponible todo el tiempo.</p>
<h3>¿Qué puedes preguntarle?</h3>
<ul>
<li>"¿Cuánto vendí esta semana?"</li>
<li>"¿Cuáles son mis clientes más frecuentes?"</li>
<li>"¿Qué producto vendí más este mes?"</li>
<li>"¿Cuántas citas tengo pendientes hoy?"</li>
<li>"¿Cuánto tengo pendiente de cobrar?"</li>
</ul>
<h3>¿Cómo funciona?</h3>
<p>El Copilot accede a los datos reales de tu negocio en TurnFlow (ventas, clientes, citas, inventario) y usa inteligencia artificial para responder tus preguntas en lenguaje natural — no necesitas saber de sistemas ni de números.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El Copilot puede tomar acciones o solo responde preguntas?</strong> Por ahora el Copilot solo responde preguntas y da información. No puede crear ventas, borrar clientes ni modificar datos.</p>
<p><strong>¿Mis datos están seguros con la IA?</strong> Sí. El Copilot solo accede a los datos de tu propio negocio y no los comparte con terceros.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo usar el Copilot de IA',
    slug: 'como-usar-copilot',
    category: 'copilot',
    summary: 'Aprende a abrir y usar el asistente de IA de TurnFlow para consultar información de tu negocio.',
    tags: ['copilot', 'IA', 'usar', 'preguntar'],
    body: `<div class="help-article">
<p class="help-intro">El Copilot de IA está disponible en cualquier pantalla de TurnFlow. Solo tienes que abrirlo y escribir tu pregunta como si le hablaras a alguien.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Busca el botón del Copilot</strong> en la esquina inferior derecha de cualquier pantalla de TurnFlow. Es el ícono de estrella o de robot (🤖).</li>
<li><strong>Haz clic en él.</strong> Se abre una ventana flotante con un campo de texto.</li>
<li><strong>Escribe tu pregunta</strong> en el campo de texto. Habla normal: "¿Cuánto vendí hoy?" o "¿Quiénes son mis clientes que no han comprado en el último mes?"</li>
<li><strong>Presiona Enter o el botón Enviar.</strong> El Copilot procesa tu pregunta y responde en segundos con información de tu negocio.</li>
<li><strong>Si quieres más detalle,</strong> puedes hacer preguntas de seguimiento en la misma conversación.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cuántas preguntas puedo hacer?</strong> Depende de tu plan. El plan gratuito incluye 5 preguntas diarias. El plan Managed incluye 50 y el plan BYOK hasta 500.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: '¿Cuántas consultas puedo hacer con el Copilot?',
    slug: 'limite-consultas-copilot',
    category: 'copilot',
    summary: 'Conoce los límites de consultas según tu plan y cómo ampliarlos.',
    tags: ['copilot', 'límite', 'plan', 'consultas'],
    body: `<div class="help-article">
<p class="help-intro">El Copilot de IA tiene un límite de consultas diarias según el plan que uses. Esto garantiza un servicio justo para todos los negocios.</p>
<h3>Límites por plan</h3>
<ul>
<li><strong>Plan Gratuito:</strong> 5 consultas por día. Ideal para probar el Copilot y hacer preguntas puntuales.</li>
<li><strong>Plan Managed ($39.900/mes):</strong> 50 consultas por día. Para negocios que usan el Copilot regularmente durante el día.</li>
<li><strong>Plan BYOK — Trae tu propia llave ($19.900/mes + tu clave de API):</strong> Hasta 500 consultas por día. Para negocios con uso intensivo. Requieres tener una cuenta de Anthropic o OpenAI con tu propia clave de API.</li>
</ul>
<h3>¿Cómo sé cuántas consultas me quedan?</h3>
<p>El botón del Copilot muestra el número de consultas restantes del día. Cuando llegues a 0, el sistema te avisará y no podrá responder más hasta el día siguiente.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El límite se reinicia cada día?</strong> Sí, a medianoche (hora de Colombia) el contador se reinicia a 0 y puedes hacer nuevas consultas.</p>
<p><strong>¿Cómo activo el plan Managed o BYOK?</strong> Ve al Marketplace → Copilot IA y elige el plan que quieres.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo configurar tu propia clave de API (plan BYOK)',
    slug: 'configurar-api-key-copilot',
    category: 'copilot',
    summary: 'Configura tu propia clave de API de Anthropic u OpenAI para usar el Copilot con más consultas.',
    tags: ['copilot', 'BYOK', 'API key', 'Anthropic', 'OpenAI'],
    body: `<div class="help-article">
<p class="help-intro">El plan BYOK (Bring Your Own Key — Trae Tu Propia Llave) te permite conectar tu cuenta personal de Anthropic o OpenAI para hacer hasta 500 consultas diarias al Copilot de IA.</p>
<div class="help-before"><h3>Antes de empezar</h3><ul><li>Necesitas tener una cuenta en Anthropic (claude.ai) o OpenAI (openai.com) con créditos disponibles.</li><li>Debes obtener una clave de API de esa plataforma.</li></ul></div>
<h3>Pasos</h3>
<ol>
<li><strong>Ve al Marketplace → Copilot IA</strong> y activa el plan BYOK.</li>
<li><strong>Ve a Configuración → Copilot IA → Configuración avanzada.</strong></li>
<li><strong>Selecciona el proveedor:</strong> Anthropic (Claude) u OpenAI (GPT).</li>
<li><strong>Pega tu clave de API</strong> en el campo "API Key". La clave es una cadena larga de caracteres que comienza con "sk-".</li>
<li><strong>Haz clic en Guardar y verificar.</strong> TurnFlow verificará que la clave sea válida.</li>
<li><strong>Listo.</strong> A partir de ese momento el Copilot usará tu clave para responder preguntas.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Dónde consigo mi clave de API de Anthropic?</strong> Ve a console.anthropic.com, inicia sesión y en la sección "API Keys" crea una nueva clave.</p>
<p><strong>¿TurnFlow puede ver mi clave de API?</strong> Tu clave se guarda encriptada y nunca se muestra en texto plano, ni siquiera para el equipo de TurnFlow.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Qué tipo de preguntas puede responder el Copilot',
    slug: 'preguntas-que-responde-copilot',
    category: 'copilot',
    summary: 'Ejemplos de preguntas que puedes hacerle al Copilot de IA sobre tu negocio.',
    tags: ['copilot', 'preguntas', 'ejemplos', 'IA'],
    body: `<div class="help-article">
<p class="help-intro">El Copilot solo responde preguntas sobre los datos de tu negocio en TurnFlow — no da consejos generales ni información externa. Aquí tienes ejemplos de lo que sí puede responder.</p>
<h3>Sobre ventas</h3>
<ul>
<li>"¿Cuánto vendí hoy / esta semana / este mes?"</li>
<li>"¿Cuáles son las 5 ventas más grandes del mes?"</li>
<li>"¿Cuánto tengo pendiente de cobrar?"</li>
<li>"¿Cuál es mi ticket promedio esta semana?"</li>
</ul>
<h3>Sobre clientes</h3>
<ul>
<li>"¿Quiénes son mis clientes más frecuentes?"</li>
<li>"¿Qué clientes no han comprado en más de 60 días?"</li>
<li>"¿Cuántos clientes nuevos registré este mes?"</li>
</ul>
<h3>Sobre inventario</h3>
<ul>
<li>"¿Qué productos tienen stock bajo?"</li>
<li>"¿Cuál es el producto más vendido este mes?"</li>
</ul>
<h3>Sobre citas</h3>
<ul>
<li>"¿Cuántas citas tengo para mañana?"</li>
<li>"¿Cuántas citas se cancelaron esta semana?"</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puede el Copilot darme consejos de negocio?</strong> El Copilot se basa en tus datos para hacer observaciones. Por ejemplo: "Noto que tus ventas los lunes son las más bajas — considera una promoción ese día." Pero los consejos son observaciones basadas en datos, no asesoría profesional.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: '¿Qué NO puede hacer el Copilot de IA?',
    slug: 'limitaciones-copilot',
    category: 'copilot',
    summary: 'Conoce las limitaciones del Copilot para tener expectativas claras de lo que puede hacer.',
    tags: ['copilot', 'limitaciones', 'no puede', 'IA'],
    body: `<div class="help-article">
<p class="help-intro">El Copilot es una herramienta poderosa pero tiene límites claros. Conocerlos te evita frustraciones.</p>
<h3>El Copilot NO puede:</h3>
<ul>
<li><strong>Crear o modificar datos:</strong> No puede registrar ventas, agregar clientes, cambiar precios ni borrar nada. Solo lee los datos que ya existen.</li>
<li><strong>Responder sobre temas externos:</strong> No te dirá el precio del dólar, el clima ni consejos de marketing general. Solo trabaja con los datos de tu negocio.</li>
<li><strong>Acceder a datos de otras empresas:</strong> Solo ve los datos de tu negocio — no los de otras marcas en TurnFlow.</li>
<li><strong>Garantizar exactitud absoluta:</strong> Aunque usa tus datos reales, la IA puede cometer errores. Verifica siempre los números importantes en los reportes directamente.</li>
<li><strong>Dar asesoría legal, contable o fiscal:</strong> No es un contador ni un abogado. Para esas decisiones, consulta a un profesional.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué hago si el Copilot me da una respuesta incorrecta?</strong> Verifica el dato directamente en el módulo correspondiente (Ventas, Clientes, etc.). Si hay un error, repórtalo a nuestro soporte para que podamos mejorar el sistema.</p>
</div></div>`,
    published: true, sort_order: 6,
  },

  // ── CONFIGURACIÓN ───────────────────────────────────────────────────────────
  {
    title: 'Cómo cambiar el nombre y logo de tu negocio',
    slug: 'cambiar-nombre-logo-negocio',
    category: 'configuracion',
    summary: 'Actualiza el nombre, logo y colores de tu marca en TurnFlow.',
    tags: ['configuración', 'nombre', 'logo', 'marca', 'colores'],
    body: `<div class="help-article">
<p class="help-intro">El nombre y logo de tu negocio aparecen en cotizaciones, facturas, correos a clientes y en tu página pública. Mantenerlos actualizados proyecta profesionalismo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Marca</strong> en el menú.</li>
<li><strong>Haz clic en "Editar".</strong></li>
<li><strong>Cambia el nombre del negocio</strong> en el campo correspondiente.</li>
<li><strong>Sube el nuevo logo:</strong> Haz clic en la imagen del logo actual (o en el área de subida) y selecciona el nuevo archivo. Formato recomendado: PNG con fondo transparente, mínimo 200x200 píxeles.</li>
<li><strong>Ajusta el color primario</strong> si quieres cambiar la paleta de colores de tu marca.</li>
<li><strong>Haz clic en Guardar cambios.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Los cambios aplican a las facturas ya emitidas?</strong> No. Las facturas y cotizaciones ya generadas quedan con el logo y nombre que tenían. Los cambios solo aplican a los documentos futuros.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo agregar o invitar a un empleado',
    slug: 'agregar-empleado-usuario',
    category: 'configuracion',
    summary: 'Crea una cuenta para un empleado o colaborador para que pueda usar TurnFlow.',
    tags: ['configuración', 'usuarios', 'empleado', 'invitar', 'permisos'],
    body: `<div class="help-article">
<p class="help-intro">Si tienes empleados que también necesitan usar TurnFlow (cajeros, asesores, recepcionistas), puedes invitarlos para que tengan su propia cuenta con el acceso que les corresponde.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Usuarios</strong> o <strong>Configuración → Equipo.</strong></li>
<li><strong>Haz clic en "+ Invitar usuario".</strong></li>
<li><strong>Escribe el correo electrónico del empleado.</strong></li>
<li><strong>Selecciona el rol:</strong>
<ul>
<li><strong>Manager:</strong> Puede ver todo y gestionar ventas, clientes e inventario. No puede cambiar configuraciones de la marca.</li>
<li><strong>Asesor/Vendedor:</strong> Puede registrar ventas y atender clientes. Acceso limitado a reportes y configuraciones.</li>
<li><strong>Solo lectura:</strong> Puede ver reportes pero no crear ni modificar nada.</li>
</ul>
</li>
<li><strong>Haz clic en Enviar invitación.</strong> El empleado recibirá un correo con el enlace para crear su contraseña y acceder.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Tiene costo adicional agregar usuarios?</strong> Depende del plan. Algunos planes incluyen usuarios ilimitados, otros tienen un límite. Verifica en tu plan actual.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo cambiar el rol o permisos de un usuario',
    slug: 'cambiar-rol-usuario',
    category: 'configuracion',
    summary: 'Modifica los permisos de acceso de un empleado o colaborador en TurnFlow.',
    tags: ['configuración', 'rol', 'permisos', 'usuario', 'acceso'],
    body: `<div class="help-article">
<p class="help-intro">Si un empleado cambia de cargo o necesita más o menos acceso, puedes cambiar su rol en cualquier momento sin tener que crear una cuenta nueva.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Usuarios.</strong></li>
<li><strong>Busca el usuario al que quieres cambiar el rol.</strong></li>
<li><strong>Haz clic en el usuario</strong> o en el ícono de editar (lápiz).</li>
<li><strong>En el campo "Rol"</strong>, selecciona el nuevo rol del menú desplegable.</li>
<li><strong>Haz clic en Guardar.</strong> El cambio aplica inmediatamente — la próxima vez que el empleado inicie sesión, verá el menú actualizado con los accesos de su nuevo rol.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El empleado recibe una notificación cuando cambio su rol?</strong> No automáticamente. Si el cambio es significativo (más o menos acceso), es buena práctica notificárselo directamente.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo configurar la sucursal o establecimiento',
    slug: 'configurar-sucursal',
    category: 'configuracion',
    summary: 'Actualiza los datos del establecimiento: dirección, teléfono, horario de atención.',
    tags: ['configuración', 'sucursal', 'establecimiento', 'dirección', 'horario'],
    body: `<div class="help-article">
<p class="help-intro">Los datos del establecimiento aparecen en documentos públicos y en el perfil de tu negocio. Mantenlos actualizados para que los clientes puedan encontrarte.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Establecimientos</strong> o <strong>Configuración → Sucursales.</strong></li>
<li><strong>Haz clic en el establecimiento</strong> que quieres editar (si tienes más de uno).</li>
<li><strong>Haz clic en "Editar".</strong></li>
<li><strong>Actualiza los datos:</strong> Nombre del establecimiento, dirección, ciudad, teléfono de contacto, correo de atención.</li>
<li><strong>Configura el horario de atención:</strong> Los días y horas en que tu negocio está abierto. Esto aparece en tu perfil público y en el sistema de citas.</li>
<li><strong>Haz clic en Guardar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo tener varias sucursales en una sola cuenta?</strong> Sí, dependiendo del plan. Para agregar una nueva sucursal, haz clic en "+ Nueva sucursal" y configura sus datos.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: 'Cómo cambiar tu contraseña',
    slug: 'cambiar-contrasena',
    category: 'configuracion',
    summary: 'Actualiza tu contraseña de acceso a TurnFlow por seguridad.',
    tags: ['configuración', 'contraseña', 'seguridad', 'acceso'],
    body: `<div class="help-article">
<p class="help-intro">Cambiar tu contraseña regularmente es una buena práctica de seguridad. También debes hacerlo si sospechas que alguien más tuvo acceso a tu cuenta.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Haz clic en tu nombre o foto</strong> en la esquina superior derecha (o en el menú lateral abajo). Se abre el menú de perfil.</li>
<li><strong>Selecciona "Mi perfil" o "Configuración de cuenta".</strong></li>
<li><strong>Busca la sección "Contraseña" o "Seguridad".</strong></li>
<li><strong>Ingresa tu contraseña actual</strong> para verificar que eres tú.</li>
<li><strong>Escribe la nueva contraseña</strong> y confírmala escribiéndola de nuevo.</li>
<li><strong>Haz clic en "Cambiar contraseña".</strong> TurnFlow puede pedirte que inicies sesión de nuevo con la nueva contraseña.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Qué hago si olvidé mi contraseña?</strong> En la pantalla de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" y escribe tu correo. Recibirás un enlace para crear una nueva contraseña.</p>
</div></div>`,
    published: true, sort_order: 5,
  },
  {
    title: 'Cómo ver y descargar las facturas de tu plan de TurnFlow',
    slug: 'facturas-plan-turnflow',
    category: 'configuracion',
    summary: 'Consulta y descarga las facturas de tu suscripción o de los módulos que pagas en TurnFlow.',
    tags: ['configuración', 'factura', 'suscripción', 'plan', 'pago'],
    body: `<div class="help-article">
<p class="help-intro">Puedes consultar y descargar las facturas de lo que pagas a TurnFlow desde la configuración de tu cuenta.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Facturación</strong> o <strong>Configuración → Plan y pagos.</strong></li>
<li><strong>Verás el plan actual</strong> y el historial de pagos.</li>
<li><strong>Haz clic en cualquier período</strong> para ver el detalle de la factura.</li>
<li><strong>Haz clic en "Descargar factura"</strong> para obtener el PDF.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Las facturas de TurnFlow tienen IVA?</strong> Sí. TurnFlow emite facturas con IVA incluido según la legislación colombiana.</p>
<p><strong>¿Puedo cambiar el NIT que aparece en las facturas de TurnFlow?</strong> Sí. En Configuración → Facturación puedes actualizar los datos de facturación de tu empresa para que las facturas lleguen con el nombre y NIT correctos.</p>
</div></div>`,
    published: true, sort_order: 6,
  },
  {
    title: 'Cómo desactivar un usuario que ya no trabaja contigo',
    slug: 'desactivar-usuario',
    category: 'configuracion',
    summary: 'Bloquea el acceso de un empleado que ya no está en tu negocio sin borrar su historial.',
    tags: ['configuración', 'usuario', 'desactivar', 'bloquear', 'acceso'],
    body: `<div class="help-article">
<p class="help-intro">Cuando un empleado se va de tu negocio, debes bloquear su acceso a TurnFlow para proteger la información de tus clientes y ventas.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Usuarios.</strong></li>
<li><strong>Busca el usuario que quieres desactivar.</strong></li>
<li><strong>Haz clic en el usuario</strong> para abrir su perfil.</li>
<li><strong>Busca el botón "Desactivar usuario"</strong> o el interruptor de estado activo/inactivo.</li>
<li><strong>Confirma la desactivación.</strong> El empleado ya no podrá iniciar sesión en TurnFlow. Su historial de ventas y acciones anteriores se conserva para los registros.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo reactivar al usuario si regresa?</strong> Sí. Entra al usuario desactivado y usa el botón "Reactivar". Recupera todos sus datos y accesos anteriores según su rol.</p>
<p><strong>¿La desactivación es inmediata?</strong> Sí. Si el empleado está usando TurnFlow en ese momento, su sesión se cerrará en el siguiente clic.</p>
</div></div>`,
    published: true, sort_order: 7,
  },
  {
    title: 'Cómo configurar las notificaciones de TurnFlow',
    slug: 'configurar-notificaciones',
    category: 'configuracion',
    summary: 'Define qué alertas y notificaciones quieres recibir y por qué canal.',
    tags: ['configuración', 'notificaciones', 'alertas', 'correo', 'WhatsApp'],
    body: `<div class="help-article">
<p class="help-intro">TurnFlow puede avisarte de cosas importantes: nueva cita agendada, stock bajo, pago recibido, nueva PQRS. Configura qué avisos quieres y por qué canal.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Configuración → Notificaciones.</strong></li>
<li><strong>Verás la lista de tipos de notificación</strong> disponibles: nueva venta, nueva cita, stock bajo, nuevo turno, nueva PQRS, pago registrado, etc.</li>
<li><strong>Para cada tipo, elige el canal:</strong>
<ul>
<li>📧 <strong>Correo electrónico</strong></li>
<li>📱 <strong>Notificación en el navegador (web push)</strong></li>
<li>💬 <strong>WhatsApp</strong> (si lo tienes configurado)</li>
</ul>
</li>
<li><strong>Activa o desactiva cada notificación</strong> según tus preferencias.</li>
<li><strong>Haz clic en Guardar.</strong></li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo recibir notificaciones solo en horas de trabajo?</strong> Dependiendo del plan, puedes configurar un "horario silencioso" para que las notificaciones no lleguen fuera del horario de atención.</p>
</div></div>`,
    published: true, sort_order: 8,
  },

  // ── MARKETPLACE ─────────────────────────────────────────────────────────────
  {
    title: '¿Qué es el Marketplace de TurnFlow?',
    slug: 'que-es-marketplace',
    category: 'marketplace',
    summary: 'Descubre cómo funciona el Marketplace de módulos adicionales de TurnFlow.',
    tags: ['marketplace', 'módulos', 'activar', 'plan'],
    body: `<div class="help-article">
<p class="help-intro">El Marketplace de TurnFlow es donde puedes agregar funcionalidades extra a tu cuenta — como instalar apps en un celular. Cada módulo tiene una función específica y puede activarse o desactivarse cuando quieras.</p>
<h3>¿Qué módulos están disponibles?</h3>
<ul>
<li>Colas de espera (turnos digitales)</li>
<li>Citas y agendamiento</li>
<li>Encuestas de satisfacción</li>
<li>Menú digital y pedidos</li>
<li>PQRS</li>
<li>Copropiedades</li>
<li>Facturación electrónica</li>
<li>Copilot de IA</li>
<li>Contabilidad avanzada</li>
</ul>
<h3>¿Cómo funciona la prueba gratuita?</h3>
<p>La mayoría de los módulos tienen un período de prueba gratuita de 7 días. Puedes probarlo sin pagar y si te sirve, continúas; si no, simplemente no lo activas.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo cancelar un módulo en cualquier momento?</strong> Sí. Ve al Marketplace, encuentra el módulo activo y haz clic en "Cancelar". El módulo se desactivará al final del período ya pagado.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo activar un módulo nuevo',
    slug: 'activar-modulo-nuevo',
    category: 'marketplace',
    summary: 'Pasos para activar un módulo del Marketplace y comenzar la prueba gratuita.',
    tags: ['marketplace', 'activar', 'módulo', 'prueba gratuita'],
    body: `<div class="help-article">
<p class="help-intro">Activar un módulo nuevo toma menos de un minuto. Después de activarlo, aparece en el menú y puedes empezar a usarlo de inmediato.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Marketplace</strong> en el menú izquierdo.</li>
<li><strong>Explora los módulos disponibles.</strong> Cada tarjeta muestra el nombre, descripción, precio mensual y si tiene prueba gratuita.</li>
<li><strong>Haz clic en el módulo</strong> que quieres activar.</li>
<li><strong>Lee la descripción</strong> y las funciones incluidas.</li>
<li><strong>Haz clic en "Iniciar prueba gratuita"</strong> (si aplica) o en "Activar módulo".</li>
<li><strong>Confirma la activación.</strong> El módulo aparece en tu menú lateral inmediatamente.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Necesito ingresar datos de pago para la prueba gratuita?</strong> Depende del módulo. Algunos requieren agregar una tarjeta para la prueba (pero no se cobra hasta que termina). Otros son completamente gratis sin datos de pago.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
  {
    title: 'Cómo cancelar un módulo que ya no necesitas',
    slug: 'cancelar-modulo',
    category: 'marketplace',
    summary: 'Desactiva un módulo del Marketplace para dejar de pagar por él.',
    tags: ['marketplace', 'cancelar', 'módulo', 'desactivar'],
    body: `<div class="help-article">
<p class="help-intro">Si ya no necesitas un módulo, puedes cancelarlo en cualquier momento. El módulo seguirá funcionando hasta el final del período ya pagado y luego se desactivará automáticamente.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Marketplace</strong> en el menú.</li>
<li><strong>Filtra por "Activos"</strong> para ver solo los módulos que tienes habilitados.</li>
<li><strong>Haz clic en el módulo</strong> que quieres cancelar.</li>
<li><strong>Haz clic en "Cancelar módulo" o "Cancelar suscripción".</strong></li>
<li><strong>Confirma la cancelación.</strong> Verás el mensaje: "El módulo seguirá activo hasta [fecha] y luego se desactivará."</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Se pierden los datos cuando cancelo un módulo?</strong> No inmediatamente. Los datos quedan guardados. Si en el futuro reactivas el módulo, recuperas toda la información histórica.</p>
<p><strong>¿Se me devuelve el dinero si cancelo antes de fin de mes?</strong> Generalmente no. Al cancelar, el módulo queda activo hasta la siguiente fecha de facturación y luego se desactiva. No hay reembolso proporcional.</p>
</div></div>`,
    published: true, sort_order: 3,
  },
  {
    title: 'Cómo ver los módulos activos en mi cuenta',
    slug: 'ver-modulos-activos',
    category: 'marketplace',
    summary: 'Consulta qué módulos tienes activos y cuándo se renueva cada uno.',
    tags: ['marketplace', 'módulos activos', 'suscripción', 'renovación'],
    body: `<div class="help-article">
<p class="help-intro">Desde el Marketplace puedes ver un resumen de todos los módulos activos, su costo mensual y la próxima fecha de renovación.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve a Marketplace</strong> en el menú izquierdo.</li>
<li><strong>Haz clic en la pestaña "Mis módulos" o "Activos".</strong></li>
<li><strong>Verás la lista de módulos activos</strong> con: nombre del módulo, precio mensual, fecha de activación y próxima fecha de renovación o vencimiento.</li>
<li><strong>Si un módulo está en prueba gratuita</strong>, verás cuántos días le quedan antes de que se active el cobro.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cuánto pago en total por todos mis módulos?</strong> En la pantalla de Mis módulos debería aparecer el total mensual de todos los módulos activos.</p>
</div></div>`,
    published: true, sort_order: 4,
  },
  {
    title: '¿Qué son los módulos activados por cortesía del administrador?',
    slug: 'modulos-cortesia-administrador',
    category: 'marketplace',
    summary: 'Entiende qué significa cuando un módulo fue activado sin costo por el equipo de TurnFlow.',
    tags: ['marketplace', 'cortesía', 'gratuito', 'administrador'],
    body: `<div class="help-article">
<p class="help-intro">En ocasiones, el equipo de TurnFlow puede activarte un módulo de forma gratuita — como parte de un programa especial, una prueba extendida o un beneficio para tu negocio.</p>
<h3>¿Cómo reconocer un módulo de cortesía?</h3>
<p>En el Marketplace, los módulos activados por cortesía aparecen con la etiqueta <strong>"Activo · Cortesía"</strong> en color morado o índigo, en lugar del botón de suscripción o precio.</p>
<h3>¿Puedo cancelar un módulo de cortesía?</h3>
<p>Los módulos de cortesía son administrados por el equipo de TurnFlow. No aparece botón de cancelación normal. Si quieres que te lo desactiven, contáctanos por soporte.</p>
<h3>¿Se me cobrará algún día?</h3>
<p>No automáticamente. Los módulos de cortesía no generan cobro hasta que el equipo de TurnFlow lo indique y lo acuerde contigo.</p>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Cómo pido que me activen un módulo de cortesía?</strong> Contacta a nuestro equipo de soporte o a tu ejecutivo de cuenta si tienes uno asignado.</p>
</div></div>`,
    published: true, sort_order: 5,
  },

  // ── REPORTES ─────────────────────────────────────────────────────────────────
  {
    title: '¿Qué reportes están disponibles en TurnFlow?',
    slug: 'reportes-disponibles',
    category: 'reportes',
    summary: 'Conoce todos los reportes que puedes generar en TurnFlow para analizar tu negocio.',
    tags: ['reportes', 'estadísticas', 'datos', 'análisis'],
    body: `<div class="help-article">
<p class="help-intro">TurnFlow genera reportes automáticos de cada área de tu negocio. No necesitas exportar nada a Excel — los números están ahí, actualizados en tiempo real.</p>
<h3>Reportes disponibles</h3>
<ul>
<li><strong>Ventas:</strong> Total de ventas por período, ticket promedio, ventas por empleado, top productos vendidos, ventas pendientes de cobro.</li>
<li><strong>Clientes:</strong> Clientes nuevos del período, clientes más frecuentes, clientes inactivos, clientes con cumpleaños próximos.</li>
<li><strong>Inventario:</strong> Productos con stock bajo, productos más vendidos, movimientos de inventario.</li>
<li><strong>Citas:</strong> Citas completadas, canceladas, no show rate, asesor con más citas.</li>
<li><strong>Colas:</strong> Turnos atendidos, tiempo promedio de espera, hora pico.</li>
<li><strong>Encuestas:</strong> Puntaje promedio de satisfacción, distribución de calificaciones, comentarios recientes.</li>
<li><strong>Contabilidad:</strong> Balance ingresos vs gastos, flujo de caja, gastos por categoría.</li>
</ul>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿Puedo descargar todos los reportes?</strong> Sí. Todos los reportes tienen botón de Exportar para descargarlos en Excel o PDF.</p>
</div></div>`,
    published: true, sort_order: 1,
  },
  {
    title: 'Cómo exportar un reporte a Excel o PDF',
    slug: 'exportar-reporte-excel-pdf',
    category: 'reportes',
    summary: 'Descarga cualquier reporte de TurnFlow en formato Excel o PDF para compartirlo.',
    tags: ['reportes', 'exportar', 'Excel', 'PDF', 'descargar'],
    body: `<div class="help-article">
<p class="help-intro">Todos los reportes de TurnFlow se pueden descargar para compartirlos con tu contador, socio o equipo.</p>
<h3>Pasos</h3>
<ol>
<li><strong>Ve al reporte que quieres exportar</strong> (Ventas, Clientes, Contabilidad, etc.).</li>
<li><strong>Configura los filtros</strong> que necesitas: período, categoría, etc.</li>
<li><strong>Busca el botón "Exportar", "Descargar" o el ícono de descarga ⬇️.</strong> Generalmente está en la esquina superior derecha del reporte.</li>
<li><strong>Elige el formato:</strong> Excel (.xlsx) para datos que quieras manipular o analizar más, PDF para documentos formales que vas a imprimir o compartir por correo.</li>
<li><strong>El archivo se descarga</strong> automáticamente a tu carpeta de Descargas.</li>
</ol>
<div class="help-faq"><h3>Preguntas frecuentes</h3>
<p><strong>¿El archivo de Excel incluye todas las filas o solo las visibles en pantalla?</strong> Incluye todas las filas del período seleccionado, aunque la pantalla solo muestre las primeras. El Excel puede tener miles de filas sin problema.</p>
<p><strong>¿Puedo programar reportes automáticos que lleguen a mi correo?</strong> Dependiendo del plan, sí. Busca la opción "Programar reporte" para recibir el informe semanal o mensual automáticamente por correo.</p>
</div></div>`,
    published: true, sort_order: 2,
  },
]
