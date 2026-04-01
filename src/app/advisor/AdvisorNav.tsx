'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, BarChart2, Monitor } from 'lucide-react'
import Link from 'next/link'

interface Props {
  profile: {
    full_name: string | null
    role: string
    establishments: { name: string; slug: string } | null
    brands: { name: string } | null
  }
}

export function AdvisorNav({ profile }: Props) {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  const displaySlug = profile.establishments?.slug
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-sm">{profile.establishments?.name || profile.brands?.name || 'TurnosApp'}</h1>
          <p className="text-xs text-gray-500">{profile.full_name || 'Agente'}</p>
        </div>
        <div className="flex items-center gap-2">
          {displaySlug && (
            <a
              href={`/display/${displaySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver pantalla TV"
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
            >
              <Monitor size={18} />
            </a>
          )}
          <Link href="/reports" className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100" title="Reportes">
            <BarChart2 size={18} />
          </Link>
          <button onClick={signOut} className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
