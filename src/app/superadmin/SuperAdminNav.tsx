'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Building2, Users, BarChart2, LogOut, Store, MessageSquare, FileText, Tag, UserCheck } from 'lucide-react'

const links = [
  { href: '/superadmin', label: 'Marcas', icon: Building2, exact: true },
  { href: '/superadmin/users', label: 'Usuarios', icon: Users },
  { href: '/admin', label: 'Establecimientos', icon: Store, exact: true },
  { href: '/admin/visit-reasons', label: 'Motivos', icon: MessageSquare },
  { href: '/admin/advisor-fields', label: 'Campos', icon: FileText },
  { href: '/admin/promotions', label: 'Promociones', icon: Tag },
  { href: '/reports', label: 'Reportes', icon: BarChart2 },
  { href: '/advisor', label: 'Cola', icon: UserCheck },
]

export function SuperAdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-indigo-600">SuperAdmin</span>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon, exact }) => (
              <Link key={href} href={href} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', (exact ? pathname === href : pathname.startsWith(href)) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100')}>
                <Icon size={15} />{label}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={signOut} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"><LogOut size={17} /></button>
      </div>
    </header>
  )
}
