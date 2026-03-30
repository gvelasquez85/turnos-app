import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 mb-4">
          <AlertTriangle size={28} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Configuración pendiente</h1>
        <p className="text-gray-500 text-sm mb-6">
          El schema de la base de datos no está aplicado todavía. Sigue estos pasos:
        </p>
        <ol className="text-left text-sm text-gray-700 space-y-3 mb-6">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">1</span>
            <span>Ve a <strong>supabase.com</strong> → tu proyecto → <strong>SQL Editor</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">2</span>
            <span>Abre el archivo <code className="bg-gray-100 px-1 rounded">supabase/schema.sql</code> del proyecto y pega su contenido</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">3</span>
            <span>Ejecuta el query y luego corre:</span>
          </li>
        </ol>
        <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 text-left mb-6 overflow-x-auto">
{`UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = '${user.email}';

-- Esto se corre DESPUÉS del schema:
UPDATE public.profiles
SET role = 'superadmin'
WHERE email = '${user.email}';`}
        </pre>
        <a
          href="/"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Ya apliqué el schema → continuar
        </a>
      </div>
    </div>
  )
}
