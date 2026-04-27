import Link from 'next/link'
import { Building2 } from 'lucide-react'

/**
 * Shown to superadmins who navigate to brand-specific pages
 * without having a brand_id on their profile.
 */
export function NoBrandContext() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Building2 size={28} className="text-indigo-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Sin contexto de marca</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Esta sección muestra datos de una marca específica. Ve al panel de superadmin y trabaja desde el contexto de una marca.
      </p>
      <Link
        href="/superadmin"
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        Ir al panel de superadmin
      </Link>
    </div>
  )
}
