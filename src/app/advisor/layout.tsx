import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdvisorNav } from './AdvisorNav'

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, establishments(name, slug), brands(name)')
    .eq('id', user.id)
    .single()

  if (!profile || !['advisor', 'brand_admin', 'superadmin'].includes(profile.role)) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdvisorNav profile={profile as any} />
      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
