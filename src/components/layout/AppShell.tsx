'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, MessageSquare, FileText, Tag, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, LayoutDashboard, X, Eye, ArrowLeft,
  CalendarClock, ClipboardList, Monitor, UtensilsCrossed,
  Settings, Shield, UserCircle, CreditCard, Zap, Clock,
  ShoppingCart, Package, FileCheck, PieChart, TrendingUp, HelpCircle,
  BookOpen, Receipt, MessageSquareWarning, Building, ToggleRight,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'
import { useBrandStore } from '@/stores/brandStore'
import { I18nProvider, useT } from '@/lib/i18n/context'
import { SUPPORTED_LANGUAGES, type LangCode } from '@/lib/i18n/translations'
// Dark mode toggle moved to /profile → ProfileSettings.tsx

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem {
  href: string
  label: string
  labelKey?: string  // i18n translation key (optional)
  icon: React.ElementType
  exact?: boolean
}

interface NavSection {
  key: string
  section: string
  sectionKey?: string  // i18n translation key for section header
  items: NavItem[]
}

// ─── Item definitions ──────────────────────────────────────────────────────────

const HOME_ITEM: NavItem = { href: '/admin/home', label: 'Inicio', labelKey: 'nav.home', icon: LayoutDashboard, exact: true }

const BRAND_ITEMS: NavItem[] = [
  { href: '/admin/brand', label: 'Mi marca', labelKey: 'nav.brand', icon: Building2 },
  { href: '/admin/sucursales', label: 'Sucursales', labelKey: 'nav.branches', icon: Store, exact: true },
  { href: '/admin/users', label: 'Equipo', labelKey: 'nav.team', icon: Users },
]

const MANAGER_BRAND_ITEMS: NavItem[] = [
  { href: '/admin/brand', label: 'Mi marca', labelKey: 'nav.brand', icon: Building2 },
  { href: '/admin/sucursales', label: 'Sucursales', labelKey: 'nav.branches', icon: Store, exact: true },
]

const PROMOTIONS_ITEM: NavItem = { href: '/admin/promotions', label: 'Promociones', labelKey: 'nav.promotions', icon: Tag }

const CLIENTES_ITEMS: NavItem[] = [
  { href: '/admin/clientes', label: 'Clientes', labelKey: 'nav.customers', icon: Users },
  { href: '/admin/consents', label: 'Autorizaciones', labelKey: 'nav.consents', icon: Shield },
]

const QUEUE_ITEMS: NavItem[] = [
  { href: '/admin/queue', label: 'Monitor de colas', labelKey: 'nav.queueMonitor', icon: Clock },
  { href: '/advisor', label: 'Cola de espera', labelKey: 'nav.queue', icon: LayoutDashboard, exact: true },
  { href: '/admin/visit-reasons', label: 'Motivos', labelKey: 'nav.reasons', icon: MessageSquare },
  { href: '/admin/advisor-fields', label: 'Campos asesor', labelKey: 'nav.advisorFields', icon: FileText },
  { href: '/admin/brand/form-config', label: 'Formulario cliente', labelKey: 'nav.customerForm', icon: ClipboardList },
  { href: '/admin/display', label: 'Pantalla TV', labelKey: 'nav.tvScreen', icon: Monitor },
]

const APPOINTMENTS_ITEMS: NavItem[] = [
  { href: '/admin/appointments', label: 'Citas', labelKey: 'nav.appointments', icon: CalendarClock },
  { href: '/admin/visit-reasons', label: 'Motivos de visita', labelKey: 'nav.reasons', icon: MessageSquare },
]

const MENSAJES_ITEMS: NavItem[] = [
  { href: '/admin/mensajes', label: 'Mensajes WhatsApp', icon: MessageSquare },
]

const SURVEYS_ITEMS: NavItem[] = [
  { href: '/admin/surveys', label: 'Encuestas', labelKey: 'nav.surveys', icon: ClipboardList },
]

