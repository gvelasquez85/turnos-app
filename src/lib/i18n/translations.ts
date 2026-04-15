// ─────────────────────────────────────────────────────────────────────────────
// TurnFlow i18n translations
// Add new keys to both 'es' and 'en' objects.
// Usage: const { t } = useT()  →  t('nav.branches')
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
] as const

export type LangCode = typeof SUPPORTED_LANGUAGES[number]['code']

export type TranslationKey = string

const TRANSLATIONS: Record<string, Record<LangCode, string>> = {
  // ── Navigation ──────────────────────────────────────────────
  'nav.branches': { es: 'Sucursales', en: 'Branches', pt: 'Filiais' },
  'nav.reasons': { es: 'Motivos', en: 'Reasons', pt: 'Motivos' },
  'nav.advisorFields': { es: 'Campos asesor', en: 'Advisor fields', pt: 'Campos do assessor' },
  'nav.customerForm': { es: 'Formulario cliente', en: 'Customer form', pt: 'Formulário do cliente' },
  'nav.promotions': { es: 'Promociones', en: 'Promotions', pt: 'Promoções' },
  'nav.queueMonitor': { es: 'Monitor de colas', en: 'Queue monitor', pt: 'Monitor de filas' },
  'nav.tvScreen': { es: 'Pantalla TV', en: 'TV Screen', pt: 'Tela TV' },
  'nav.queue': { es: 'Cola de espera', en: 'Queue', pt: 'Fila de espera' },
  'nav.reports': { es: 'Reportes', en: 'Reports', pt: 'Relatórios' },
  'nav.consents': { es: 'Autorizaciones', en: 'Authorizations', pt: 'Autorizações' },
  'nav.appointments': { es: 'Citas', en: 'Appointments', pt: 'Agendamentos' },
  'nav.surveys': { es: 'Encuestas', en: 'Surveys', pt: 'Pesquisas' },
  'nav.menu': { es: 'Menú / Preorden', en: 'Menu / Pre-order', pt: 'Menu / Pré-pedido' },
  'nav.team': { es: 'Equipo', en: 'Team', pt: 'Equipe' },
  'nav.customers': { es: 'Clientes', en: 'Customers', pt: 'Clientes' },
  'nav.brand': { es: 'Mi marca', en: 'My brand', pt: 'Minha marca' },
  'nav.brands': { es: 'Marcas', en: 'Brands', pt: 'Marcas' },
  'nav.memberships': { es: 'Membresías', en: 'Memberships', pt: 'Assinaturas' },
  'nav.users': { es: 'Usuarios', en: 'Users', pt: 'Usuários' },
  'nav.settings': { es: 'Configuración', en: 'Settings', pt: 'Configurações' },
  // ── Sections ─────────────────────────────────────────────────
  'section.brand': { es: 'Marca', en: 'Brand', pt: 'Marca' },
  'section.admin': { es: 'Administración', en: 'Administration', pt: 'Administração' },
  'section.brandMgmt': { es: 'Gestión de marca', en: 'Brand management', pt: 'Gestão da marca' },
  'section.operations': { es: 'Operación', en: 'Operations', pt: 'Operação' },
  'section.reportsSection': { es: 'Reportes', en: 'Reports', pt: 'Relatórios' },
  'section.modules': { es: 'Módulos adicionales', en: 'Add-on modules', pt: 'Módulos adicionais' },
  'section.superAdmin': { es: 'Administración', en: 'Administration', pt: 'Administração' },
  // ── Common actions ───────────────────────────────────────────
  'action.save': { es: 'Guardar', en: 'Save', pt: 'Salvar' },
  'action.cancel': { es: 'Cancelar', en: 'Cancel', pt: 'Cancelar' },
  'action.delete': { es: 'Eliminar', en: 'Delete', pt: 'Excluir' },
  'action.edit': { es: 'Editar', en: 'Edit', pt: 'Editar' },
  'action.new': { es: 'Nuevo', en: 'New', pt: 'Novo' },
  'action.add': { es: 'Agregar', en: 'Add', pt: 'Adicionar' },
  'action.confirm': { es: 'Confirmar', en: 'Confirm', pt: 'Confirmar' },
  'action.close': { es: 'Cerrar', en: 'Close', pt: 'Fechar' },
  'action.signOut': { es: 'Cerrar sesión', en: 'Sign out', pt: 'Sair' },
  'action.search': { es: 'Buscar', en: 'Search', pt: 'Buscar' },
  'action.filter': { es: 'Filtrar', en: 'Filter', pt: 'Filtrar' },
  // ── Queue / Advisor ──────────────────────────────────────────
  'queue.waiting': { es: 'En espera', en: 'Waiting', pt: 'Aguardando' },
  'queue.inProgress': { es: 'En atención', en: 'In progress', pt: 'Em atendimento' },
  'queue.done': { es: 'Atendidos hoy', en: 'Done today', pt: 'Atendidos hoje' },
  'queue.attend': { es: 'Atender', en: 'Attend', pt: 'Atender' },
  'queue.markDone': { es: 'Marcar como atendido', en: 'Mark as done', pt: 'Marcar como atendido' },
  'queue.noTickets': { es: 'No hay turnos en espera', en: 'No tickets waiting', pt: 'Sem fichas na fila' },
  'queue.qrTitle': { es: 'QR de turno', en: 'Queue QR', pt: 'QR da fila' },
  // ── Customer form ────────────────────────────────────────────
  'form.name': { es: 'Nombre completo', en: 'Full name', pt: 'Nome completo' },
  'form.phone': { es: 'Teléfono', en: 'Phone', pt: 'Telefone' },
  'form.email': { es: 'Correo electrónico', en: 'Email address', pt: 'E-mail' },
  'form.takeTurn': { es: 'Tomar turno', en: 'Take a turn', pt: 'Pegar senha' },
  'form.continue': { es: 'Continuar', en: 'Continue', pt: 'Continuar' },
  'form.yourData': { es: 'Tus datos', en: 'Your information', pt: 'Seus dados' },
  'form.dataConsent': { es: 'Autorizo el tratamiento de mis datos personales según la política de privacidad', en: 'I authorize the processing of my personal data according to the privacy policy', pt: 'Autorizo o tratamento dos meus dados pessoais conforme a política de privacidade' },
  'form.marketing': { es: 'Acepto recibir promociones y novedades', en: 'I agree to receive promotions and news', pt: 'Aceito receber promoções e novidades' },
  'form.policyTitle': { es: 'Ver política de tratamiento de datos', en: 'View data processing policy', pt: 'Ver política de tratamento de dados' },
  // ── Establishments ───────────────────────────────────────────
  'est.new': { es: 'Nueva sucursal', en: 'New branch', pt: 'Nova filial' },
  'est.name': { es: 'Nombre', en: 'Name', pt: 'Nome' },
  'est.address': { es: 'Dirección', en: 'Address', pt: 'Endereço' },
  'est.active': { es: 'Activo', en: 'Active', pt: 'Ativo' },
  'est.inactive': { es: 'Inactivo', en: 'Inactive', pt: 'Inativo' },
  // ── Misc ─────────────────────────────────────────────────────
  'misc.allBrands': { es: '— Todas las marcas —', en: '— All brands —', pt: '— Todas as marcas —' },
  'misc.loading': { es: 'Cargando...', en: 'Loading...', pt: 'Carregando...' },
  'misc.noData': { es: 'Sin datos', en: 'No data', pt: 'Sem dados' },
  'misc.requiredField': { es: 'Campo obligatorio', en: 'Required field', pt: 'Campo obrigatório' },
  'misc.optional': { es: 'opcional', en: 'optional', pt: 'opcional' },
  // ── Brand profile ────────────────────────────────────────────
  'brand.title': { es: 'Mi marca', en: 'My brand', pt: 'Minha marca' },
  'brand.save': { es: 'Guardar cambios', en: 'Save changes', pt: 'Salvar alterações' },
  'brand.saved': { es: 'Guardado', en: 'Saved', pt: 'Salvo' },
  'brand.logo': { es: 'URL del logo', en: 'Logo URL', pt: 'URL do logotipo' },
  'brand.color': { es: 'Color principal', en: 'Primary color', pt: 'Cor principal' },
  'brand.address': { es: 'Dirección principal', en: 'Main address', pt: 'Endereço principal' },
  'brand.country': { es: 'País', en: 'Country', pt: 'País' },
  'brand.email': { es: 'Correo de contacto', en: 'Contact email', pt: 'Email de contato' },
  'brand.website': { es: 'Sitio web', en: 'Website', pt: 'Site' },
  'brand.language': { es: 'Idioma de la plataforma', en: 'Platform language', pt: 'Idioma da plataforma' },
  // ── Membership ───────────────────────────────────────────────
  'membership.title': { es: 'Membresía', en: 'Membership', pt: 'Assinatura' },
  'membership.plan': { es: 'Plan actual', en: 'Current plan', pt: 'Plano atual' },
  'membership.free': { es: 'Gratis', en: 'Free', pt: 'Grátis' },
  'membership.status.active': { es: 'Activa', en: 'Active', pt: 'Ativa' },
  'membership.status.trial': { es: 'Prueba', en: 'Trial', pt: 'Avaliação' },
  'membership.status.expired': { es: 'Vencida', en: 'Expired', pt: 'Vencida' },
  'membership.status.cancelled': { es: 'Cancelada', en: 'Cancelled', pt: 'Cancelada' },
  'membership.branches': { es: 'Sucursales', en: 'Branches', pt: 'Filiais' },
  'membership.users': { es: 'Usuarios', en: 'Users', pt: 'Usuários' },
  'membership.nextBill': { es: 'Próxima factura', en: 'Next invoice', pt: 'Próxima fatura' },
  'membership.totalEst': { es: 'Total estimado', en: 'Estimated total', pt: 'Total estimado' },
  'membership.payment': { es: 'Medio de pago', en: 'Payment method', pt: 'Meio de pagamento' },
  'membership.subscribe': { es: 'Suscribirse con PayPal', en: 'Subscribe with PayPal', pt: 'Assinar com PayPal' },
  'membership.update': { es: 'Actualizar suscripción', en: 'Update subscription', pt: 'Atualizar assinatura' },
  'membership.noRefunds': { es: 'No aplican reembolsos.', en: 'No refunds apply.', pt: 'Sem reembolsos.' },
  'membership.freeNotice': { es: 'Plan gratuito — sin costo mientras estés en los límites incluidos', en: 'Free plan — no cost while within included limits', pt: 'Plano gratuito — sem custo dentro dos limites incluídos' },
  'membership.adjustCapacity': { es: 'Ajustar capacidad', en: 'Adjust capacity', pt: 'Ajustar capacidade' },
  'membership.modules': { es: 'Módulos adicionales', en: 'Additional modules', pt: 'Módulos adicionais' },
  // ── Extended actions ─────────────────────────────────────────
  'action.upgrade': { es: 'Actualizar plan', en: 'Upgrade plan', pt: 'Atualizar plano' },
  'action.contact': { es: 'Contactar soporte', en: 'Contact support', pt: 'Contatar suporte' },
  'action.download': { es: 'Descargar', en: 'Download', pt: 'Baixar' },
  'action.preview': { es: 'Vista previa', en: 'Preview', pt: 'Visualizar' },
  'action.copy': { es: 'Copiar', en: 'Copy', pt: 'Copiar' },
  'action.revoke': { es: 'Revocar', en: 'Revoke', pt: 'Revogar' },
  'action.generate': { es: 'Generar', en: 'Generate', pt: 'Gerar' },
  'action.send': { es: 'Enviar', en: 'Send', pt: 'Enviar' },
  'action.test': { es: 'Probar', en: 'Test', pt: 'Testar' },
  'action.activate': { es: 'Activar', en: 'Activate', pt: 'Ativar' },
  'action.deactivate': { es: 'Desactivar', en: 'Deactivate', pt: 'Desativar' },
  'action.hire': { es: 'Contratar', en: 'Hire', pt: 'Contratar' },
  'action.cancelModule': { es: 'Cancelar módulo', en: 'Cancel module', pt: 'Cancelar módulo' },
  // ── Messages ─────────────────────────────────────────────────
  'msg.saving': { es: 'Guardando...', en: 'Saving...', pt: 'Salvando...' },
  'msg.loading': { es: 'Cargando...', en: 'Loading...', pt: 'Carregando...' },
  'msg.success': { es: '¡Éxito!', en: 'Success!', pt: 'Sucesso!' },
  'msg.error': { es: 'Ocurrió un error', en: 'An error occurred', pt: 'Ocorreu um erro' },
  'msg.confirmDelete': { es: '¿Estás seguro?', en: 'Are you sure?', pt: 'Tem certeza?' },
  'msg.noResults': { es: 'Sin resultados', en: 'No results', pt: 'Sem resultados' },
  'msg.empty': { es: 'Sin datos', en: 'No data', pt: 'Sem dados' },
  'msg.required': { es: 'Campo requerido', en: 'Required field', pt: 'Campo obrigatório' },
  'msg.limitReached': { es: 'Límite alcanzado', en: 'Limit reached', pt: 'Limite atingido' },
  'msg.upgradeNeeded': { es: 'Actualiza tu membresía para agregar más.', en: 'Upgrade your membership to add more.', pt: 'Atualize sua assinatura para adicionar mais.' },
  // ── CRM ──────────────────────────────────────────────────────
  'crm.title': { es: 'Clientes', en: 'Customers', pt: 'Clientes' },
  'crm.newCustomer': { es: 'Nuevo cliente', en: 'New customer', pt: 'Novo cliente' },
  'crm.editCustomer': { es: 'Editar cliente', en: 'Edit customer', pt: 'Editar cliente' },
  'crm.search': { es: 'Buscar clientes...', en: 'Search customers...', pt: 'Buscar clientes...' },
  'crm.visits': { es: 'Visitas', en: 'Visits', pt: 'Visitas' },
  'crm.lastVisit': { es: 'Última visita', en: 'Last visit', pt: 'Última visita' },
  'crm.notes': { es: 'Notas', en: 'Notes', pt: 'Notas' },
  'crm.document': { es: 'Documento de identidad', en: 'ID document', pt: 'Documento de identidade' },
  'crm.sendPush': { es: 'Enviar push', en: 'Send push', pt: 'Enviar push' },
  'crm.sendAll': { es: 'Enviar a todos', en: 'Send to all', pt: 'Enviar para todos' },
  // ── Consent ──────────────────────────────────────────────────
  'consent.title': { es: 'Autorizaciones de datos', en: 'Data authorizations', pt: 'Autorizações de dados' },
  'consent.search': { es: 'Buscar por nombre, teléfono o correo...', en: 'Search by name, phone or email...', pt: 'Buscar por nome, telefone ou email...' },
  'consent.branchDeleted': { es: 'Sucursal eliminada', en: 'Branch deleted', pt: 'Filial excluída' },
  // ── Integrations ─────────────────────────────────────────────
  'integration.apiKeys': { es: 'API Keys', en: 'API Keys', pt: 'Chaves de API' },
  'integration.webhooks': { es: 'Webhooks salientes', en: 'Outgoing webhooks', pt: 'Webhooks de saída' },
  // ── Advisor panel ────────────────────────────────────────────
  'advisor.attending': { es: 'Atendiendo turno', en: 'Attending ticket', pt: 'Atendendo senha' },
  'advisor.markDone': { es: 'Marcar como atendido', en: 'Mark as attended', pt: 'Marcar como atendido' },
  'advisor.clientData': { es: 'Datos del cliente', en: 'Customer data', pt: 'Dados do cliente' },
  'advisor.internalNotes': { es: 'Notas internas', en: 'Internal notes', pt: 'Notas internas' },
  'advisor.noQueue': { es: 'No hay turnos en espera', en: 'No tickets waiting', pt: 'Sem senhas esperando' },
  // ── Authentication ───────────────────────────────────────────
  'auth.login': { es: 'Ingresar', en: 'Sign in', pt: 'Entrar' },
  'auth.logout': { es: 'Cerrar sesión', en: 'Sign out', pt: 'Sair' },
  'auth.email': { es: 'Correo electrónico', en: 'Email address', pt: 'Endereço de email' },
  'auth.password': { es: 'Contraseña', en: 'Password', pt: 'Senha' },
  'auth.forgotPassword': { es: 'Olvidé mi contraseña', en: 'Forgot my password', pt: 'Esqueci minha senha' },
  'auth.resetPassword': { es: 'Restablecer contraseña', en: 'Reset password', pt: 'Redefinir senha' },
  // ── Reports ──────────────────────────────────────────────────
  'report.title': { es: 'Reportes', en: 'Reports', pt: 'Relatórios' },
  'report.export': { es: 'Exportar', en: 'Export', pt: 'Exportar' },
  'report.print': { es: 'Imprimir', en: 'Print', pt: 'Imprimir' },
  'report.today': { es: 'Hoy', en: 'Today', pt: 'Hoje' },
  // ── Display / TV ─────────────────────────────────────────────
  'display.yourTurn': { es: '¡Es tu turno!', en: "It's your turn!", pt: 'É sua vez!' },
  'display.calling': { es: 'Llamando', en: 'Calling', pt: 'Chamando' },
  'display.waiting': { es: 'En espera', en: 'Waiting', pt: 'Aguardando' },
  'display.poweredBy': { es: 'Impulsado por', en: 'Powered by', pt: 'Desenvolvido por' },
  // ── Marketplace ──────────────────────────────────────────────
  'marketplace.title': { es: 'Marketplace', en: 'Marketplace', pt: 'Marketplace' },
  'marketplace.comingSoon': { es: 'Próximamente', en: 'Coming soon', pt: 'Em breve' },
  'marketplace.trial': { es: 'días de prueba gratis', en: 'free trial days', pt: 'dias de teste grátis' },
  'marketplace.perMonth': { es: '/mes', en: '/month', pt: '/mês' },
  'marketplace.perUser': { es: '/usuario/mes', en: '/user/month', pt: '/usuário/mês' },
  // ── Appointments ─────────────────────────────────────────────
  'appt.title': { es: 'Citas', en: 'Appointments', pt: 'Agendamentos' },
  'appt.new': { es: 'Nueva cita', en: 'New appointment', pt: 'Novo agendamento' },
  // ── Surveys ──────────────────────────────────────────────────
  'survey.title': { es: 'Encuestas', en: 'Surveys', pt: 'Pesquisas' },
  // ── Promotions ───────────────────────────────────────────────
  'promo.title': { es: 'Promociones', en: 'Promotions', pt: 'Promoções' },
  // ── Menu ─────────────────────────────────────────────────────
  'menu.title': { es: 'Menú / Preorden', en: 'Menu / Preorder', pt: 'Cardápio / Pré-pedido' },
  'menu.orderSent': { es: '¡Pedido enviado!', en: 'Order sent!', pt: 'Pedido enviado!' },
  // ── Table columns ────────────────────────────────────────────
  'table.name': { es: 'Nombre', en: 'Name', pt: 'Nome' },
  'table.email': { es: 'Correo', en: 'Email', pt: 'Email' },
  'table.phone': { es: 'Teléfono', en: 'Phone', pt: 'Telefone' },
  'table.status': { es: 'Estado', en: 'Status', pt: 'Status' },
  'table.date': { es: 'Fecha', en: 'Date', pt: 'Data' },
  'table.actions': { es: 'Acciones', en: 'Actions', pt: 'Ações' },
  'table.role': { es: 'Rol', en: 'Role', pt: 'Função' },
  'table.branch': { es: 'Sucursal', en: 'Branch', pt: 'Filial' },
  'table.brand': { es: 'Marca', en: 'Brand', pt: 'Marca' },
}

export function getTranslations(lang: LangCode): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, values] of Object.entries(TRANSLATIONS)) {
    result[key] = values[lang] ?? values['es']
  }
  return result
}

export function translate(lang: LangCode, key: string, fallback?: string): string {
  return TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.['es'] ?? fallback ?? key
}
