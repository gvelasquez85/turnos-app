'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, MessageSquare, FileText, Tag, BarChart2,
  Users, Store, Menu, ChevronLeft, ChevronRight,
  LogOut, LayoutDashboard, X, MonitorPlay, Eye, EyeOff,
  CalendarClock, ClipboardList, Monitor, UtensilsCrossed,
  Settings, Shield, UserCircle, ShoppingBag,
} from 'lucide-react'
import { TurnAppLogo } from '@/components/brand/TurnAppLogo'
import { useBrandStore } from '@/stores/brandStore'

export type AppRole = 'superadmin' | 'brand_admin' | 'manager' | 'advisor' | 'reporting'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

interface NavSection {
  section?: string
  items: NavItem[]
}

const CONFIG_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Establecimientos', icon: Store, exact: true },
  { href: '/admin/visit-reasons', label: 'Motivos', icon: MessageSquare },
  { href: '/admin/advisor-fields', label: 'Campos asesor', icon: FileText },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
]

const navByRole: Record<AppRole, NavSection[]> = {
  superadmin: [
    {
      section: 'Administración',
      items: [
        { href: '/superadmin', label: 'Marcas', icon: Building2, exact: true },
        { href: '/superadmin/users', label: 'Usuarios', icon: Users },
        { href: '/superadmin/settings', label: 'Configuración', icon: Settings },
      ],
    },
    {
      section: 'Configuración',
      items: CONFIG_ITEMS,
    },
    {
      section: 'Operación',
      items: [
        { href: '/admin/queue', label: 'Monitor de colas', icon: MonitorPlay },
        { href: '/admin/appointments', label: 'Citas', icon: CalendarClock },
        { href: '/admin/surveys', label: 'Encuestas', icon: ClipboardList },
        { href: '/admin/display', label: 'Pantalla sala', icon: Monitor },
        { href: '/admin/menu', label: 'Menú / Preorden', icon: UtensilsCrossed },
        { href: '/admin/consents', label: 'Autorizaciones', icon: Shield },
        { href: '/advisor', label: 'Cola de espera', icon: LayoutDashboard, exact: true },
        { href: '/reports', label: 'Reportes', icon: BarChart2 },
      ],
    },
  ],
  brand_admin: [
    {
      section: 'Marca',
      items: [
        { href: '/admin/brand', label: 'Mi marca', icon: Building2 },
      ],
    },
    {
      section: 'Usuarios',
      items: [
        { href: '/admin/users', label: 'Equipo', icon: Users },
      ],
    },
    {
      section: 'Configuración',
      items: CONFIG_ITEMS,
    },
    {
      section: 'Operación',
      items: [
        { href: '/admin/queue', label: 'Monitor de colas', icon: MonitorPlay },
        { href: '/admin/appointments', label: 'Citas', icon: CalendarClock },
        { href: '/admin/surveys', label: 'Encuestas', icon: ClipboardList },
        { href: '/admin/display', label: 'Pantalla sala', icon: Monitor },
        { href: '/admin/menu', label: 'Menú / Preorden', icon: UtensilsCrossed },
        { href: '/admin/consents', label: 'Autorizaciones', icon: Shield },
        { href: '/reports', label: 'Reportes', icon: BarChart2 },
      ],
    },
  ],
  manager: [
    {
      section: 'Marca',
      items: [
        { href: '/admin/brand', label: 'Mi marca', icon: Building2 },
      ],
    },
    {
      section: 'Configuración',
      items: CONFIG_ITEMS,
    },
    {
      section: 'Operación',
      items: [
        { href: '/admin/queue', label: 'Monitor de colas', icon: MonitorPlay },
        { href: '/admin/appointments', label: 'Citas', icon: CalendarClock },
        { href: '/admin/surveys', label: 'Encuestas', icon: ClipboardList },
        { href: '/admin/display', label: 'Pantalla sala', icon: Monitor },
        { href: '/admin/menu', label: 'Menú / Preorden', icon: UtensilsCrossed },
        { href: '/admin/consents', label: 'Autorizaciones', icon: Shield },
        { href: '/reports', label: 'Reportes', icon: BarChart2 },
      ],
    },
  ],
  advisor: [
    {
      items: [
        { href: '/advisor', label: 'Cola de espera', icon: LayoutDashboard, exact: true },
        { href: '/reports', label: 'Reportes', icon: BarChart2 },
      ],
    },
  ],
  reporting: [
    {
      items: [
        { href: '/reports', label: 'Reportes', icon: BarChart2 },
      ],
    },
  ],
}

const roleLabel: Record<AppRole, string> = {
  superadmin: 'Super Admin',
  brand_admin: 'Admin',
  manager: 'Manager',
  advisor: 'Asesor',
  reporting: 'Reportes',
}

export interface AppShellProps {
  children: React.ReactNode
  role: AppRole
  fullName?: string | null
  email: string
  brandName?: string | null
  establishmentName?: string | null
  brands?: { id: string; name: string }[]
  activeModules?: Record<string, boolean>
}

const CAN_IMPERSONATE: AppRole[] = ['superadmin', 'brand_admin']

