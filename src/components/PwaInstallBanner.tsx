'use client'
import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

type Platform = 'ios-safari' | 'android-chrome' | 'desktop-chrome' | 'desktop-edge' | 'desktop-firefox' | 'other'

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isFirefox = /Firefox/.test(ua)
  const isSafari = /Safari/.test(ua) && !isChrome && !isEdge

  if (isIOS && isSafari) return 'ios-safari'
  if (isIOS) return 'ios-safari' // Chrome on iOS still uses Safari engine
  if (isAndroid && isChrome) return 'android-chrome'
  if (isChrome) return 'desktop-chrome'
  if (isEdge) return 'desktop-edge'
  if (isFirefox) return 'desktop-firefox'
  return 'other'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

const INSTRUCTIONS: Record<Platform, { title: string; steps: string[] }> = {
  'ios-safari': {
    title: 'Instalar en iPhone / iPad',
    steps: [
      'Toca el botón de compartir (📤) en la barra inferior de Safari',
      'Desplázate hacia abajo y selecciona "Agregar a pantalla de inicio"',
      'Toca "Agregar" en la esquina superior derecha',
    ],
  },
  'android-chrome': {
    title: 'Instalar en Android',
    steps: [
      'Toca el menú (⋮) en la esquina superior derecha de Chrome',
      'Selecciona "Agregar a pantalla de inicio" o "Instalar app"',
      'Confirma tocando "Instalar"',
    ],
  },
  'desktop-chrome': {
    title: 'Instalar en Chrome',
    steps: [
      'Haz clic en el ícono de instalación (⊕) en la barra de direcciones',
      'O ve a Menú (⋮) → "Instalar TurnFlow..."',
      'Confirma haciendo clic en "Instalar"',
    ],
  },
  'desktop-edge': {
    title: 'Instalar en Edge',
    steps: [
      'Haz clic en el ícono de instalación en la barra de direcciones',
      'O ve a Menú (…) → "Aplicaciones" → "Instalar TurnFlow"',
      'Confirma haciendo clic en "Instalar"',
    ],
  },
  'desktop-firefox': {
    title: 'Acceso rápido en Firefox',
    steps: [
      'Firefox no soporta instalación de PWA directamente',
      'Puedes agregar un marcador: Ctrl+D (o ⌘+D en Mac)',
      'Para mejor experiencia, usa Chrome o Edge',
    ],
  },
  other: {
    title: 'Instalar TurnFlow',
    steps: [
      'Busca la opción "Agregar a pantalla de inicio" o "Instalar" en el menú de tu navegador',
      'Esto creará un acceso directo como una app nativa',
    ],
  },
}

const DISMISS_KEY = 'turnflow-pwa-banner-dismissed'

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone()) return
    // Don't show if user dismissed
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
    } catch {}
    setPlatform(detectPlatform())
    setVisible(true)
  }, [])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch {}
  }

  if (!visible) return null

  const info = INSTRUCTIONS[platform]

  return (
    <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0">
            <Smartphone size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              Instala TurnFlow como app
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
              Accede más rápido desde tu pantalla de inicio, sin abrir el navegador.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-lg text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 shrink-0"
          title="Descartar"
        >
          <X size={16} />
        </button>
      </div>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <Download size={14} />
          Ver cómo instalar
        </button>
      ) : (
        <div className="mt-3 bg-white dark:bg-gray-900 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">{info.title}</p>
          <ol className="space-y-1.5">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Ocultar instrucciones
          </button>
        </div>
      )}
    </div>
  )
}
