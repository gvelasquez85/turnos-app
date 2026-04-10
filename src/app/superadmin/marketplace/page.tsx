import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarketplaceManager } from './MarketplaceManager'

export default async function SuperadminMarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/admin')

  const { data: modules, error } = await supabase
    .from('marketplace_modules')
    .select('*')
    .order('sort_order')

  // Table doesn't exist yet — show setup instructions
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🗄️</div>
          <h2 className="text-xl font-bold text-amber-900 mb-2">Falta ejecutar la migración SQL</h2>
          <p className="text-amber-800 text-sm mb-6">
            La tabla <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">marketplace_modules</code> no existe todavía.
            Ejecuta el siguiente script en el <strong>SQL Editor de Supabase</strong>:
          </p>
          <div className="bg-white rounded-xl border border-amber-200 p-4 text-left mb-6">
            <p className="text-xs font-mono text-gray-600 font-bold mb-2">Archivo: supabase/phase13_new_pricing.sql</p>
            <p className="text-xs text-gray-500">
              1. Ve a tu proyecto en <strong>supabase.com</strong><br />
              2. Abre <strong>SQL Editor</strong><br />
              3. Pega el contenido del archivo <code>phase13_new_pricing.sql</code><br />
              4. Ejecuta y recarga esta página
            </p>
          </div>
          <p className="text-xs text-amber-700 mb-2">
            Error: <code className="font-mono">{error.message}</code>
          </p>
          <a
            href="/superadmin/marketplace"
            className="inline-block mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
          >
            Recargar página
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <MarketplaceManager modules={modules || []} />
    </div>
  )
}
