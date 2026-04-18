'use client'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, Mail } from 'lucide-react'

interface Props {
  children: React.ReactNode
  /** Si true se muestra el popup bloqueante */
  isExpired: boolean
  /** Nombre legible del módulo, e.g. "Pantalla TV" */
  moduleLabel: string
  /** Fecha ISO en que venció el trial/suscripción */
  expiredAt?: string | null
}

/**
 * Envuelve el contenido de un módulo y, si el trial/suscripción venció,
 * muestra un overlay que bloquea toda interacción hasta que se suscriba.
 */
export function TrialExpiredGate({ children, isExpired, moduleLabel, expiredAt }: Props) {
  const router = useRouter()

  return (
    <div className="relative">
      {/* Contenido del módulo (renderizado pero bloqueado) */}
      <div className={isExpired ? 'pointer-events-none select-none blur-[2px] opacity-40' : undefined}>
        {children}
      </div>

      {/* Overlay bloqueante */}
      {isExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">
            {/* Cabecera roja */}
            <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-6">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Lock size={26} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Módulo bloqueado</h2>
              <p className="text-red-100 text-sm mt-1">El periodo de prueba ha terminado</p>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm mb-1">
                El módulo <span className="font-semibold text-gray-900">{moduleLabel}</span> está inactivo.
              </p>
              {expiredAt && (
                <p className="text-xs text-gray-400 mb-4">
                  Venció el{' '}
                  {new Date(expiredAt).toLocaleDateString('es', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-5">
                Suscríbete para volver a acceder a todas las funciones de este módulo.
              </p>

              <button
                onClick={() => router.push('/admin/brand?tab=membership')}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors mb-2 text-sm"
              >
                Ver membresía y módulos
                <ArrowRight size={15} />
              </button>

              <button
                onClick={() => window.open('mailto:soporte@turnflow.co?subject=Renovación%20de%20módulo', '_blank')}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-xs py-2 transition-colors"
              >
                <Mail size={12} />
                Contactar soporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
