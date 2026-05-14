import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import AccountingConfig from './AccountingConfig'

export default async function ConfigPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role)
  if (!brandId) redirect('/admin')

  const { data: settings } = await supabase
    .from('accounting_settings')
    .select('*')
    .eq('brand_id', brandId)
    .maybeSingle()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('code, name')
    .eq('brand_id', brandId)
    .eq('allows_movement', true)
    .eq('is_active', true)
    .order('code')

  const { data: periods } = await supabase
    .from('accounting_periods')
    .select('id, year, month, status')
    .eq('brand_id', brandId)
    .order('year', { ascending: false })
    .limit(24)

  return (
    <AccountingConfig
      brandId={brandId}
      settings={settings}
      accounts={accounts ?? []}
      periods={periods ?? []}
    />
  )
}
