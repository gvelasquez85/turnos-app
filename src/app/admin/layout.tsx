import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNav } from './AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(name, slug)')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'superadmin'].includes(profile.role)) redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNav profile={profile as any} />
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