export function AppShell({ children, role, fullName, email, brandName, establishmentName, brands: initialBrands, activeModules }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [viewAs, setViewAs] = useState<AppRole | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { selectedBrandId, setSelectedBrandId } = useBrandStore()
  const [brands, setBrands] = useState<{ id: string; name: string }[]>(initialBrands || [])

  useEffect(() => {
    if (role === 'superadmin' && (!initialBrands || initialBrands.length === 0)) {
      createClient().from('brands').select('id, name').order('name').then(({ data }) => {
        if (data) setBrands(data)
      })
    }
  }, [role]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (brands.length > 0 && !selectedBrandId) {
      setSelectedBrandId(brands[0].id)
    }
  }, [brands, selectedBrandId, setSelectedBrandId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) setCollapsed(saved === 'true')
    } catch {}
    // Leer cookie de impersonación
    try {
      const m = document.cookie.match(/ta_view_as=([^;]+)/)
      if (m) setViewAs(m[1] as AppRole)
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  function isModuleAllowed(href: string): boolean {
    if (!activeModules) return true // if not provided, show all
    if (href.startsWith('/admin/appointments') && !activeModules.appointments) return false
    if (href.startsWith('/admin/surveys') && !activeModules.surveys) return false
    if (href.startsWith('/admin/menu') && !activeModules.menu) return false
    // display config is always visible (it's an admin tool, not a customer-facing module)
    return true
  }

  const activeRole = viewAs || role
  const sections = navByRole[activeRole]
  const subtitle = brandName
    ? establishmentName ? `${brandName} · ${establishmentName}` : brandName
    : null

  function SidebarContent() {
    return (
      <>
        {/* Header */}
        <div className={cn(
          'flex items-center h-14 px-3 border-b border-gray-100 shrink-0',
          collapsed ? 'justify-center' : 'justify-between',
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <TurnAppLogo size={28} />
              <span className="font-bold text-gray-900 tracking-tight">TurnApp</span>
            </div>
          )}
          {collapsed && <TurnAppLogo size={26} />}
          {/* Desktop toggle */}
          <button
            onClick={toggleCollapsed}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 hidden md:flex items-center justify-center shrink-0"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 md:hidden shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Brand selector (superadmin only) */}
        {role === 'superadmin' && brands.length > 0 && !collapsed && (
          <div className="px-3 pt-2 pb-1 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Marca</p>
            <select
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
            >
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        {role === 'superadmin' && brands.length > 0 && collapsed && (
          <div className="flex justify-center py-2 border-b border-gray-100">
            <Building2 size={16} className="text-gray-400" aria-label={brands.find(b => b.id === selectedBrandId)?.name} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {sections.map((section, si) => (
            <div key={si} className={cn('flex flex-col gap-0.5', si > 0 && 'mt-4')}>
              {!collapsed && section.section && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                  {section.section}
                </p>
              )}
              {collapsed && si > 0 && <div className="h-px bg-gray-100 mx-2 my-2" />}
              {section.items.filter(item => isModuleAllowed(item.href)).map(item => {
                const active = isActive(item.href, item.exact)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors',
                      collapsed && 'justify-center',
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 p-2">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            title={collapsed ? 'Mi perfil' : undefined}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors mb-1 w-full text-left',
              collapsed && 'justify-center',
            )}
          >
            <UserCircle size={18} className="text-gray-400 shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fullName || email}</p>
                {subtitle
                  ? <p className="text-xs text-gray-400 truncate">{subtitle}</p>
                  : <p className="text-xs text-gray-400">{roleLabel[role]}</p>
                }
              </div>
            )}
          </Link>
          {/* Botón ver como asesor */}
          {CAN_IMPERSONATE.includes(role) && !viewAs && (
            <button
              onClick={startImpersonate}
              title={collapsed ? 'Ver como asesor' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-indigo-500 hover:bg-indigo-50 w-full transition-colors mb-1',
                collapsed && 'justify-center',
              )}
            >
              <Eye size={15} />
              {!collapsed && <span>Ver como asesor</span>}
            </button>
          )}
          {/* Salir de vista asesor */}
          {viewAs && (
            <button
              onClick={stopImpersonate}
              title={collapsed ? 'Salir de vista asesor' : undefined}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-amber-600 hover:bg-amber-50 w-full transition-colors mb-1',
                collapsed && 'justify-center',
              )}
            >
              <EyeOff size={15} />
              {!collapsed && <span>Salir de vista asesor</span>}
            </button>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors',
              collapsed && 'justify-center',
            )}
          >
            <LogOut size={15} />
            {!collapsed && <span>Cerrar sesión</span>}
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

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-30 transition-transform duration-200 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-13 bg-white border-b border-gray-200 flex items-center px-4 z-10 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu size={20} />
        </button>
        <TurnAppLogo size={26} />
        <span className="font-bold text-gray-900 tracking-tight">TurnApp</span>
      </div>

      {/* Main content */}
      <main className={cn(
        'flex-1 transition-all duration-200 min-h-screen',
        collapsed ? 'md:ml-16' : 'md:ml-56',
        'pt-13 md:pt-0',
      )}>
        {/* Banner de impersonación */}
        {viewAs && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">Vista como Asesor</span>
              <span className="text-xs text-amber-600">— estás viendo la experiencia del asesor. Tu rol real no ha cambiado.</span>
            </div>
            <button
              onClick={stopImpersonate}
              className="text-xs text-amber-700 underline hover:text-amber-900 font-medium"
            >
              Volver a mi vista
            </button>
          </div>
        )}
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
