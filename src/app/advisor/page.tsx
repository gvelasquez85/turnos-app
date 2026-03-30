import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QueueBoard } from './QueueBoard'

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, establishments(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.establishment_id) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-lg font-medium">Sin establecimiento asignado</p>
        <p className="text-sm mt-1">Contacta al administrador para asignarte un establecimiento.</p>
      </div>
    )
  }

  // Cargar campos personalizados del asesor
  const { data: advisorFields } = await supabase
    .from('advisor_fields')
    .select('*')
    .eq('establishment_id', profile.establishment_id)
    .eq('active', true)
    .order('sort_order')

  return (
    <QueueBoard
      establishmentId={profile.establishment_id}
      advisorId={user.id}
      advisorFields={advisorFields || []}
    />
  )
}
