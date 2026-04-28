import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NoBrandContext } from '@/components/NoBrandContext'
import { NuevaVentaForm } from './NuevaVentaForm'

export default async function NuevaVentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, brand_id').eq('id', user.id).single()

  if (!profile || !['brand_admin', 'manager', 'superadmin'].includes(profile.role ?? ''))
    redirect('/admin')

  if (!profile.brand_id) return <NoBrandContext />

  const brandId = profile.brand_id as string

  const [productsRes, customersRes, estRes] = await Promise.allSettled([
    supabase.from('products').select('id, name, sku, price, unit, stock').eq('brand_id', brandId).eq('active', true).order('name'),
    supabase.from('customers').select('id, name, phone').eq('brand_id', brandId).order('name').limit(500),
    supabase.from('establishments').select('id, name').eq('brand_id', brandId).eq('active', true).order('name'),
  ])

  const products = productsRes.status === 'fulfilled' ? (productsRes.value.data ?? []) : []
  const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data ?? []) : []
  const establishments = estRes.status === 'fulfilled' ? (estRes.value.data ?? []) : []

  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}>
      <NuevaVentaForm
        brandId={brandId}
        userId={user.id}
        products={products as any[]}
        customers={customers as any[]}
        establishments={establishments as any[]}
      />
    </Suspense>
  )
}
