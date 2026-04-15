import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DisplayScreen } from './DisplayScreen'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return {
    title: 'TurnFlow – Pantalla TV',
    description: 'Pantalla de cola de espera',
    manifest: '/display-manifest.json',
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'black-translucent',
      'apple-mobile-web-app-title': 'TurnFlow TV',
      'mobile-web-app-capable': 'yes',
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
    },
  }
}

export default async function DisplayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Query establishment separately from display_configs to avoid 404 if table doesn't exist yet
  const { data: est } = await supabase
    .from('establishments')
    .select('id, name, slug, brands(name, logo_url)')
    .eq('slug', slug)
    .single()

  if (!est) notFound()

  // Fetch config separately — graceful if table missing or no row
  const { data: configRow } = await supabase
    .from('display_configs')
    .select('*')
    .eq('establishment_id', est.id)
    .maybeSingle()

  return (
    <DisplayScreen
      establishment={est as any}
      config={configRow ?? null}
    />
  )
}
