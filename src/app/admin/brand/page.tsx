import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandSettings } from './BrandSettings'

export default async function BrandSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, brands(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.brand_id) redirect('/admin')

  const brand = profile.brands as any

  const { data: membership } = await supabase
    .from('memberships')
    .select('*')
    .eq('brand_id', profile.brand_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <BrandSettings
      brand={brand}
      membership={membership || null}
    />
  )
}
