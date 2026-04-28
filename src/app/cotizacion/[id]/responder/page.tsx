import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function ResponderQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ action?: string }>
}) {
  const { id } = await params
  const { action } = await searchParams

  if (!id || !['accept', 'reject'].includes(action ?? '')) {
    redirect(`/cotizacion/${id}`)
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const newStatus = action === 'accept' ? 'accepted' : 'rejected'

  await service
    .from('sales')
    .update({ status: newStatus })
    .eq('id', id)
    .eq('type', 'quote')
    // Only allow transition from sent/draft
    .in('status', ['sent', 'draft'])

  redirect(`/cotizacion/${id}`)
}
