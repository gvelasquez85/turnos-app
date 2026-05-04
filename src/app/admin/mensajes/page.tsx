import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEffectiveBrandId } from '@/lib/serverBrandContext'
import { NoBrandContext } from '@/components/NoBrandContext'
import { TrialExpiredGate } from '@/components/TrialExpiredGate'
import { WaTemplatesManager } from './WaTemplatesManager'
import { WA_TEMPLATE_DEFS, type WaCategory } from '@/lib/waTemplates'

export default async function MensajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  const brandId = await getEffectiveBrandId(profile.brand_id, profile.role ?? '')
  if (!brandId) return <NoBrandContext />

  // Check module subscription (superadmin always has access)
  let isExpired = false
  let expiredAt: string | null = null
  if (profile.role !== 'superadmin') {
    const { data: sub } = await supabase
      .from('module_subscriptions')
      .select('status, trial_expires_at, expires_at')
      .eq('brand_id', brandId)
      .eq('module_key', 'mensajes')
      .maybeSingle()

    if (!sub || sub.status === 'expired') {
      isExpired = true
      expiredAt = sub?.trial_expires_at ?? sub?.expires_at ?? null
    }
  }

  // Load brand's customized templates
  const { data: brandTemplates } = await supabase
    .from('wa_templates')
    .select('*')
    .eq('brand_id', brandId)

  // Load global defaults
  const { data: defaults } = await supabase
    .from('wa_default_templates')
    .select('*')

  // Merge: brand overrides take precedence over defaults
  const defaultMap = Object.fromEntries((defaults ?? []).map((d: any) => [d.category, d]))
  const brandMap   = Object.fromEntries((brandTemplates ?? []).map((t: any) => [t.category, t]))

  const templates = WA_TEMPLATE_DEFS.map(def => ({
    ...def,
    brandTemplate: brandMap[def.category] ?? null,
    defaultBody: defaultMap[def.category]?.body ?? def.defaultBody,
  }))

  return (
    <TrialExpiredGate isExpired={isExpired} moduleLabel="Mensajes WhatsApp" expiredAt={expiredAt}>
      <WaTemplatesManager
        brandId={brandId}
        templates={templates}
      />
    </TrialExpiredGate>
  )
}