const MENU_ITEMS: NavItem[] = [
  { href: '/admin/menu', label: 'Menú / Preorden', labelKey: 'nav.menu', icon: UtensilsCrossed },
]

const VENTAS_ITEMS: NavItem[] = [
  { href: '/admin/ventas', label: 'Ventas', labelKey: 'nav.sales', icon: ShoppingCart, exact: true },
  { href: '/admin/ventas/inventario', label: 'Inventario', labelKey: 'nav.inventory', icon: Package },
  { href: '/admin/ventas/cotizaciones', label: 'Cotizaciones', labelKey: 'nav.quotes', icon: FileCheck, exact: true },
  { href: '/admin/ventas/cotizaciones/personalizar', label: 'Personalizar', labelKey: 'nav.customize', icon: PieChart },
]

const REPORTES_ITEMS_BASE: NavItem[] = [
  { href: '/admin/reportes/clientes', label: 'Clientes', labelKey: 'nav.customers', icon: Users },
]

const REPORTES_QUEUE_ITEM: NavItem = { href: '/admin/reportes/atencion', label: 'Atención', labelKey: 'nav.attention', icon: Clock }
const REPORTES_VENTAS_ITEM: NavItem = { href: '/admin/reportes/ventas', label: 'Ventas', labelKey: 'nav.sales', icon: TrendingUp }
const REPORTES_PRODUCTOS_ITEM: NavItem = { href: '/admin/reportes/productos', label: 'Productos', labelKey: 'nav.products', icon: Package }
const REPORTES_COTIZACIONES_ITEM: NavItem = { href: '/admin/reportes/cotizaciones', label: 'Cotizaciones', labelKey: 'nav.quotes', icon: FileCheck }

// ─── Section builder ────────────────────────────────────────────────────────────

