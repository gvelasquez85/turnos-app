import { createClient } from '@supabase/supabase-js'
import PQRSPublicForm from './PQRSPublicForm'
import { notFound } from 'next/navigation'

export default async function PQRSPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: config } = await supabase
    .from('pqrs_configs')
    .select('brand_id, form_title, form_description, categories, form_enabled, logo_url, primary_color')
    .eq('form_slug', slug)
    .single()

  if (!config || !config.form_enabled) notFound()

  const { data: brand } = await supabase
    .from('brands')
    .select('name, logo_url')
    .eq('id', config.brand_id)
    .single()

  return (
    <PQRSPublicForm
      slug={slug}
      brandName={brand?.name || ''}
      brandLogo={config.logo_url || brand?.logo_url || ''}
      formTitle={config.form_title}
      formDescription={config.form_description}
      categories={config.categories || []}
      primaryColor={config.primary_color || '#059669'}
    />
  )
}
