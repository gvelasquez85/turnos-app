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

  const { data: modules } = await supabase
    .from('marketplace_modules')
    .select('*')
    .order('sort_order')

  return (
    <div>
      <MarketplaceManager modules={modules || []} />
    </div>
  )
}
