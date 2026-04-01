import { createClient } from '@/lib/supabase/server'
import { SurveyForm } from '../[ticketId]/SurveyForm'

export default async function SurveyPreviewPage({ searchParams }: { searchParams: Promise<{ templateId?: string }> }) {
  const { templateId } = await searchParams
  const supabase = await createClient()

  if (!templateId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">templateId requerido</p>
      </div>
    )
  }

  const { data: template } = await supabase
    .from('survey_templates')
    .select('*, brands(name, primary_color)')
    .eq('id', templateId)
    .single()

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Plantilla no encontrada</p>
      </div>
    )
  }

  const brand = template.brands as any

  return (
    <div className="relative">
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-center py-2 text-sm font-medium">
        Vista previa — no se guardarán respuestas
      </div>
      <div className="pt-10">
        <SurveyForm
          ticket={{ id: 'preview', queue_number: '000', customer_name: 'Cliente de prueba' }}
          establishment={{ id: 'preview', name: 'Sucursal', brand_name: brand?.name ?? '', primary_color: brand?.primary_color }}
          template={{ id: template.id, name: template.name, questions: template.questions || [] }}
          preview
        />
      </div>
    </div>
  )
}
