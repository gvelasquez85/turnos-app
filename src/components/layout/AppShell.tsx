'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, MessageSquare, FileText, Tag, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight, ChevronDown,
  LogOut, LayoutDashboard, X, Eye, EyeOff,
  CalendarClock, ClipboardList, Monitor, UtensilsCrossed,
  Settings, Shield, UserCircle, CreditCard, Zap, Clock,
} from 'lucide-react'
import { TurnFlowLogo } from '@/components/brand/TurnFlowLogo'
import { useBrandStore } from '@/stores/brandStore'
import { I18nProvider, useT } from '@/lib/i18n/context'
import { SUPPORTED_LANGUAGES, type LangCode } from '@/lib/i18n/translations'

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface NavSection {
  key: string
  section: string
  items: NavItem[]
}

// ─── Item definitions ──────────────────────────────────────────────────────────

const BRAND_ITEMS: NavItem[] = [
  { href: '/admin/brand', label: 'Mi marca', icon: Building2 },
  { href: '/admin', label: 'Sucursales', icon: Store, exact: true },
  { href: '/admin/users', label: 'Equipo', icon: Users },
  { href: '/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
]

const MANAGER_BRAND_ITEMS: NavItem[] = [
  { href: '/admin/brand', label: 'Mi marca', icon: Building2 },
  { href: '/admin', label: 'Sucursales', icon: Store, exact: true },
  { href: '/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
]

const CLIENTES_ITEMS: NavItem[] = [
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/consents', label: 'Autorizaciones', icon: Shield },
]

const QUEUE_ITEMS: NavItem[] = [
  { href: '/admin/queue', label: 'Monitor de colas', icon: Clock },
  { href: '/advisor', label: 'Cola de espera', icon: LayoutDashboard, exact: true },
  { href: '/admin/visit-reasons', label: 'Motivos', icon: MessageSquare },
  { href: '/admin/advisor-fields', label: 'Campos asesor', icon: FileText },
  { href: '/admin/brand/form-config', label: 'Formulario cliente', icon: ClipboardList },
  { href: '/admin/display', label: 'Pantalla TV', icon: Monitor },
]

const APPOINTMENTS_ITEMS: NavItem[] = [
  { href: '/admin/appointments', label: 'Citas', icon: CalendarClock },
]

const SURVEYS_ITEMS: NavItem[] = [
  { href: '/admin/surveys', label: 'Encuestas', icon: ClipboardList },
]

const MENU_ITEMS: NavItem[] = [
  { href: '/admin/menu', label: 'Menú / Preorden', icon: UtensilsCrossed },
]

// ─── Section builder ────────────────────────────────────────────────────────────

function buildSections(
  role: AppRole,
  activeModules?: Record<string, boolean>,
): NavSection[] {
  if (role === 'reporting') {
    return [{ key: 'reportes', section: 'Reportes', items: [{ href: '/reports', label: 'Reportes', icon: BarChart2 }] }]
  }

  if (role === 'advisor') {
    return [{
      key: 'colas',
      section: 'Colas de espera',
      items: [{ href: '/advisor', label: 'Cola de espera', icon: LayoutDashboard, exact: true }],
    }]
  }

  if (role === 'superadmin') {
    return [
      {
        key: 'admin',
        section: 'Administración',
        items: [
          { href: '/superadmin', label: 'Marcas', icon: Building2, exact: true },
          { href: '/superadmin/memberships', label: 'Membresías', icon: CreditCard },
          { href: '/superadmin/users', label: 'Usuarios', icon: Users },
          { href: '/superadmin/marketplace', label: 'Marketplace', icon: Zap },
          { href: '/superadmin/settings', label: 'Configuración', icon: Settings },
        ],
      },
      { key: 'marca', section: 'Mi Marca', items: BRAND_ITEMS },
      { key: 'clientes', section: 'Clientes', items: CLIENTES_ITEMS },
      { key: 'colas', section: 'Colas de espera', items: QUEUE_ITEMS },
      { key: 'citas', section: 'Citas', items: APPOINTMENTS_ITEMS },
      { key: 'encuestas', section: 'Encuestas', items: SURVEYS_ITEMS },
      { key: 'menu_preorden', section: 'Menú / Preorden', items: MENU_ITEMS },
    ]
  }

  // brand_admin / manager
  const brandItems = role === 'brand_admin' ? BRAND_ITEMS : MANAGER_BRAND_ITEMS
  const sections: NavSection[] = [
    { key: 'marca', section: 'Mi Marca', items: brandItems },
    { key: 'clientes', section: 'Clientes', items: CLIENTES_ITEMS },
  ]

  if (activeModules?.queue) {
    sections.push({ key: 'colas', section: 'Colas de espera', items: QUEUE_ITEMS })
  }
  if (activeModules?.appointments) {
    sections.push({ key: 'citas', section: 'Citas', items: APPOINTMENTS_ITEMS })
  }
  if (activeModules?.surveys) {
    sections.push({ key: 'encuestas', section: 'Encuestas', items: SURVEYS_ITEMS })
  }
  if (activeModules?.menu) {
    sections.push({ key: 'menu_preorden', section: 'Menú / Preorden', items: MENU_ITEMS })
  }

  sections.push({ key: 'marketplace', section: 'Más', items: [{ href: '/admin/marketplace', label: 'Marketplace', icon: Zap }] })
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
          'flex items-center h-14 px-3 border-b border-gray-100 shrink-0',
          isCollapsed ? 'justify-center' : 'justify-between',
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <TurnFlowLogo size={28} />
              <span className="font-bold text-gray-900 tracking-tight">TurnFlow</span>
            </div>
          )}
          {isCollapsed && <TurnFlowLogo size={26} />}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 hidden md:flex items-center justify-center shrink-0"
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 md:hidden shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Brand selector (superadmin only) */}
        {role === 'superadmin' && brands.length > 0 && !isCollapsed && (
          <div className="px-3 pt-2 pb-1 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Marca</p>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
            >
              <option value="">— Todas las marcas —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        {role === 'superadmin' && brands.length > 0 && isCollapsed && (
          <div className="flex justify-center py-2 border-b border-gray-100">
            <Building2 size={16} className="text-gray-400" aria-label={brands.find(b => b.id === selectedBrandId)?.name} />
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                      {section.section}
                    </span>
                    <ChevronDown
                      size={12}
                      className={cn(
                        'text-gray-300 group-hover:text-gray-500 transition-all',
                        isSectionCollapsed ? '-rotate-90' : 'rotate-0',
                      )}
                    />
                  </button>
                ) : (
                  si > 0 && <div className="h-px bg-gray-100 mx-2 my-2" />
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
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors',
                            isCollapsed && 'justify-center',
                            active
                              ? 'bg-indigo-50 text-indigo-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                          )}
                        >
                          <Icon size={17} className="shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 p-2">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            title={isCollapsed ? 'Mi perfil' : undefined}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors mb-1 w-full text-left',
              isCollapsed && 'justify-center',
            )}
          >
            <UserCircle size={18} className="text-gray-400 shrink-0" />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fullName || email}</p>
                {subtitle
                  ? <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                  : <p className="text-xs text-gray-400">{roleLabel[role]}</p>
                }
              </div>
            )}
          </Link>
          {/* Pantalla TV (advisor with establishment) */}
          {activeRole === 'advisor' && establishmentSlug && (
            <a
              href={`/display/${establishmentSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={isCollapsed ? 'Pantalla TV' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 w-full transition-colors mb-1',
                isCollapsed && 'justify-center',
              )}
            >
              <Monitor size={15} />
              {!isCollapsed && <span>Pantalla TV</span>}
            </a>
          )}
          {/* Botón ver como agente */}
          {CAN_IMPERSONATE.includes(role) && !viewAs && (
            <button
              onClick={startImpersonate}
              title={isCollapsed ? 'Ver como agente' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-indigo-500 hover:bg-indigo-50 w-full transition-colors mb-1',
                isCollapsed && 'justify-center',
              )}
            >
              <Eye size={15} />
              {!isCollapsed && <span>Ver como agente</span>}
            </button>
          )}
          {/* Salir de vista asesor */}
          {viewAs && (
            <button
              onClick={stopImpersonate}
              title={isCollapsed ? 'Salir de vista asesor' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-amber-600 hover:bg-amber-50 w-full transition-colors mb-1',
                isCollapsed && 'justify-center',
              )}
            >
              <Eye size={15} />
              {!isCollapsed && <span>Salir de vista asesor</span>}
            </button>
          )}
          {/* Language selector */}
          {!isCollapsed && (
            <div className="px-2 py-1">
              <select
                value={lang}
                onChange={e => setLang(e.target.value as LangCode)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500 focus:border-indigo-400 focus:outline-none cursor-pointer"
                title="Idioma / Language"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors',
              isCollapsed && 'justify-center',
            )}
          >
            <LogOut size={15} />
            {!isCollapsed && <span>{t('action.signOut')}</span>}
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex-col z-30 transition-all duration-200 hidden md:flex',
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
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex-col z-30 transition-transform duration-200 w-64 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent mobile />
      </aside>

      {/* Main content */}
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-200',
        collapsed ? 'md:ml-16' : 'md:ml-56',
      )}>
        {/* Mobile topbar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3 md:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Menu size={20} />
          </button>
          <TurnFlowLogo size={24} />
          <span className="font-bold text-gray-900 text-sm">TurnFlow</span>
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
