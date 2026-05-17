import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { getVerifiedActiveModules } from '@/lib/serverBrandContext'
import { AICopilot } from '@/components/ai/AICopilot'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let profile: any = null
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, brands(name, active_modules), establishments(name, slug)')
      .eq('id', user.id)
      .single()
    if (!error && data) {
      profile = data
    } else {
      // Fallback si el join de brands falla (columna faltante, RLS, etc.)
      const { data: fallback } = await supabase
        .from('profiles')
        .select('*, establishments(name, slug)')
        .eq('id', user.id)
        .single()
      profile = fallback
    }
  }

  if (!profile || !['brand_admin', 'manager', 'superadmin', 'advisor'].includes(profile.role)) redirect('/')

  // Redirect brand_admin / manager to onboarding if brand not set up
  if (['brand_admin', 'manager'].includes(profile.role)) {
    if (!(profile as any).brand_id) {
      // No brand at all → must go through onboarding to create one
      redirect('/onboarding')
    }
    const { data: brandCheck } = await supabase
      .from('brands')
      .select('onboarding_completed')
      .eq('id', (profile as any).brand_id)
      .single()
    if (!brandCheck || brandCheck.onboarding_completed !== true) {
      redirect('/onboarding')
    }
  }

  const brandId = (profile as any).brand_id

  let plan = 'free'
  if (brandId) {
    const { data: mem } = await supabase
      .from('memberships')
      .select('plan')
      .eq('brand_id', brandId)
      .single()
    if (mem?.plan) plan = mem.plan
  }

  // AI Copilot: load usage for today to show badge on initial render
  let copilotUsage = null
  if (brandId) {
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: aiCfg }, { data: aiUse }] = await Promise.all([
      supabase.from('ai_configs').select('plan, daily_limit').eq('brand_id', brandId).maybeSingle(),
      supabase.from('ai_usage').select('query_count').eq('brand_id', brandId).eq('usage_date', today).maybeSingle(),
    ])
    const aiPlan = aiCfg?.plan ?? 'free'
    const aiLimit = aiCfg?.daily_limit ?? 5
    const aiUsed = aiUse?.query_count ?? 0
    copilotUsage = { plan: aiPlan, limit: aiLimit, used: aiUsed, remaining: Math.max(0, aiLimit - aiUsed) }
  }

  const activeModules = await getVerifiedActiveModules(
    supabase,
    brandId,
    (profile.brands as any)?.active_modules ?? null,
  )

  return (
    <AppShell
      role={profile.role as 'superadmin' | 'brand_admin' | 'manager' | 'advisor'}
      fullName={profile.full_name}
      email={profile.email}
      brandName={(profile.brands as any)?.name ?? null}
      establishmentName={(profile.establishments as any)?.name ?? null}
      establishmentSlug={(profile.establishments as any)?.slug ?? null}
      activeModules={activeModules}
      plan={plan}
    >
      {children}
      <AICopilot initialUsage={copilotUsage} />
    </AppShell>
  )
}