function buildSections(
  role: AppRole,
  activeModules?: Record<string, boolean>,
): NavSection[] {
  if (role === 'reporting') {
    return [{ key: 'reportes', section: 'Reportes', items: [{ href: '/reports', label: 'Reportes', icon: BarChart2 }] }]
  }

  if (role === 'advisor') {
    const advisorSections: NavSection[] = []
    if (activeModules?.queue === true) {
      advisorSections.push({
        key: 'colas', section: 'Colas de espera', sectionKey: 'section.queues',
        items: [{ href: '/advisor', label: 'Cola de espera', labelKey: 'nav.queue', icon: LayoutDashboard, exact: true }],
      })
    }
    if (activeModules?.appointments === true) {
      advisorSections.push({ key: 'citas', section: 'Citas', sectionKey: 'section.appointments', items: APPOINTMENTS_ITEMS })
    }
    if (activeModules?.surveys === true) {
      advisorSections.push({ key: 'encuestas', section: 'Encuestas', sectionKey: 'section.surveys', items: SURVEYS_ITEMS })
    }
    if (activeModules?.menu === true) {
      advisorSections.push({ key: 'menu_preorden', section: 'Menú / Preorden', sectionKey: 'section.menu', items: MENU_ITEMS })
    }
    const clientesItems = activeModules?.queue ? CLIENTES_ITEMS : CLIENTES_ITEMS.filter(i => i.href !== '/admin/consents')
    advisorSections.push({ key: 'clientes', section: 'Clientes', sectionKey: 'section.clients', items: clientesItems })
    advisorSections.push({ key: 'ventas', section: 'Ventas', sectionKey: 'section.sales', items: VENTAS_ITEMS })
    return [{ key: 'home', section: 'Inicio', sectionKey: 'nav.home', items: [HOME_ITEM] }, ...advisorSections]
  }

  if (role === 'superadmin') {
    return [
      {
        key: 'admin', section: 'Administración', sectionKey: 'section.admin',
        items: [
          { href: '/superadmin', label: 'Marcas', labelKey: 'nav.brands', icon: Building2, exact: true },
          { href: '/superadmin/memberships', label: 'Membresías', labelKey: 'nav.memberships', icon: CreditCard },
          { href: '/superadmin/users', label: 'Usuarios', labelKey: 'nav.users', icon: Users },
          { href: '/superadmin/analytics', label: 'Analytics', icon: BarChart2 },
          { href: '/superadmin/marketplace', label: 'Marketplace', icon: Zap },
          { href: '/superadmin/modules', label: 'Módulos x Marca', icon: ToggleRight },
          { href: '/superadmin/cms', label: 'Contenido', icon: FileText },
          { href: '/superadmin/help', label: 'Centro de Ayuda', icon: HelpCircle },
          { href: '/superadmin/settings', label: 'Configuración', labelKey: 'nav.settings', icon: Settings },
        ],
      },
      { key: 'marca', section: 'Mi Marca', sectionKey: 'section.myBrand', items: BRAND_ITEMS },
      { key: 'clientes', section: 'Clientes', sectionKey: 'section.clients', items: CLIENTES_ITEMS },
      { key: 'colas', section: 'Colas de espera', sectionKey: 'section.queues', items: [...QUEUE_ITEMS, PROMOTIONS_ITEM] },
      { key: 'citas', section: 'Citas', sectionKey: 'section.appointments', items: APPOINTMENTS_ITEMS },
      { key: 'encuestas', section: 'Encuestas', sectionKey: 'section.surveys', items: SURVEYS_ITEMS },
      { key: 'menu_preorden', section: 'Menú / Preorden', sectionKey: 'section.menu', items: MENU_ITEMS },
      { key: 'ventas', section: 'Ventas', sectionKey: 'section.sales', items: VENTAS_ITEMS },
      { key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS },
      {
        key: 'reportes', section: 'Reportes', sectionKey: 'section.reportsSection', items: [
          ...REPORTES_ITEMS_BASE,
          REPORTES_QUEUE_ITEM,
          REPORTES_VENTAS_ITEM,
          REPORTES_PRODUCTOS_ITEM,
          REPORTES_COTIZACIONES_ITEM,
        ],
      },
      { key: 'contabilidad', section: 'Contabilidad', items: [
        { href: '/admin/contabilidad', label: 'Contabilidad NIIF', icon: BookOpen },
      ] },
      { key: 'facturacion', section: 'Facturación', items: [
        { href: '/admin/facturacion', label: 'Facturación DIAN', icon: Receipt },
      ] },
      { key: 'pqrs', section: 'PQRS', items: [
        { href: '/admin/pqrs', label: 'Gestión PQRS', icon: MessageSquareWarning },
      ] },
      { key: 'copropiedades', section: 'Copropiedades', items: [
        { href: '/admin/copropiedades', label: 'Copropiedades', icon: Building },
      ] },
    ]
  }

  // brand_admin / manager
  const brandItems = role === 'brand_admin' ? BRAND_ITEMS : MANAGER_BRAND_ITEMS

  const clientesFiltered = activeModules?.queue ? CLIENTES_ITEMS : CLIENTES_ITEMS.filter(i => i.href !== '/admin/consents')
  const sections: NavSection[] = [
    { key: 'home', section: 'Inicio', sectionKey: 'nav.home', items: [HOME_ITEM] },
    { key: 'marca', section: 'Mi Marca', sectionKey: 'section.myBrand', items: brandItems },
    { key: 'clientes', section: 'Clientes', sectionKey: 'section.clients', items: clientesFiltered },
  ]

  // Queue module — paid, includes Promotions when active
  if (activeModules?.queue) {
    const queueItems = [...QUEUE_ITEMS, PROMOTIONS_ITEM]
    sections.push({ key: 'colas', section: 'Colas de espera', sectionKey: 'section.queues', items: queueItems })
  }
  if (activeModules?.appointments) {
    sections.push({ key: 'citas', section: 'Citas', sectionKey: 'section.appointments', items: APPOINTMENTS_ITEMS })
  }
  if (activeModules?.surveys) {
    sections.push({ key: 'encuestas', section: 'Encuestas', sectionKey: 'section.surveys', items: SURVEYS_ITEMS })
  }
  if (activeModules?.menu) {
    sections.push({ key: 'menu_preorden', section: 'Menú / Preorden', sectionKey: 'section.menu', items: MENU_ITEMS })
  }

  sections.push({ key: 'ventas', section: 'Ventas', sectionKey: 'section.sales', items: VENTAS_ITEMS })
  if (activeModules?.mensajes) {
    sections.push({ key: 'mensajes', section: 'Mensajes', items: MENSAJES_ITEMS })
  }

  const reportesItems: NavItem[] = [...REPORTES_ITEMS_BASE]
  if (activeModules?.queue) reportesItems.push(REPORTES_QUEUE_ITEM)
  reportesItems.push(REPORTES_VENTAS_ITEM)
  reportesItems.push(REPORTES_PRODUCTOS_ITEM)
  reportesItems.push(REPORTES_COTIZACIONES_ITEM)
  sections.push({ key: 'reportes', section: 'Reportes', sectionKey: 'section.reportsSection', items: reportesItems })

  if (activeModules?.contabilidad) {
    sections.push({ key: 'contabilidad', section: 'Contabilidad', items: [
      { href: '/admin/contabilidad', label: 'Contabilidad NIIF', icon: BookOpen },
    ] })
  }
  if (activeModules?.facturacion) {
    sections.push({ key: 'facturacion', section: 'Facturación', items: [
      { href: '/admin/facturacion', label: 'Facturación DIAN', icon: Receipt },
    ] })
  }
  if (activeModules?.pqrs) {
    sections.push({ key: 'pqrs', section: 'PQRS', items: [
      { href: '/admin/pqrs', label: 'Gestión PQRS', icon: MessageSquareWarning },
    ] })
  }
  if (activeModules?.copropiedades) {
    sections.push({ key: 'copropiedades', section: 'Copropiedades', items: [
      { href: '/admin/copropiedades', label: 'Copropiedades', icon: Building },
    ] })
  }

  sections.push({ key: 'marketplace', section: 'Más', sectionKey: 'section.more', items: [
    { href: '/admin/marketplace', label: 'Marketplace', icon: Zap },
    { href: '/ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
  ] })
  return sections
}

const roleLabel: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  brand_admin: 'Admin',
  manager: 'Manager',
  advisor: 'Agente',
  reporting: 'Reportes',
}

