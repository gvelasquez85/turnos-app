'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Store, MessageSquare, FileText, Tag, BarChart2, LogOut, Building2, Users, UserCheck } from 'lucide-react'

const adminLinks = [
  { href: '/admin', label: 'Sucursales', icon: Store, exact: true },
  { href: '/admin/visit-reasons', label: 'Motivos', icon: MessageSquare },
  { href: '/admin/advisor-fields', label: 'Campos', icon: FileText },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
  { href: '/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/advisor', label: 'Cola', icon: UserCheck },
]

const superadminLinks = [
  { href: '/superadmin', label: 'Marcas', icon: Building2, exact: true },
  { href: '/superadmin/users', label: 'Usuarios', icon: Users },
  ...adminLinks,
]

export function AdminNav({ profile, role }: { profile: { full_name: string | null; brands: { name: string } | null }; role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isSuperAdmin = role === 'superadmin'
  const links = isSuperAdmin ? superadminLinks : adminLinks
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div>
              {isSuperAdmin ? (
                <span className="font-bold text-indigo-600 text-sm">SuperAdmin</span>
              ) : (
                <>
                  <span className="font-bold text-indigo-600 text-sm">Admin</span>
                  <span className="text-gray-400 text-sm mx-1">·</span>
                  <span className="text-gray-700 text-sm">{profile.brands?.name}</span>
                </>
              )}
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {links.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    (exact ? pathname === href : pathname.startsWith(href))
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <button onClick={signOut} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100">
            <LogOut size={17} />
          </button>
        </div>
        {/* Mobile nav */}
        <div className="flex md:hidden overflow-x-auto gap-1 pb-2">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap',
                (exact ? pathname === href : pathname.startsWith(href))
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
