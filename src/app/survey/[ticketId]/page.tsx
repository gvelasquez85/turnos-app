import { createClient } from '@/lib/supabase/server'
import { SurveyForm } from './SurveyForm'

export default async function SurveyPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params
  const supabase = await createClient()

  // Fetch ticket with establishment
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, establishments(id, name, brand_id, brands(name))')
    .eq('id', ticketId)
    .single()

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-500">Turno no encontrado</p>
        </div>
      </div>
    )
  }

  const est = (ticket.establishments as any)
  const brandId = est?.brand_id

  // Fetch active survey template for this brand
  const { data: template } = await supabase
    .from('survey_templates')
    .select('*')
    .eq('brand_id', brandId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <SurveyForm
      ticket={{ id: ticket.id, queue_number: ticket.queue_number, customer_name: ticket.customer_name }}
      establishment={{ id: est?.id, name: est?.name, brand_name: est?.brands?.name }}
      template={template || null}
    />
  )
}