export interface AppShellProps {
  children: React.ReactNode
  role: AppRole
  fullName?: string | null
  email: string
  brandName?: string | null
  establishmentName?: string | null
  establishmentSlug?: string | null
  brands?: { id: string; name: string }[]
  activeModules?: Record<string, boolean>
  plan?: string
  lang?: LangCode
}

const CAN_IMPERSONATE: AppRole[] = ['superadmin', 'brand_admin']

function AppShellInner({
  children, role, fullName, email, brandName, establishmentName, establishmentSlug,
  brands: initialBrands, activeModules, plan,
}: AppShellProps) {
  const { t, lang, setLang } = useT()
  // Dark mode toggle moved to profile settings
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [viewAs, setViewAs] = useState<AppRole | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBrandId, setSelectedBrandId } = useBrandStore()
  const [brands, setBrands] = useState<{ id: string; name: string }[]>(initialBrands || [])
  const brandInitialized = useRef(false)

  useEffect(() => {
    if (role === 'superadmin' && (!initialBrands || initialBrands.length === 0)) {
      createClient().from('brands').select('id, name').order('name').then(({ data }) => {
        if (data) setBrands(data)
      })
    }
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!brandInitialized.current && brands.length > 0 && !selectedBrandId) {
      brandInitialized.current = true
      if (role !== 'superadmin') setSelectedBrandId(brands[0].id)
    }
    if (brands.length > 0) brandInitialized.current = true
  }, [brands]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {}
    try {
      const savedSections = localStorage.getItem('sidebar-sections-collapsed')
      if (savedSections) setCollapsedSections(JSON.parse(savedSections))
    } catch {}
    try {
      const m = document.cookie.match(/ta_view_as=([^;]+)/)
      const validRoles: AppRole[] = ['superadmin', 'brand_admin', 'manager', 'advisor', 'reporting']
      if (m && validRoles.includes(m[1] as AppRole)) setViewAs(m[1] as AppRole)
      else if (m) document.cookie = 'ta_view_as=; path=/; max-age=0'
    } catch {}
  }, [])

  function startImpersonate() {
    document.cookie = 'ta_view_as=advisor; path=/; max-age=7200'
    setViewAs('advisor')
    router.push('/advisor')
  }

  function stopImpersonate() {
    document.cookie = 'ta_view_as=; path=/; max-age=0'
    setViewAs(null)
    router.push('/admin')
  }

  function startBrandManager() {
    if (!selectedBrandId) return
    document.cookie = `sa_brand=${selectedBrandId}; path=/; max-age=7200`
    document.cookie = 'ta_view_as=brand_admin; path=/; max-age=7200'
    setViewAs('brand_admin')
    router.push('/admin')
  }

  function stopBrandManager() {
    document.cookie = 'ta_view_as=; path=/; max-age=0'
    setViewAs(null)
    router.push('/superadmin')
  }

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  function toggleSectionCollapsed(key: string) {
    setCollapsedSections(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem('sidebar-sections-collapsed', JSON.stringify(next)) } catch {}
      return next
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  // Determine which sections to show based on viewAs (impersonation)
  const activeRole = (viewAs && ['superadmin', 'brand_admin', 'manager', 'advisor', 'reporting'].includes(viewAs) ? viewAs : null) || role
  const sections = buildSections(activeRole, activeModules)
  const subtitle = brandName
    ? establishmentName ? `${brandName} · ${establishmentName}` : brandName
    : null

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const isCollapsed = collapsed && !mobile
    return (
      <>
        {/* Header */}
        <div className={cn(
          'flex items-center h-14 px-3 border-b border-gray-100 dark:border-gray-800 shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between',
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <TurnFlowLogo size={28} />
              <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">TurnFlow</span>
            </div>
          )}
          {isCollapsed && <TurnFlowLogo size={26} />}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hidden md:flex items-center justify-center shrink-0"
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 md:hidden shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Brand selector + Brand Manager toggle (superadmin only) */}
        {role === 'superadmin' && brands.length > 0 && !isCollapsed && !viewAs && (
          <div className="px-3 pt-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Marca</p>
            <select
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none"
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
            >
              <option value="">— Todas las marcas —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {selectedBrandId && (
              <button
                onClick={startBrandManager}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Eye size={13} />
                Gestionar marca
              </button>
            )}
          </div>
        )}
        {role === 'superadmin' && viewAs === 'brand_admin' && !isCollapsed && (
          <div className="px-3 pt-2 pb-2 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mb-1">Brand Manager</p>
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 truncate">
              {brands.find(b => b.id === selectedBrandId)?.name || 'Marca'}
            </p>
          </div>
        )}
        {role === 'superadmin' && brands.length > 0 && isCollapsed && (
          <div className="flex justify-center py-2 border-b border-gray-100 dark:border-gray-800">
            <Building2 size={16} className={viewAs === 'brand_admin' ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'} aria-label={brands.find(b => b.id === selectedBrandId)?.name} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sections.map((section, si) => {
            const isSectionCollapsed = !isCollapsed && !!collapsedSections[section.key]

            return (
              <div key={section.key} className={cn('flex flex-col', si > 0 && 'mt-1')}>
                {/* Section header with collapse toggle */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleSectionCollapsed(section.key)}
                    className="flex items-center justify-between w-full px-2 pt-3 pb-1 group"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                      {section.sectionKey ? t(section.sectionKey, section.section) : section.section}
                    </span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        'text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-all',
                        isSectionCollapsed ? '-rotate-90' : 'rotate-0',
                      )}
                    />
                  </button>
                ) : (
                  si > 0 && <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-2" />
                )}

                {/* Section items */}
                {!isSectionCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {section.items.map(item => {
                      const active = isActive(item.href, item.exact)
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={isCollapsed ? (item.labelKey ? t(item.labelKey, item.label) : item.label) : undefined}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors',
                            isCollapsed && 'justify-center',
                            active
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
                          )}
                        >
                          <Icon size={17} className="shrink-0" />
                          {!isCollapsed && <span>{item.labelKey ? t(item.labelKey, item.label) : item.label}</span>}
                        </Link>
                      )
                    })}
                    {/* "Ver como agente" — inside queue section */}
                    {section.key === 'colas' && CAN_IMPERSONATE.includes(role) && !viewAs && (
                      <button
                        onClick={startImpersonate}
                        title={isCollapsed ? 'Ver como agente' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full transition-colors',
                          isCollapsed && 'justify-center',
                        )}
                      >
                        <Eye size={17} className="shrink-0" />
                        {!isCollapsed && <span>Ver como agente</span>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer — quick actions only */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-2">
          {/* Pantalla TV (advisor with establishment) — solo si módulo queue activo */}
          {activeRole === 'advisor' && establishmentSlug && activeModules?.queue === true && (
            <a
              href={`/display/${establishmentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? 'Pantalla TV' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 w-full transition-colors mb-1',
                isCollapsed && 'justify-center',
              )}
            >
              <Monitor size={15} />
              {!isCollapsed && <span>Pantalla TV</span>}
            </a>
          )}
          {/* Salir de vista — only shown during impersonation */}
          {viewAs === 'advisor' && (
            <button
              onClick={stopImpersonate}
              title={isCollapsed ? 'Salir de vista asesor' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 w-full transition-colors',
                isCollapsed && 'justify-center',
              )}
            >
              <Eye size={15} />
              {!isCollapsed && <span>Salir de vista asesor</span>}
            </button>
          )}
          {viewAs === 'brand_admin' && role === 'superadmin' && (
            <button
              onClick={stopBrandManager}
              title={isCollapsed ? 'Volver a Superadmin' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 w-full transition-colors',
                isCollapsed && 'justify-center',
              )}
            >
              <ArrowLeft size={15} />
              {!isCollapsed && <span>Volver a Superadmin</span>}
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Desktop sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col z-30 transition-all duration-200 hidden md:flex overflow-hidden',
        collapsed ? 'w-16' : 'w-56',
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-30 transition-transform duration-200 w-64 md:hidden overflow-hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent mobile />
      </aside>

      {/* Main content */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-200 overflow-x-hidden',
        collapsed ? 'md:ml-16' : 'md:ml-56',
      )}>
        {/* Top bar — profile, logout, lang */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
          {/* Left: mobile hamburger + logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              <Menu size={20} />
            </button>
            <TurnFlowLogo size={24} />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">TurnFlow</span>
          </div>
          {/* Left spacer on desktop */}
          <div className="hidden md:block" />

          {/* Right: profile + actions */}
          <div className="flex items-center gap-2">
            {role === 'superadmin' && (
              <select
                value={lang}
                onChange={e => setLang(e.target.value as LangCode)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 focus:border-indigo-400 focus:outline-none cursor-pointer"
                title="Idioma / Language"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <UserCircle size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline truncate max-w-[140px]">{fullName || email}</span>
            </Link>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <I18nProvider initialLang={props.lang}>
      <AppShellInner {...props} />
    </I18nProvider>
  )
}
