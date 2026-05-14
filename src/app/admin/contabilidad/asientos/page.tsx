import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import AsientosManager from './AsientosManager'

export default async function AsientosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  // Load entries for current and previous month
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_date, description, status, source_type, created_at')
    .eq('brand_id', brandId)
    .order('entry_date', { ascending: false })
    .limit(100)

  // Load leaf accounts for form
  const { data: accounts } = await supabase
    .from('accounts')
    .select('code, name, nature, class')
    .eq('brand_id', brandId)
    .eq('allows_movement', true)
    .eq('is_active', true)
    .order('code')

  // Load open periods
  const { data: periods } = await supabase
    .from('accounting_periods')
    .select('id, year, month, status')
    .eq('brand_id', brandId)
    .eq('status', 'open')
    .order('year', { ascending: false })

  return (
    <AsientosManager
      brandId={brandId}
      entries={entries ?? []}
      accounts={accounts ?? []}
      periods={periods ?? []}
    />
  )
}
