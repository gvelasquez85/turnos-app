import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SuperAdminNav } from './SuperAdminNav'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SuperAdminNav />
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  )
}
