'use client'
import Link from 'next/link'
import { useState } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type DemoTab = 'clientes' | 'cola' | 'recordatorios'
type IndustryKey = 'farmacia' | 'peluqueria' | 'restaurante' | 'tienda' | 'tramites' | 'spa'

/* ─── Data ───────────────────────────────────────────────────────────────────── */
const CLIENTS = [
  { initials: 'MR', name: 'María Rodríguez', badge: 'Frecuente', tone: 'success', last: 'Hoy', visits: '12v', spend: '$480k', note: 'Compró 5 veces este mes', phone: '+57 300 ···· 412', visits3: 5, spend3: 480, total3: 12 },
  { initials: 'JP', name: 'Juan Pérez', badge: 'Inactivo 15d', tone: 'warning', last: 'Hace 15 días', visits: '4v', spend: '$180k', note: 'Suele comprar medicinas mensuales', phone: '+57 311 ···· 089', visits3: 4, spend3: 180, total3: 4 },
  { initials: 'LG', name: 'Laura González', badge: 'Cumpleaños', tone: 'indigo', last: 'Hace 1 mes', visits: '8v', spend: '$720k', note: 'Cumple el 5 de mayo · Cliente Premium', phone: '+57 320 ···· 776', visits3: 2, spend3: 720, total3: 8 },
  { initials: 'CM', name: 'Carlos Mejía', badge: 'Premium', tone: 'indigo', last: 'Ayer', visits: '21v', spend: '$1240k', note: 'Top 5% de clientes — siempre paga al contado', phone: '+57 315 ···· 234', visits3: 7, spend3: 1240, total3: 21 },
  { initials: 'AS', name: 'Ana Sofía Vélez', badge: 'Recompra', tone: 'warning', last: 'Hace 22 días', visits: '6v', spend: '$310k', note: 'Recordatorio: producto recurrente cada 30d', phone: '+57 318 ···· 901', visits3: 3, spend3: 310, total3: 6 },
] as const

const QUEUE = [
  { num: 'A-024', name: 'Andrés Soto', wait: '2 min', now: true },
  { num: 'A-025', name: 'Patricia León', wait: '5 min', now: false },
  { num: 'A-026', name: 'Esteban R.', wait: '7 min', now: false },
  { num: 'A-027', name: 'María Camila V.', wait: '9 min', now: false },
  { num: 'A-028', name: 'Federico Jaramillo', wait: '11 min', now: false },
]

const REMINDERS = [
  { initials: 'LG', name: 'Laura González', reason: 'Cumpleaños mañana', tone: 'indigo' },
  { initials: 'JP', name: 'Juan Pérez', reason: 'Recompra de medicinas', tone: 'success' },
  { initials: 'CM', name: 'Carlos Mejía', reason: 'Aniversario · 1 año', tone: 'indigo' },
  { initials: 'AS', name: 'Ana Sofía Vélez', reason: 'Última visita hace 22d — reactivar', tone: 'warning' },
]

type Industry = {
  label: string
  tagline: string
  pain: string
  win: string
  features: string[]
}

const INDUSTRIES: Record<IndustryKey, Industry> = {
  farmacia: {
    label: 'Farmacia',
    tagline: 'Farmacia & Droguería',
    pain: 'Clientes que no regresan a recoger sus medicamentos recurrentes',
    win: 'Recordatorio automático → +35% recompra mensual',
    features: ['Historial de productos recurrentes', 'Recordatorio por WhatsApp o SMS', 'Cola de espera por QR', 'Segmentación por patología/producto', 'Cumpleaños y fechas clave'],
  },
  peluqueria: {
    label: 'Peluquería',
    tagline: 'Barbería & Salón',
    pain: 'Sillas vacías por cancelaciones de último minuto sin aviso',
    win: 'Confirmación 24h → −52% no-shows',
    features: ['Confirmación automática de cita', 'Lista de espera inteligente', 'Perfil de preferencias del cliente', 'Recordatorio día anterior', 'Reseñas post-servicio'],
  },
  restaurante: {
    label: 'Restaurante',
    tagline: 'Restaurante & Comidas',
    pain: 'Filas interminables que hacen que los clientes se vayan sin comprar',
    win: 'Cola por QR → −63% tiempo de espera',
    features: ['Cola virtual con QR en mesa', 'Pantalla TV de llamado', 'Estimación de tiempo en vivo', 'Historial de pedidos frecuentes', 'Notificación cuando es su turno'],
  },
  tienda: {
    label: 'Tienda local',
    tagline: 'Tienda & Comercio',
    pain: 'No sabes quiénes son tus mejores clientes ni cuándo vuelven',
    win: 'CRM simple → identificas tu top 20% en 1 semana',
    features: ['Registro rápido desde celular', 'Tags personalizados', 'Métricas de frecuencia', 'Segmentación por gasto', 'Exportar datos fácilmente'],
  },
  tramites: {
    label: 'Trámites & EPS',
    tagline: 'Entidades & Trámites',
    pain: 'Personas esperando horas sin saber cuándo les toca',
    win: 'Turno digital → satisfacción +40 puntos',
    features: ['Turno por QR o código', 'Pantalla informativa TV', 'Panel de asesores en tiempo real', 'Reportes de tiempos de atención', 'Múltiples ventanillas/servicios'],
  },
  spa: {
    label: 'Spa & estética',
    tagline: 'Spa & Centro Estético',
    pain: 'Agenda con huecos por clientes que no confirman ni cancelan',
    win: 'Seguimiento proactivo → agenda 90% llena',
    features: ['Agenda visual por profesional', 'Confirmación automática', 'Historial de servicios', 'Recordatorio de próxima visita', 'Fotos de evolución (próximamente)'],
  },
}

const INDUSTRY_KEYS: IndustryKey[] = ['farmacia', 'peluqueria', 'restaurante', 'tienda', 'tramites', 'spa']

const FEATURES = [
  { icon: '👥', title: 'CRM Clientes', desc: 'Centraliza toda la información de tus clientes: historial, visitas, gasto total, etiquetas y notas en un solo lugar accesible desde el celular.' },
  { icon: '📲', title: 'Cola Virtual QR', desc: 'Genera un código QR y tus clientes toman turno desde su teléfono. Sin filas físicas, sin papel, sin caos. Pantalla TV de llamado incluida.' },
  { icon: '🔔', title: 'Recordatorios Automáticos', desc: 'Envía recordatorios por WhatsApp o SMS de cumpleaños, recompras y citas próximas. Configúralo una vez y trabaja solo.' },
  { icon: '🏷️', title: 'Etiquetas y Segmentos', desc: 'Clasifica tus clientes con tags personalizados (VIP, inactivo, recompra, cumpleaños) y actúa en cada segmento con un clic.' },
  { icon: '📊', title: 'Reportes y Analítica', desc: 'Visualiza tiempos de espera promedio, clientes atendidos por día, productos más vendidos y tasa de retención mensual.' },
  { icon: '🏢', title: 'Multi-sucursal', desc: 'Gestiona varias sucursales desde un solo panel. Cada local tiene su cola, sus clientes y sus métricas independientes.' },
]

const HOW_STEPS = [
  {
    num: '01',
    title: 'Captura a tus clientes',
    desc: 'Registra clientes en segundos desde el celular. Nombre, teléfono y ya. TurnFlow hace el resto: historial, visitas y gasto se calculan solos.',
    visual: 'capture',
  },
  {
    num: '02',
    title: 'Segmenta y actúa',
    desc: 'TurnFlow identifica automáticamente quién es frecuente, quién lleva semanas sin venir y quién cumple años esta semana. Tú decides qué hacer.',
    visual: 'segment',
  },
  {
    num: '03',
    title: 'Fideliza con recordatorios',
    desc: 'Configura mensajes automáticos para cada situación. El cliente recibe el recordatorio justo a tiempo y vuelve sin que tengas que llamar.',
    visual: 'engage',
  },
]

const COMPARE_ROWS = [
  { feature: 'Centraliza datos en un único lugar', tf: true, excel: 'partial', wp: false, nada: false },
  { feature: 'Recordatorios automáticos', tf: true, excel: false, wp: 'partial', nada: false },
  { feature: 'Historial completo de cada cliente', tf: true, excel: 'partial', wp: false, nada: false },
  { feature: 'Cola por QR + pantalla TV', tf: true, excel: false, wp: false, nada: false },
  { feature: 'Multi-sucursal', tf: true, excel: 'partial', wp: false, nada: false },
  { feature: 'Segmentación con etiquetas', tf: true, excel: 'partial', wp: false, nada: false },
  { feature: 'Reportes y analítica', tf: true, excel: 'partial', wp: false, nada: false },
  { feature: 'Funciona desde el celular', tf: true, excel: 'partial', wp: true, nada: false },
]

const CASES = [
  {
    initials: 'FC',
    metric: '+35%',
    metricLabel: 'recompra mensual',
    quote: 'Aumentamos las compras recurrentes en un 35% solo haciendo seguimiento a los clientes que no habían vuelto en 20 días.',
    name: 'Farmacia Central',
    sector: 'Medellín',
    person: 'Diana Restrepo · Gerente comercial',
  },
  {
    initials: 'EB',
    metric: '−52%',
    metricLabel: 'no-shows',
    quote: 'La confirmación 24h por WhatsApp redujo a la mitad las cancelaciones de último minuto. Ahora mi agenda siempre está llena.',
    name: 'Estética Bella',
    sector: 'Bogotá',
    person: 'Andrea Castaño · Dueña',
  },
  {
    initials: 'BU',
    metric: '−63%',
    metricLabel: 'tiempo de espera',
    quote: 'La cola por QR cambió la experiencia del cliente. Nuestras reseñas en Google subieron de 3.8 a 4.6 en dos meses.',
    name: 'Burger Urbana',
    sector: 'Cali',
    person: 'Felipe Ríos · Co-founder',
  },
]

const FREE_FEATURES = [
  'Módulo Clientes completo',
  '1 sucursal · 1 usuario',
  'Hasta 30 clientes',
  'Hasta 20 productos/servicios',
  'Hasta 20 ventas al mes',
  'Historial y tags',
]

const ESSENTIAL_FEATURES = [
  'Todo del plan Gratis',
  'Hasta 300 clientes',
  'Hasta 100 productos',
  'Ventas ilimitadas',
  '2 sucursales · 6 usuarios',
  'Cotizaciones y agenda',
]

const BUSINESS_FEATURES = [
  'Todo del plan Esencial',
  'Clientes ilimitados',
  'Productos ilimitados',
  '5 sucursales · 16 usuarios',
  'Inventario con alertas',
  'Soporte prioritario por WhatsApp',
]

const ENTERPRISE_FEATURES = [
  'Todo del plan Negocio',
  'Sucursales y usuarios ilimitados',
  'Configuración personalizada',
  'Integraciones a medida',
  'Soporte dedicado',
]

/* ─── Small helpers ──────────────────────────────────────────────────────────── */
function CheckIcon({ dark }: { dark?: boolean }) {
  return (
    <span className="tf-price-check" style={dark ? { background: 'rgba(16,185,129,0.2)' } : {}}>
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke={dark ? '#6EE7B7' : '#10B981'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function CmpCell({ val }: { val: boolean | 'partial' | string }) {
  if (val === true) return <span className="tf-cmp-cell tf-cmp-cell-yes">✓</span>
  if (val === false) return <span className="tf-cmp-cell tf-cmp-cell-no">✕</span>
  return <span className="tf-cmp-cell-partial">Parcial</span>
}

function TfCmpCell({ val }: { val: boolean | 'partial' | string }) {
  if (val === true) return <span className="tf-cmp-cell tf-cmp-cell-yes" style={{ background: '#0F172A', color: 'white' }}>✓</span>
  if (val === false) return <span className="tf-cmp-cell tf-cmp-cell-no">✕</span>
  return <span className="tf-cmp-cell-partial">Parcial</span>
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export function LandingPage({ content = {} }: { content?: Record<string, string> }) {
  const c = (key: string, fallback: string) => content[key] ?? fallback
  const [demoTab, setDemoTab] = useState<DemoTab>('clientes')
  const [activeClient, setActiveClient] = useState(0)
  const [industry, setIndustry] = useState<IndustryKey>('farmacia')
  const [clients, setClients] = useState(200)
  const [ticket, setTicket] = useState(35000)
  const [inactiveRate, setInactiveRate] = useState(25)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // ROI calc
  const inactiveClients = Math.round(clients * inactiveRate / 100)
  const recovered = Math.round(inactiveClients * 0.18)
  const monthly = Math.round(recovered * ticket * 1.4)
  const yearly = monthly * 12

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `$${(n / 1000).toFixed(0)}k`
      : `$${n}`

  const ind = INDUSTRIES[industry]
  const client = CLIENTS[activeClient]

  return (
    <div className="tf-root">
      <style>{`
.tf-root {
  --indigo-50:  #EEF2FF;
  --indigo-100: #E0E7FF;
  --indigo-200: #C7D2FE;
  --indigo-300: #A5B4FC;
  --indigo-400: #818CF8;
  --indigo-500: #6366F1;
  --indigo-600: #4F46E5;
  --indigo-700: #4338CA;
  --ink-950: #0B1020;
  --ink-900: #0F172A;
  --ink-800: #1E293B;
  --ink-700: #334155;
  --ink-600: #475569;
  --ink-500: #64748B;
  --ink-400: #94A3B8;
  --ink-300: #CBD5E1;
  --ink-200: #E2E8F0;
  --ink-100: #F1F5F9;
  --ink-50:  #F8FAFC;
  --white:   #FFFFFF;
  --emerald-500: #10B981;
  --emerald-50:  #ECFDF5;
  --amber-500:   #F59E0B;
  --amber-50:    #FFFBEB;
  --rose-500:    #F43F5E;
  --rose-50:     #FFF1F2;
  --bg: #FBFBFD;
  --surface: #FFFFFF;
  --hairline: rgba(15, 23, 42, 0.08);
  --hairline-strong: rgba(15, 23, 42, 0.14);
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.05);
  --shadow-xl: 0 20px 35px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -8px rgba(15, 23, 42, 0.08);
  --shadow-glow: 0 30px 60px -15px rgba(79, 70, 229, 0.25);
  --r-xs: 6px; --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px; --r-2xl: 32px; --r-full: 9999px;
  --font-sans: "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: "Instrument Serif", ui-serif, Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--ink-900);
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.011em;
}
.tf-root *, .tf-root *::before, .tf-root *::after { box-sizing: border-box; }
.tf-root img { max-width: 100%; display: block; }
.tf-root button { font-family: inherit; cursor: pointer; }
.tf-root a { color: inherit; text-decoration: none; }
.tf-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.tf-container-wide { width: 100%; max-width: 1320px; margin: 0 auto; padding: 0 24px; }
.tf-root h1, .tf-root h2, .tf-root h3, .tf-root h4 { margin: 0; letter-spacing: -0.025em; line-height: 1.05; font-weight: 600; }
.tf-root h1 { font-size: clamp(40px, 6vw, 72px); }
.tf-root h2 { font-size: clamp(32px, 4.2vw, 52px); line-height: 1.08; }
.tf-root h3 { font-size: 22px; line-height: 1.3; letter-spacing: -0.015em; }
.tf-root p { margin: 0; line-height: 1.55; color: var(--ink-600); }
.tf-lead { font-size: 19px; line-height: 1.55; color: var(--ink-600); }
.tf-section { padding: 96px 0; position: relative; }
.tf-section-head { max-width: 720px; margin: 0 auto 56px; text-align: center; }
.tf-section-head h2 { margin-bottom: 16px; }
.tf-section-head p { font-size: 18px; }
.tf-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--indigo-600); background: var(--indigo-50); padding: 6px 12px; border-radius: var(--r-full); border: 1px solid var(--indigo-100); }
.tf-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--indigo-500); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15); animation: tf-pulse 2s ease-in-out infinite; }
@keyframes tf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.tf-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: var(--r-full); font-size: 15px; font-weight: 500; letter-spacing: -0.005em; border: 1px solid transparent; transition: all 0.15s ease; white-space: nowrap; }
.tf-btn-primary { background: var(--ink-900); color: var(--white); box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.08); }
.tf-btn-primary:hover { background: var(--ink-800); transform: translateY(-1px); }
.tf-btn-indigo { background: linear-gradient(180deg, var(--indigo-500) 0%, var(--indigo-600) 100%); color: white; box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 1px 2px rgba(67,56,202,0.4), 0 4px 12px rgba(99,102,241,0.25); }
.tf-btn-indigo:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset, 0 2px 4px rgba(67,56,202,0.4), 0 8px 20px rgba(99,102,241,0.35); }
.tf-btn-ghost { background: transparent; color: var(--ink-700); border: 1px solid var(--hairline-strong); }
.tf-btn-ghost:hover { background: var(--ink-50); border-color: var(--ink-300); }
.tf-btn-link { color: var(--ink-700); font-weight: 500; font-size: 15px; display: inline-flex; align-items: center; gap: 4px; }
.tf-btn-link:hover { color: var(--indigo-600); }
.tf-btn-lg { padding: 14px 24px; font-size: 16px; }
.tf-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: var(--r-full); background: var(--ink-100); color: var(--ink-700); }
.tf-badge-success { background: var(--emerald-50); color: #047857; }
.tf-badge-warning { background: var(--amber-50); color: #B45309; }
.tf-badge-indigo { background: var(--indigo-50); color: var(--indigo-700); }
.tf-font-display { font-family: var(--font-display); font-weight: 400; letter-spacing: -0.02em; }
.tf-italic { font-style: italic; }
.tf-text-indigo { color: var(--indigo-600); }

/* Header */
.tf-header { position: sticky; top: 0; z-index: 50; background: rgba(251,251,253,0.85); backdrop-filter: saturate(180%) blur(12px); border-bottom: 1px solid var(--hairline); }
.tf-nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; }
.tf-nav-left { display: flex; align-items: center; gap: 40px; }
.tf-brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 17px; letter-spacing: -0.02em; }
.tf-brand-mark { width: 28px; height: 28px; border-radius: 8px; background: linear-gradient(135deg, var(--indigo-500) 0%, var(--indigo-700) 100%); display: grid; place-items: center; box-shadow: 0 1px 2px rgba(67,56,202,0.3), 0 4px 12px rgba(99,102,241,0.2); }
.tf-nav-links { display: flex; gap: 28px; }
.tf-nav-links a { color: var(--ink-600); font-size: 14px; font-weight: 500; transition: color 0.15s; }
.tf-nav-links a:hover { color: var(--ink-900); }
.tf-nav-right { display: flex; align-items: center; gap: 8px; }

/* Hero */
.tf-hero { position: relative; padding: 64px 0 96px; overflow: hidden; }
.tf-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(800px 400px at 50% -10%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(600px 300px at 85% 30%, rgba(165,180,252,0.18), transparent 60%); pointer-events: none; }
.tf-hero-inner { position: relative; display: grid; grid-template-columns: minmax(0, 480px) minmax(0, 1fr); gap: 64px; align-items: center; }
.tf-hero-copy h1 { margin: 20px 0; }
.tf-hero-copy h1 .tf-accent { font-family: var(--font-display); font-style: italic; font-weight: 400; color: var(--indigo-600); letter-spacing: -0.03em; }
.tf-hero-copy .tf-lead { margin-bottom: 28px; max-width: 460px; }
.tf-hero-cta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.tf-hero-trust { margin-top: 28px; display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--ink-500); }
.tf-hero-trust-avatars { display: flex; }
.tf-hero-trust-avatars > div { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--white); background: linear-gradient(135deg, var(--indigo-300), var(--indigo-500)); margin-left: -8px; display: grid; place-items: center; font-size: 10px; font-weight: 600; color: white; }
.tf-hero-trust-avatars > div:first-child { margin-left: 0; }
.tf-hero-trust-stars { color: var(--amber-500); letter-spacing: 1px; font-size: 11px; }

/* Hero Demo */
.tf-hero-demo { position: relative; filter: drop-shadow(0 30px 60px rgba(15,23,42,0.12)); }
.tf-demo-frame { background: var(--surface); border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-xl); }
.tf-demo-chrome { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: linear-gradient(180deg, #FAFAFC, #F4F4F7); border-bottom: 1px solid var(--hairline); }
.tf-demo-dots { display: flex; gap: 6px; }
.tf-demo-dots span { width: 11px; height: 11px; border-radius: 50%; }
.tf-demo-url { flex: 1; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: var(--r-full); background: var(--white); border: 1px solid var(--hairline); font-size: 12px; color: var(--ink-500); max-width: 320px; margin: 0 auto; font-family: var(--font-mono); }
.tf-demo-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: var(--emerald-500); padding: 4px 10px; border-radius: var(--r-full); background: var(--emerald-50); }
.tf-dot-live { width: 6px; height: 6px; border-radius: 50%; background: var(--emerald-500); box-shadow: 0 0 0 3px rgba(16,185,129,0.2); animation: tf-pulse 1.5s ease-in-out infinite; }
.tf-demo-body { display: grid; grid-template-columns: 200px 1fr; min-height: 540px; }
.tf-demo-side { background: #FAFAFC; border-right: 1px solid var(--hairline); padding: 16px 12px; display: flex; flex-direction: column; }
.tf-demo-org { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--r-md); margin-bottom: 16px; }
.tf-demo-org-mark { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--indigo-500), var(--indigo-700)); color: white; display: grid; place-items: center; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; }
.tf-demo-org-name { font-size: 13px; font-weight: 600; color: var(--ink-900); }
.tf-demo-org-meta { font-size: 11px; color: var(--ink-500); }
.tf-demo-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.tf-demo-nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r-sm); border: none; background: transparent; color: var(--ink-600); font-size: 13px; font-weight: 500; text-align: left; transition: all 0.15s; width: 100%; }
.tf-demo-nav-item:hover { background: var(--ink-100); color: var(--ink-900); }
.tf-demo-nav-item.tf-active { background: var(--white); color: var(--indigo-700); box-shadow: 0 1px 2px rgba(15,23,42,0.06), inset 0 0 0 1px var(--indigo-100); }
.tf-demo-side-foot { margin-top: 12px; padding: 12px; background: var(--white); border-radius: var(--r-md); border: 1px solid var(--hairline); }
.tf-demo-stat-value { font-size: 22px; font-weight: 600; color: var(--emerald-500); letter-spacing: -0.02em; }
.tf-demo-stat-label { font-size: 11px; color: var(--ink-500); }
.tf-demo-main { display: flex; flex-direction: column; min-width: 0; }
.tf-demo-tabs { display: flex; align-items: center; gap: 4px; padding: 0 16px; border-bottom: 1px solid var(--hairline); }
.tf-demo-tab { display: inline-flex; align-items: center; gap: 6px; padding: 12px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--ink-500); font-size: 13px; font-weight: 500; margin-bottom: -1px; transition: all 0.15s; cursor: pointer; }
.tf-demo-tab:hover { color: var(--ink-800); }
.tf-demo-tab.tf-active { color: var(--ink-900); border-bottom-color: var(--ink-900); }
.tf-demo-tab-count { font-size: 10px; padding: 2px 6px; border-radius: var(--r-full); background: var(--ink-100); color: var(--ink-600); }
.tf-demo-tab.tf-active .tf-demo-tab-count { background: var(--ink-900); color: white; }
.tf-demo-search { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--r-full); background: var(--ink-100); font-size: 12px; color: var(--ink-500); }
.tf-demo-content { padding: 16px; flex: 1; }
.tf-demo-filters { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.tf-chip { font-size: 12px; padding: 5px 11px; border-radius: var(--r-full); border: 1px solid var(--hairline); background: var(--white); color: var(--ink-600); font-weight: 500; transition: all 0.15s; cursor: pointer; }
.tf-chip:hover { border-color: var(--ink-300); color: var(--ink-800); }
.tf-chip.tf-active { background: var(--ink-900); color: white; border-color: var(--ink-900); }
.tf-demo-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 260px); gap: 12px; }
.tf-demo-list { display: flex; flex-direction: column; gap: 4px; }
.tf-demo-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: transparent; border: 1px solid transparent; border-radius: var(--r-md); text-align: left; transition: all 0.15s; width: 100%; cursor: pointer; }
.tf-demo-row:hover { background: var(--ink-50); }
.tf-demo-row.tf-active { background: var(--white); border-color: var(--indigo-200); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.tf-demo-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--indigo-200), var(--indigo-400)); color: white; display: grid; place-items: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.tf-demo-avatar-lg { width: 44px; height: 44px; font-size: 14px; background: linear-gradient(135deg, var(--indigo-400), var(--indigo-600)); box-shadow: 0 2px 6px rgba(79,70,229,0.2); }
.tf-demo-row-name { font-size: 13px; font-weight: 600; color: var(--ink-900); }
.tf-demo-row-meta { font-size: 11px; color: var(--ink-500); margin-top: 1px; }
.tf-demo-detail { background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-md); padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.tf-demo-detail-head { display: flex; align-items: center; gap: 10px; }
.tf-demo-detail-name { font-size: 14px; font-weight: 600; color: var(--ink-900); }
.tf-demo-detail-phone { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
.tf-demo-detail-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 10px 0; border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
.tf-demo-detail-stat-v { font-size: 16px; font-weight: 600; color: var(--ink-900); letter-spacing: -0.01em; }
.tf-demo-detail-stat-l { font-size: 10px; color: var(--ink-500); }
.tf-demo-note { font-size: 12px; color: var(--ink-700); background: var(--indigo-50); border-radius: var(--r-sm); padding: 10px; line-height: 1.5; }
.tf-demo-note-label { display: block; font-size: 10px; font-weight: 600; color: var(--indigo-700); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.tf-demo-actions { display: flex; gap: 6px; }
.tf-demo-action { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 8px; border-radius: var(--r-sm); border: 1px solid var(--hairline); background: var(--white); color: var(--ink-700); font-size: 12px; font-weight: 500; transition: all 0.15s; cursor: pointer; }
.tf-demo-action:hover { background: var(--ink-50); }
.tf-demo-action-primary { background: var(--ink-900); color: white; border-color: var(--ink-900); }
.tf-demo-action-primary:hover { background: var(--ink-800); }
.tf-demo-q-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.tf-demo-h { font-size: 15px; font-weight: 600; color: var(--ink-900); }
.tf-demo-sub { font-size: 12px; color: var(--ink-500); margin-top: 2px; }
.tf-demo-queue { display: flex; flex-direction: column; gap: 6px; }
.tf-demo-q-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-md); }
.tf-demo-q-row-now { border-color: var(--indigo-300); background: linear-gradient(180deg, var(--indigo-50), var(--white)); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
.tf-demo-q-num { font-family: var(--font-mono); font-size: 13px; font-weight: 600; padding: 6px 10px; border-radius: var(--r-sm); background: var(--ink-100); color: var(--ink-700); letter-spacing: 0.02em; }
.tf-demo-q-num-now { background: var(--ink-900); color: white; }
.tf-demo-q-name { font-size: 13px; font-weight: 600; color: var(--ink-900); }
.tf-demo-q-meta { font-size: 11px; color: var(--ink-500); }
.tf-demo-reminders { display: flex; flex-direction: column; gap: 6px; }
.tf-demo-reminder { display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-md); }
.tf-demo-rem-icon { width: 32px; height: 32px; border-radius: var(--r-sm); display: grid; place-items: center; flex-shrink: 0; }
.tf-tone-indigo { background: var(--indigo-50); color: var(--indigo-600); }
.tf-tone-success { background: var(--emerald-50); color: #059669; }
.tf-tone-warning { background: var(--amber-50); color: #D97706; }
.tf-demo-rem-who { font-size: 13px; font-weight: 600; color: var(--ink-900); }
.tf-demo-rem-why { font-size: 11px; color: var(--ink-500); margin-top: 1px; }

/* Industries */
.tf-section-white { background: var(--white); }
.tf-industry-tabs { display: flex; gap: 4px; justify-content: center; margin-bottom: 32px; flex-wrap: wrap; padding: 4px; background: var(--ink-100); border-radius: var(--r-full); width: fit-content; margin-left: auto; margin-right: auto; }
.tf-industry-tab { padding: 8px 16px; background: transparent; border: none; border-radius: var(--r-full); font-size: 13px; font-weight: 500; color: var(--ink-600); transition: all 0.15s; cursor: pointer; }
.tf-industry-tab:hover { color: var(--ink-900); }
.tf-industry-tab.tf-active { background: var(--white); color: var(--ink-900); box-shadow: var(--shadow-sm); }
.tf-industry-card { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow-md); }
.tf-industry-main { padding: 48px; background: linear-gradient(135deg, var(--white) 0%, var(--indigo-50) 100%); }
.tf-industry-tagline { font-size: 13px; font-weight: 500; color: var(--indigo-600); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 16px; }
.tf-industry-pain { font-family: var(--font-display); font-style: italic; font-size: 36px; font-weight: 400; color: var(--ink-900); letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 24px; }
.tf-industry-win { display: flex; align-items: center; gap: 10px; padding: 14px 18px; background: var(--white); border-radius: var(--r-md); border: 1px solid var(--indigo-100); font-size: 15px; font-weight: 500; color: var(--ink-900); width: fit-content; }
.tf-industry-win-arrow { color: var(--indigo-600); font-weight: 700; font-size: 18px; }
.tf-industry-side { padding: 48px; border-left: 1px solid var(--hairline); background: var(--ink-50); }
.tf-industry-side-label { font-size: 11px; font-weight: 600; color: var(--ink-500); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
.tf-industry-feature { display: flex; align-items: center; gap: 10px; padding: 10px 0; font-size: 15px; color: var(--ink-700); border-bottom: 1px dashed var(--hairline); }
.tf-industry-feature:last-child { border-bottom: none; }

/* Compare */
.tf-cmp-table-wrap { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.tf-cmp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.tf-cmp-table thead th { padding: 24px 16px; font-size: 13px; font-weight: 600; color: var(--ink-700); text-align: center; border-bottom: 1px solid var(--hairline); background: var(--ink-50); }
.tf-cmp-table thead th:first-child { background: transparent; text-align: left; }
.tf-cmp-th-tf { background: var(--ink-900) !important; color: white !important; }
.tf-cmp-th-mark { display: inline-block; background: linear-gradient(135deg, var(--indigo-400), var(--indigo-600)); color: white; padding: 4px 8px; border-radius: var(--r-sm); font-size: 11px; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.04em; }
.tf-cmp-table tbody tr { border-bottom: 1px solid var(--hairline); }
.tf-cmp-table tbody tr:last-child { border-bottom: none; }
.tf-cmp-table tbody td { padding: 14px 16px; text-align: center; vertical-align: middle; }
.tf-cmp-feature { text-align: left !important; font-weight: 500; color: var(--ink-800); }
.tf-cmp-tf { background: rgba(15,23,42,0.02); border-left: 1px solid var(--hairline); border-right: 1px solid var(--hairline); }
.tf-cmp-cell { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--r-full); font-size: 11px; font-weight: 600; }
.tf-cmp-cell-yes { background: var(--emerald-50); color: var(--emerald-500); }
.tf-cmp-cell-no { background: var(--ink-100); color: var(--ink-400); }
.tf-cmp-cell-partial { width: auto !important; padding: 4px 10px; background: var(--amber-50); color: #B45309; border-radius: var(--r-full); font-size: 11px; font-weight: 600; display: inline-flex; }
.tf-cmp-tf .tf-cmp-cell-yes { background: var(--ink-900); color: white; }

/* Features */
.tf-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.tf-feature-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-lg); padding: 28px; transition: all 0.2s ease; }
.tf-feature-card:hover { border-color: var(--indigo-200); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.tf-feature-icon { width: 44px; height: 44px; border-radius: var(--r-md); background: linear-gradient(135deg, var(--indigo-50), var(--indigo-100)); color: var(--indigo-600); display: grid; place-items: center; margin-bottom: 20px; border: 1px solid var(--indigo-100); font-size: 20px; }
.tf-feature-card h3 { margin-bottom: 8px; font-size: 18px; }

/* How it works */
.tf-section-bg { background: var(--bg); }
.tf-section-bg::before { content: ""; position: absolute; inset: 0; background: radial-gradient(800px 300px at 50% 0%, rgba(99,102,241,0.08), transparent 70%); pointer-events: none; }
.tf-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.tf-how-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); padding: 28px; }
.tf-how-num { font-family: var(--font-display); font-size: 32px; color: var(--indigo-300); letter-spacing: -0.02em; margin-bottom: 16px; font-style: italic; }
.tf-how-visual { height: 140px; background: var(--ink-50); border: 1px solid var(--hairline); border-radius: var(--r-md); margin-bottom: 20px; display: flex; align-items: center; justify-content: center; padding: 16px; overflow: hidden; }
.tf-how-card h3 { margin-bottom: 8px; font-size: 18px; }
.tf-howvis-capture { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.tf-howvis-row { display: flex; align-items: center; gap: 10px; }
.tf-howvis-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--indigo-300), var(--indigo-500)); color: white; display: grid; place-items: center; font-size: 12px; font-weight: 600; }
.tf-howvis-input { flex: 1; padding: 8px 12px; background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-sm); font-family: var(--font-mono); font-size: 12px; color: var(--ink-700); display: flex; align-items: center; gap: 2px; }
.tf-howvis-caret { width: 1px; height: 14px; background: var(--indigo-500); animation: tf-blink 1s steps(2) infinite; }
@keyframes tf-blink { 50% { opacity: 0; } }
.tf-howvis-tags { display: flex; gap: 6px; }
.tf-howvis-tag { font-size: 11px; padding: 3px 8px; border-radius: var(--r-full); background: var(--indigo-50); color: var(--indigo-700); font-weight: 500; }
.tf-howvis-bars { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; height: 80px; align-items: end; width: 100%; }
.tf-howvis-bars > div { border-radius: 4px 4px 0 0; }
.tf-howvis-seg-labels { display: flex; justify-content: space-around; font-size: 10px; color: var(--ink-500); margin-top: 4px; }
.tf-howvis-engage { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.tf-howvis-msg { background: var(--white); border: 1px solid var(--hairline); border-radius: var(--r-md); padding: 8px 12px; }
.tf-howvis-msg-from { font-size: 10px; color: var(--indigo-600); font-weight: 600; margin-bottom: 4px; }
.tf-howvis-msg-body { font-size: 12px; color: var(--ink-800); line-height: 1.4; }
.tf-howvis-checks { display: flex; gap: 8px; font-size: 10px; color: var(--ink-500); font-family: var(--font-mono); }
.tf-howvis-checks-active { color: var(--indigo-600); font-weight: 600; }

/* ROI */
.tf-roi-card { display: grid; grid-template-columns: 1fr 1fr; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); overflow: hidden; box-shadow: var(--shadow-md); }
.tf-roi-inputs { padding: 40px; display: flex; flex-direction: column; gap: 28px; }
.tf-roi-input { display: flex; flex-direction: column; gap: 8px; }
.tf-roi-input-label { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 500; color: var(--ink-700); }
.tf-roi-input-value { font-family: var(--font-mono); font-size: 16px; font-weight: 600; color: var(--ink-900); }
.tf-roi-input input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: var(--r-full); background: var(--ink-200); outline: none; }
.tf-roi-input input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--white); border: 2px solid var(--indigo-600); box-shadow: 0 2px 6px rgba(99,102,241,0.3); cursor: pointer; }
.tf-roi-input-range { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
.tf-roi-result { padding: 40px; background: linear-gradient(135deg, var(--ink-900) 0%, #1A1F3A 100%); color: white; position: relative; }
.tf-roi-result::before { content: ""; position: absolute; inset: 0; background: radial-gradient(400px 200px at 80% 20%, rgba(99,102,241,0.3), transparent 70%); pointer-events: none; }
.tf-roi-result-label { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 8px; position: relative; }
.tf-roi-result-value { display: flex; align-items: baseline; gap: 8px; position: relative; }
.tf-roi-amount { font-size: 48px; font-weight: 600; letter-spacing: -0.03em; background: linear-gradient(180deg, white 0%, var(--indigo-200) 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.tf-roi-period { font-size: 16px; color: rgba(255,255,255,0.6); }
.tf-roi-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 24px 0; }
.tf-roi-yearly { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 24px; position: relative; }
.tf-roi-yearly strong { font-size: 22px; color: white; font-weight: 600; letter-spacing: -0.02em; }
.tf-roi-breakdown { display: flex; flex-direction: column; gap: 8px; position: relative; }
.tf-roi-bd-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.7); }
.tf-roi-bd-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--indigo-400); }
.tf-roi-disclaimer { margin-top: 24px; font-size: 11px; color: rgba(255,255,255,0.4); position: relative; }

/* Cases */
.tf-cases-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.tf-case-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); padding: 32px; display: flex; flex-direction: column; }
.tf-case-metric-v { font-size: 56px; font-weight: 600; letter-spacing: -0.04em; color: var(--ink-900); line-height: 1; }
.tf-case-metric-l { font-size: 13px; color: var(--indigo-600); font-weight: 500; margin-top: 6px; }
.tf-case-metric { margin-bottom: 24px; }
.tf-case-quote { font-family: var(--font-display); font-style: italic; font-size: 19px; line-height: 1.4; color: var(--ink-800); margin: 0 0 24px; flex: 1; letter-spacing: -0.015em; }
.tf-case-author { display: flex; align-items: center; gap: 12px; padding-top: 20px; border-top: 1px solid var(--hairline); }
.tf-case-logo { width: 36px; height: 36px; border-radius: var(--r-sm); background: linear-gradient(135deg, var(--indigo-100), var(--indigo-200)); color: var(--indigo-700); display: grid; place-items: center; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; }
.tf-case-name { font-size: 14px; font-weight: 600; color: var(--ink-900); }
.tf-case-sector { font-size: 12px; color: var(--ink-500); }
.tf-case-person { font-size: 12px; color: var(--ink-500); margin-top: 12px; }

/* Pricing */
.tf-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 880px; margin: 0 auto; }
.tf-price-card { background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); padding: 36px; display: flex; flex-direction: column; position: relative; }
.tf-price-card-pro { background: linear-gradient(180deg, var(--ink-900) 0%, #161B30 100%); color: white; border-color: var(--ink-900); box-shadow: var(--shadow-glow); }
.tf-price-badge { position: absolute; top: -10px; right: 24px; background: linear-gradient(135deg, var(--indigo-400), var(--indigo-600)); color: white; padding: 4px 12px; border-radius: var(--r-full); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; box-shadow: 0 4px 10px rgba(99,102,241,0.4); }
.tf-price-name { font-size: 14px; font-weight: 500; color: var(--ink-500); margin-bottom: 12px; }
.tf-price-card-pro .tf-price-name { color: rgba(255,255,255,0.6); }
.tf-price-amount { display: flex; align-items: baseline; gap: 4px; font-size: 48px; font-weight: 600; letter-spacing: -0.03em; color: var(--ink-900); }
.tf-price-card-pro .tf-price-amount { color: white; }
.tf-price-currency { font-size: 24px; }
.tf-price-suffix { font-size: 14px; font-weight: 400; color: var(--ink-500); margin-left: 4px; }
.tf-price-card-pro .tf-price-suffix { color: rgba(255,255,255,0.6); }
.tf-price-period { font-size: 13px; color: var(--ink-500); margin-top: 6px; margin-bottom: 28px; }
.tf-price-card-pro .tf-price-period { color: rgba(255,255,255,0.6); }
.tf-price-features { list-style: none; margin: 0 0 28px; padding: 0; display: flex; flex-direction: column; gap: 12px; flex: 1; }
.tf-price-features li { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--ink-700); }
.tf-price-card-pro .tf-price-features li { color: rgba(255,255,255,0.85); }
.tf-price-check { width: 18px; height: 18px; border-radius: 50%; background: var(--emerald-50); flex-shrink: 0; display: grid; place-items: center; }
.tf-price-card-pro .tf-price-check { background: rgba(16,185,129,0.2); }

.tf-btn-white { background: white !important; color: var(--ink-900) !important; border: none; font-weight: 600; }
.tf-btn-white:hover { background: var(--ink-100) !important; }
.tf-enterprise-banner { display: flex; align-items: center; justify-content: space-between; gap: 24px; max-width: 880px; margin: 24px auto 0; padding: 32px 40px; background: linear-gradient(135deg, var(--indigo-50) 0%, var(--white) 100%); border: 1px solid var(--indigo-100); border-radius: var(--r-xl); }

/* Final CTA */
.tf-final { padding: 64px 0; background: var(--bg); }
.tf-final-card { position: relative; background: linear-gradient(135deg, var(--ink-900) 0%, #1A1F3A 60%, #2D1B5C 100%); border-radius: var(--r-2xl); overflow: hidden; padding: 80px 48px; text-align: center; box-shadow: var(--shadow-glow); }
.tf-final-bg { position: absolute; inset: 0; background: radial-gradient(600px 300px at 20% 30%, rgba(99,102,241,0.4), transparent 60%), radial-gradient(400px 200px at 80% 70%, rgba(165,180,252,0.2), transparent 60%); pointer-events: none; }
.tf-final-content { position: relative; max-width: 640px; margin: 0 auto; }
.tf-eyebrow-light { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.15); color: white; }
.tf-final-lead { color: rgba(255,255,255,0.75); font-size: 17px; margin: 16px auto 32px; max-width: 480px; }
.tf-final-form { display: flex; gap: 8px; max-width: 480px; margin: 0 auto; background: rgba(255,255,255,0.06); padding: 6px; border-radius: var(--r-full); border: 1px solid rgba(255,255,255,0.12); }
.tf-final-form input { flex: 1; background: transparent; border: none; outline: none; padding: 0 16px; color: white; font-size: 15px; font-family: inherit; }
.tf-final-form input::placeholder { color: rgba(255,255,255,0.4); }
.tf-final-success { display: inline-flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: var(--r-full); background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6EE7B7; font-size: 15px; }
.tf-final-success strong { color: white; }
.tf-final-trust { display: flex; justify-content: center; gap: 24px; margin-top: 24px; font-size: 13px; color: rgba(255,255,255,0.5); flex-wrap: wrap; }

/* Footer */
.tf-footer { background: var(--ink-950); color: rgba(255,255,255,0.7); padding: 64px 0 32px; }
.tf-footer .tf-brand { color: white; }
.tf-footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.tf-footer-h { font-size: 13px; font-weight: 600; color: white; margin-bottom: 16px; }
.tf-footer a { display: block; font-size: 13px; color: rgba(255,255,255,0.6); padding: 5px 0; transition: color 0.15s; }
.tf-footer a:hover { color: white; }
.tf-footer-bottom { display: flex; justify-content: space-between; padding-top: 24px; font-size: 12px; color: rgba(255,255,255,0.4); }

/* Responsive */
@media (max-width: 1024px) { .tf-hero-inner { grid-template-columns: 1fr; gap: 48px; } }
@media (max-width: 768px) {
  .tf-section { padding: 64px 0; }
  .tf-nav-links { display: none; }
  .tf-root h1 { font-size: 40px; }
  .tf-root h2 { font-size: 32px; }
  .tf-demo-body { grid-template-columns: 1fr; }
  .tf-demo-side { display: none; }
  .tf-demo-split { grid-template-columns: 1fr; }
  .tf-industry-card { grid-template-columns: 1fr; }
  .tf-industry-main, .tf-industry-side { padding: 28px; }
  .tf-industry-pain { font-size: 26px; }
  .tf-industry-side { border-left: none; border-top: 1px solid var(--hairline); }
  .tf-features-grid { grid-template-columns: 1fr; }
  .tf-how-grid { grid-template-columns: 1fr; }
  .tf-roi-card { grid-template-columns: 1fr; }
  .tf-roi-inputs, .tf-roi-result { padding: 28px; }
  .tf-roi-amount { font-size: 36px; }
  .tf-cases-grid { grid-template-columns: 1fr; }
  .tf-pricing-grid { grid-template-columns: 1fr; }
  .tf-enterprise-banner { flex-direction: column; text-align: center; padding: 28px; }
}
@media (max-width: 640px) {
  .tf-final-card { padding: 56px 24px; }
  .tf-final-form { flex-direction: column; padding: 12px; border-radius: var(--r-lg); }
  .tf-final-form input { padding: 12px 16px; }
  .tf-footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .tf-footer-bottom { flex-direction: column; gap: 12px; }
}
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="tf-header">
        <div className="tf-container">
          <nav className="tf-nav">
            <div className="tf-nav-left">
              <a href="#" className="tf-brand">
                <div className="tf-brand-mark">
                  <svg width="16" height="16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4.4" width="20" height="3.5" rx="1.75" fill="white"/>
                    <rect x="12.25" y="4.4" width="3.5" height="15" rx="1.75" fill="white"/>
                    <circle cx="5.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                    <circle cx="12.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                    <circle cx="19.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                  </svg>
                </div>
                TurnFlow
              </a>
              <div className="tf-nav-links">
                <a href="#funcionalidades">Funcionalidades</a>
                <a href="#industrias">Industrias</a>
                <a href="#como-funciona">Cómo funciona</a>
                <a href="#roi">Calculadora</a>
                <a href="#precios">Precios</a>
              </div>
            </div>
            <div className="tf-nav-right">
              <Link href="/login" className="tf-btn-link">Iniciar sesión</Link>
              <Link href="/register" className="tf-btn tf-btn-indigo">Empezar gratis</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="tf-hero">
        <div className="tf-container">
          <div className="tf-hero-inner">
            {/* Copy */}
            <div className="tf-hero-copy">
              <span className="tf-eyebrow">
                <span className="tf-eyebrow-dot" />
                {c('hero_badge', 'Gestión de clientes para negocios locales')}
              </span>
              <h1>
                {c('hero_title', 'Tu negocio necesita')}<br />
                <span className="tf-accent">{c('hero_title_accent', 'recordar más,')}</span><br />
                {c('hero_title_end', 'perder menos')}
              </h1>
              <p className="tf-lead">
                {c('hero_subtitle', 'TurnFlow centraliza tus clientes, automatiza recordatorios y elimina las filas. Todo desde el celular, sin complicaciones.')}
              </p>
              <div className="tf-hero-cta">
                <Link href="/register" className="tf-btn tf-btn-indigo tf-btn-lg">
                  {c('hero_cta_primary', 'Empezar gratis')}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
                <a href="#como-funciona" className="tf-btn tf-btn-ghost tf-btn-lg">{c('hero_cta_secondary', 'Ver cómo funciona')}</a>
              </div>
              <div className="tf-hero-trust">
                <div className="tf-hero-trust-avatars">
                  {['D', 'A', 'F', 'M'].map((l, i) => <div key={i}>{l}</div>)}
                </div>
                <div>
                  <div className="tf-hero-trust-stars">★★★★★</div>
                  <span>{c('hero_trust_text', '+200 negocios activos')}</span>
                </div>
              </div>
            </div>

            {/* Demo */}
            <div className="tf-hero-demo">
              <div className="tf-demo-frame">
                {/* Chrome bar */}
                <div className="tf-demo-chrome">
                  <div className="tf-demo-dots">
                    <span style={{ background: '#FF5F57' }} />
                    <span style={{ background: '#FFBD2E' }} />
                    <span style={{ background: '#28CA41' }} />
                  </div>
                  <div className="tf-demo-url">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none"><rect x="1" y="4" width="8" height="7" rx="1" stroke="#94A3B8" strokeWidth="1.2" /><path d="M3 4V3a2 2 0 014 0v1" stroke="#94A3B8" strokeWidth="1.2" /></svg>
                    app.turnflow.com.co
                  </div>
                  <div className="tf-demo-pill">
                    <span className="tf-dot-live" /> En vivo
                  </div>
                </div>

                {/* Body */}
                <div className="tf-demo-body">
                  {/* Sidebar */}
                  <div className="tf-demo-side">
                    <div className="tf-demo-org">
                      <div className="tf-demo-org-mark">FC</div>
                      <div>
                        <div className="tf-demo-org-name">Farmacia Central</div>
                        <div className="tf-demo-org-meta">Medellín · Pro</div>
                      </div>
                    </div>
                    <nav className="tf-demo-nav">
                      {[
                        { icon: '👥', label: 'Clientes', tab: 'clientes' },
                        { icon: '🔢', label: 'Cola', tab: 'cola' },
                        { icon: '🔔', label: 'Recordatorios', tab: 'recordatorios' },
                        { icon: '📊', label: 'Reportes', tab: null },
                        { icon: '⚙️', label: 'Configuración', tab: null },
                      ].map(item => (
                        <button
                          key={item.label}
                          className={`tf-demo-nav-item${demoTab === item.tab ? ' tf-active' : ''}`}
                          onClick={() => item.tab && setDemoTab(item.tab as DemoTab)}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                    </nav>
                    <div className="tf-demo-side-foot">
                      <div className="tf-demo-stat-value">$4.2M</div>
                      <div className="tf-demo-stat-label">Valor total clientes</div>
                    </div>
                  </div>

                  {/* Main area */}
                  <div className="tf-demo-main">
                    {/* Tabs */}
                    <div className="tf-demo-tabs">
                      {(['clientes', 'cola', 'recordatorios'] as DemoTab[]).map(t => (
                        <button
                          key={t}
                          className={`tf-demo-tab${demoTab === t ? ' tf-active' : ''}`}
                          onClick={() => setDemoTab(t)}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                          <span className="tf-demo-tab-count">
                            {t === 'clientes' ? '5' : t === 'cola' ? '5' : '4'}
                          </span>
                        </button>
                      ))}
                      <div className="tf-demo-search">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#94A3B8" strokeWidth="1.2" /><path d="M8.5 8.5L10.5 10.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        Buscar
                      </div>
                    </div>

                    {/* Content */}
                    <div className="tf-demo-content">
                      {demoTab === 'clientes' && (
                        <>
                          <div className="tf-demo-filters">
                            {['Todos', 'Frecuentes', 'Inactivos', 'Cumpleaños'].map((f, i) => (
                              <span key={f} className={`tf-chip${i === 0 ? ' tf-active' : ''}`}>{f}</span>
                            ))}
                          </div>
                          <div className="tf-demo-split">
                            <div className="tf-demo-list">
                              {CLIENTS.map((c, i) => (
                                <button
                                  key={c.name}
                                  className={`tf-demo-row${activeClient === i ? ' tf-active' : ''}`}
                                  onClick={() => setActiveClient(i)}
                                >
                                  <div className="tf-demo-avatar">{c.initials}</div>
                                  <div style={{ flex: 1 }}>
                                    <div className="tf-demo-row-name">{c.name}</div>
                                    <div className="tf-demo-row-meta">{c.last} · {c.visits}</div>
                                  </div>
                                  <span className={`tf-badge tf-badge-${client.tone === c.tone ? c.tone : c.tone}`}>{c.badge}</span>
                                </button>
                              ))}
                            </div>
                            <div className="tf-demo-detail">
                              <div className="tf-demo-detail-head">
                                <div className={`tf-demo-avatar tf-demo-avatar-lg`}>{client.initials}</div>
                                <div>
                                  <div className="tf-demo-detail-name">{client.name}</div>
                                  <div className="tf-demo-detail-phone">{client.phone}</div>
                                </div>
                              </div>
                              <div className="tf-demo-detail-stats">
                                <div>
                                  <div className="tf-demo-detail-stat-v">{client.visits3}</div>
                                  <div className="tf-demo-detail-stat-l">visitas</div>
                                </div>
                                <div>
                                  <div className="tf-demo-detail-stat-v">${client.spend3}k</div>
                                  <div className="tf-demo-detail-stat-l">gasto</div>
                                </div>
                                <div>
                                  <div className="tf-demo-detail-stat-v">{client.total3}</div>
                                  <div className="tf-demo-detail-stat-l">total visitas</div>
                                </div>
                              </div>
                              <div className="tf-demo-note">
                                <span className="tf-demo-note-label">Nota</span>
                                {client.note}
                              </div>
                              <div className="tf-demo-actions">
                                <button className="tf-demo-action">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M1 6h10M1 9h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                                  Nota
                                </button>
                                <button className="tf-demo-action tf-demo-action-primary">
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 2L2 6l3 1.5L6.5 11 10 2z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" /></svg>
                                  Mensaje
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {demoTab === 'cola' && (
                        <>
                          <div className="tf-demo-q-head">
                            <div>
                              <div className="tf-demo-h">Cola de espera</div>
                              <div className="tf-demo-sub">5 personas en espera · ~11 min</div>
                            </div>
                            <span className="tf-badge tf-badge-success">Abierto</span>
                          </div>
                          <div className="tf-demo-queue">
                            {QUEUE.map(q => (
                              <div key={q.num} className={`tf-demo-q-row${q.now ? ' tf-demo-q-row-now' : ''}`}>
                                <span className={`tf-demo-q-num${q.now ? ' tf-demo-q-num-now' : ''}`}>{q.num}</span>
                                <div style={{ flex: 1 }}>
                                  <div className="tf-demo-q-name">{q.name}</div>
                                  <div className="tf-demo-q-meta">Espera: {q.wait}</div>
                                </div>
                                {q.now && <span className="tf-badge tf-badge-indigo">Atendiendo</span>}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {demoTab === 'recordatorios' && (
                        <>
                          <div className="tf-demo-q-head">
                            <div>
                              <div className="tf-demo-h">Recordatorios de hoy</div>
                              <div className="tf-demo-sub">4 pendientes de enviar</div>
                            </div>
                            <button className="tf-btn tf-btn-indigo" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}>Enviar todos</button>
                          </div>
                          <div className="tf-demo-reminders">
                            {REMINDERS.map(r => (
                              <div key={r.name} className="tf-demo-reminder">
                                <div className={`tf-demo-rem-icon tf-tone-${r.tone}`}>
                                  {r.tone === 'indigo' ? '🎂' : r.tone === 'success' ? '💊' : '⏰'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div className="tf-demo-rem-who">{r.name}</div>
                                  <div className="tf-demo-rem-why">{r.reason}</div>
                                </div>
                                <button className="tf-demo-action" style={{ flex: 'none' }}>
                                  Enviar
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries ──────────────────────────────────────────────────────── */}
      <section id="industrias" className="tf-section tf-section-white">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('industries_badge', 'Por industria')}</span>
            <h2 style={{ marginTop: 16 }}>{c('industries_title', 'Hecho para tu tipo de negocio')}</h2>
            <p>{c('industries_subtitle', 'TurnFlow se adapta a la realidad de cada sector. Elige el tuyo y ve cómo lo resolvemos.')}</p>
          </div>

          <div className="tf-industry-tabs">
            {INDUSTRY_KEYS.map(k => (
              <button
                key={k}
                className={`tf-industry-tab${industry === k ? ' tf-active' : ''}`}
                onClick={() => setIndustry(k)}
              >
                {INDUSTRIES[k].label}
              </button>
            ))}
          </div>

          <div className="tf-industry-card">
            <div className="tf-industry-main">
              <div className="tf-industry-tagline">{ind.tagline}</div>
              <div className="tf-industry-pain">"{ind.pain}"</div>
              <div className="tf-industry-win">
                <span className="tf-industry-win-arrow">→</span>
                {ind.win}
              </div>
            </div>
            <div className="tf-industry-side">
              <div className="tf-industry-side-label">Lo que incluye</div>
              {ind.features.map(f => (
                <div key={f} className="tf-industry-feature">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#EEF2FF" /><path d="M5 8l2 2 4-4" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section id="funcionalidades" className="tf-section">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('features_badge', 'Funcionalidades')}</span>
            <h2 style={{ marginTop: 16 }}>{c('features_title', 'Todo lo que necesitas, nada de lo que no')}</h2>
            <p>{c('features_subtitle', 'Un sistema diseñado para negocios locales reales, no para corporaciones.')}</p>
          </div>
          <div className="tf-features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="tf-feature-card">
                <div className="tf-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p style={{ marginTop: 8 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="tf-section tf-section-bg">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('how_it_works_badge', 'Cómo funciona')}</span>
            <h2 style={{ marginTop: 16 }}>{c('how_it_works_title', 'De cero a clientes fidelizados en 3 pasos')}</h2>
            <p>{c('how_it_works_subtitle', 'Sin capacitaciones largas, sin consultores, sin integraciones complejas.')}</p>
          </div>
          <div className="tf-how-grid">
            {HOW_STEPS.map((step, i) => (
              <div key={i} className="tf-how-card">
                <div className="tf-how-num">{step.num}</div>
                <div className="tf-how-visual">
                  {step.visual === 'capture' && (
                    <div className="tf-howvis-capture">
                      <div className="tf-howvis-row">
                        <div className="tf-howvis-avatar">M</div>
                        <div className="tf-howvis-input">
                          María Rodríguez<span className="tf-howvis-caret" />
                        </div>
                      </div>
                      <div className="tf-howvis-row">
                        <div className="tf-howvis-avatar" style={{ background: 'linear-gradient(135deg,#A5B4FC,#818CF8)' }}>J</div>
                        <div className="tf-howvis-input">+57 300 123 4567</div>
                      </div>
                      <div className="tf-howvis-tags">
                        <span className="tf-howvis-tag">Frecuente</span>
                        <span className="tf-howvis-tag">Premium</span>
                        <span className="tf-howvis-tag">+ Tag</span>
                      </div>
                    </div>
                  )}
                  {step.visual === 'segment' && (
                    <div style={{ width: '100%' }}>
                      <div className="tf-howvis-bars">
                        {[
                          { h: 90, color: '#4F46E5' },
                          { h: 60, color: '#818CF8' },
                          { h: 40, color: '#A5B4FC' },
                          { h: 70, color: '#F59E0B' },
                          { h: 30, color: '#94A3B8' },
                        ].map((b, j) => (
                          <div key={j} style={{ height: b.h + '%', background: b.color, borderRadius: '4px 4px 0 0' }} />
                        ))}
                      </div>
                      <div className="tf-howvis-seg-labels">
                        <span>Frec.</span><span>Act.</span><span>Nuev.</span><span>Inac.</span><span>VIP</span>
                      </div>
                    </div>
                  )}
                  {step.visual === 'engage' && (
                    <div className="tf-howvis-engage">
                      <div className="tf-howvis-msg">
                        <div className="tf-howvis-msg-from">TurnFlow · WhatsApp</div>
                        <div className="tf-howvis-msg-body">¡Hola María! 🎂 Mañana es tu cumple. Te tenemos un descuento especial...</div>
                      </div>
                      <div className="tf-howvis-checks">
                        <span className="tf-howvis-checks-active">✓ Enviado</span>
                        <span>✓ Entregado</span>
                        <span>✓✓ Leído</span>
                      </div>
                    </div>
                  )}
                </div>
                <h3>{step.title}</h3>
                <p style={{ marginTop: 8, fontSize: 14 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compare ──────────────────────────────────────────────────────────── */}
      <section className="tf-section tf-section-white">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('comparison_badge', 'Comparativa')}</span>
            <h2 style={{ marginTop: 16 }}>{c('comparison_title', 'TurnFlow vs cómo lo hacías antes')}</h2>
            <p>{c('comparison_subtitle', 'Muchos negocios aún gestionan clientes con Excel, WhatsApp o de memoria. Mira la diferencia.')}</p>
          </div>
          <div className="tf-cmp-table-wrap">
            <table className="tf-cmp-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Funcionalidad</th>
                  <th className="tf-cmp-th-tf">
                    <div><span className="tf-cmp-th-mark">TF</span></div>
                    TurnFlow
                  </th>
                  <th>Excel / Sheets</th>
                  <th>WhatsApp</th>
                  <th>Nada</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(row => (
                  <tr key={row.feature}>
                    <td className="tf-cmp-feature">{row.feature}</td>
                    <td className="tf-cmp-tf"><TfCmpCell val={row.tf} /></td>
                    <td><CmpCell val={row.excel} /></td>
                    <td><CmpCell val={row.wp} /></td>
                    <td><CmpCell val={row.nada} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ROI Calculator ───────────────────────────────────────────────────── */}
      <section id="roi" className="tf-section tf-section-bg">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('roi_badge', 'Calculadora ROI')}</span>
            <h2 style={{ marginTop: 16 }}>{c('roi_title', '¿Cuánto dinero estás dejando ir?')}</h2>
            <p>{c('roi_subtitle', 'Ajusta los números de tu negocio y ve cuánto podrías recuperar con TurnFlow.')}</p>
          </div>
          <div className="tf-roi-card">
            <div className="tf-roi-inputs">
              {/* Slider 1: clients */}
              <div className="tf-roi-input">
                <div className="tf-roi-input-label">
                  <span>Clientes activos</span>
                  <span className="tf-roi-input-value">{clients}</span>
                </div>
                <input
                  type="range" min={50} max={2000} step={50} value={clients}
                  onChange={e => setClients(Number(e.target.value))}
                />
                <div className="tf-roi-input-range"><span>50</span><span>2.000</span></div>
              </div>

              {/* Slider 2: ticket */}
              <div className="tf-roi-input">
                <div className="tf-roi-input-label">
                  <span>Ticket promedio</span>
                  <span className="tf-roi-input-value">${(ticket / 1000).toFixed(0)}k</span>
                </div>
                <input
                  type="range" min={5000} max={200000} step={5000} value={ticket}
                  onChange={e => setTicket(Number(e.target.value))}
                />
                <div className="tf-roi-input-range"><span>$5k</span><span>$200k</span></div>
              </div>

              {/* Slider 3: inactive rate */}
              <div className="tf-roi-input">
                <div className="tf-roi-input-label">
                  <span>% clientes inactivos</span>
                  <span className="tf-roi-input-value">{inactiveRate}%</span>
                </div>
                <input
                  type="range" min={5} max={60} step={5} value={inactiveRate}
                  onChange={e => setInactiveRate(Number(e.target.value))}
                />
                <div className="tf-roi-input-range"><span>5%</span><span>60%</span></div>
              </div>
            </div>

            <div className="tf-roi-result">
              <div className="tf-roi-result-label">Recuperación mensual estimada</div>
              <div className="tf-roi-result-value">
                <span className="tf-roi-amount">{fmt(monthly)}</span>
                <span className="tf-roi-period">/ mes</span>
              </div>
              <div className="tf-roi-divider" />
              <div className="tf-roi-yearly">
                <span>Recuperación anual</span>
                <strong>{fmt(yearly)}</strong>
              </div>
              <div className="tf-roi-breakdown">
                <div className="tf-roi-bd-item">
                  <span className="tf-roi-bd-dot" />
                  {inactiveClients} clientes inactivos identificados
                </div>
                <div className="tf-roi-bd-item">
                  <span className="tf-roi-bd-dot" />
                  {recovered} reactivados (18% tasa de retorno)
                </div>
                <div className="tf-roi-bd-item">
                  <span className="tf-roi-bd-dot" />
                  ×1.4 multiplicador de frecuencia con recordatorios
                </div>
              </div>
              <div className="tf-roi-disclaimer">
                Estimación basada en datos promedio de clientes TurnFlow. Los resultados varían según industria.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cases ────────────────────────────────────────────────────────────── */}
      <section className="tf-section tf-section-white">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('testimonials_badge', 'Casos de éxito')}</span>
            <h2 style={{ marginTop: 16 }}>{c('testimonials_title', 'Negocios reales, resultados reales')}</h2>
            <p>{c('testimonials_subtitle', 'Más de 200 negocios ya usan TurnFlow para recuperar clientes y mejorar su operación.')}</p>
          </div>
          <div className="tf-cases-grid">
            {CASES.map(c => (
              <div key={c.name} className="tf-case-card">
                <div className="tf-case-metric">
                  <div className="tf-case-metric-v">{c.metric}</div>
                  <div className="tf-case-metric-l">{c.metricLabel}</div>
                </div>
                <p className="tf-case-quote">"{c.quote}"</p>
                <div className="tf-case-author">
                  <div className="tf-case-logo">{c.initials}</div>
                  <div>
                    <div className="tf-case-name">{c.name}</div>
                    <div className="tf-case-sector">{c.sector}</div>
                  </div>
                </div>
                <div className="tf-case-person">{c.person}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="precios" className="tf-section tf-section-bg">
        <div className="tf-container">
          <div className="tf-section-head">
            <span className="tf-eyebrow"><span className="tf-eyebrow-dot" />{c('pricing_badge', 'Precios')}</span>
            <h2 style={{ marginTop: 16 }}>{c('pricing_title', 'Simple y transparente')}</h2>
            <p>{c('pricing_subtitle', 'Empieza gratis y escala cuando estés listo. Sin contratos, sin sorpresas.')}</p>
          </div>
          <div className="tf-pricing-grid">
            {/* Free plan */}
            <div className="tf-price-card">
              <div className="tf-price-name">Gratis</div>
              <div className="tf-price-amount">
                <span className="tf-price-currency">$</span>
                0
                <span className="tf-price-suffix">COP</span>
              </div>
              <div className="tf-price-period">Para siempre · sin tarjeta</div>
              <ul className="tf-price-features">
                {FREE_FEATURES.map(f => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <Link href="/register" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'center' }}>
                Empezar gratis
              </Link>
            </div>

            {/* Essential plan */}
            <div className="tf-price-card">
              <div className="tf-price-name">Esencial</div>
              <div className="tf-price-amount">
                <span className="tf-price-currency">$</span>
                29.900
                <span className="tf-price-suffix">/mes</span>
              </div>
              <div className="tf-price-period">Cancela cuando quieras</div>
              <ul className="tf-price-features">
                {ESSENTIAL_FEATURES.map(f => (
                  <li key={f}><CheckIcon />{f}</li>
                ))}
              </ul>
              <Link href="/register" className="tf-btn tf-btn-ghost" style={{ justifyContent: 'center' }}>
                Empezar gratis
              </Link>
            </div>

            {/* Business plan */}
            <div className="tf-price-card tf-price-card-pro">
              <span className="tf-price-badge">Más popular</span>
              <div className="tf-price-name">Negocio</div>
              <div className="tf-price-amount" style={{ color: 'white' }}>
                <span className="tf-price-currency">$</span>
                59.900
                <span className="tf-price-suffix">/mes</span>
              </div>
              <div className="tf-price-period">Cancela cuando quieras</div>
              <ul className="tf-price-features">
                {BUSINESS_FEATURES.map(f => (
                  <li key={f}><CheckIcon dark />{f}</li>
                ))}
              </ul>
              <Link href="/register" className="tf-btn tf-btn-white" style={{ justifyContent: 'center' }}>
                Empezar gratis
              </Link>
            </div>
          </div>

          {/* Enterprise banner */}
          <div className="tf-enterprise-banner">
            <div style={{ flex: 1 }}>
              <div className="tf-price-name" style={{ color: 'var(--indigo-600)', fontWeight: 600 }}>Plan Empresarial</div>
              <h3 style={{ margin: '8px 0', fontSize: 24 }}>Lo construimos a tu necesidad</h3>
              <p style={{ color: 'var(--ink-500)', fontSize: 14, maxWidth: 500 }}>
                Sucursales y usuarios ilimitados, configuración personalizada, integraciones a medida y soporte dedicado.
              </p>
            </div>
            <a href="https://wa.me/573001234567?text=Hola%2C+quiero+información+sobre+el+plan+Empresarial+de+TurnFlow" target="_blank" rel="noopener noreferrer" className="tf-btn tf-btn-indigo tf-btn-lg">
              Solicitar información comercial
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="tf-final">
        <div className="tf-container">
          <div className="tf-final-card">
            <div className="tf-final-bg" />
            <div className="tf-final-content">
              <span className="tf-eyebrow tf-eyebrow-light">
                <span className="tf-eyebrow-dot" />
                {c('cta_badge', 'Empieza hoy')}
              </span>
              <h2 style={{ color: 'white', marginTop: 20, fontSize: 'clamp(28px,4vw,44px)' }}>
                {c('cta_title', 'Tu próximo cliente recurrente')}<br />
                <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 400, color: '#A5B4FC' }}>
                  {c('cta_title_accent', 'ya está esperando que lo llames')}
                </span>
              </h2>
              <p className="tf-final-lead">
                {c('cta_subtitle', 'Únete a más de 200 negocios que ya usan TurnFlow para recuperar clientes y llenar su agenda.')}
              </p>

              {submitted ? (
                <div className="tf-final-success">
                  ✓ <strong>¡Listo!</strong> Te contactamos en menos de 24 horas.
                </div>
              ) : (
                <form
                  className="tf-final-form"
                  onSubmit={e => { e.preventDefault(); if (email) setSubmitted(true) }}
                >
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="tf-btn tf-btn-indigo">
                    Empezar gratis
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </form>
              )}

              <div className="tf-final-trust">
                <span>✓ Sin tarjeta de crédito</span>
                <span>✓ Plan gratis para siempre</span>
                <span>✓ Soporte en español</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="tf-footer">
        <div className="tf-container">
          <div className="tf-footer-grid">
            <div>
              <a href="#" className="tf-brand" style={{ marginBottom: 16, display: 'inline-flex' }}>
                <div className="tf-brand-mark">
                  <svg width="16" height="16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4.4" width="20" height="3.5" rx="1.75" fill="white"/>
                    <rect x="12.25" y="4.4" width="3.5" height="15" rx="1.75" fill="white"/>
                    <circle cx="5.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                    <circle cx="12.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                    <circle cx="19.2" cy="21.2" r="2.2" fill="white" fillOpacity="0.65"/>
                  </svg>
                </div>
                TurnFlow
              </a>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, maxWidth: 240, marginTop: 12 }}>
                {c('footer_tagline', 'El CRM simple para negocios locales que quieren crecer con sus clientes.')}
              </p>
            </div>
            <div>
              <div className="tf-footer-h">Producto</div>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#precios">Precios</a>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#roi">Calculadora ROI</a>
            </div>
            <div>
              <div className="tf-footer-h">Industrias</div>
              <a href="#industrias">Farmacias</a>
              <a href="#industrias">Peluquerías</a>
              <a href="#industrias">Restaurantes</a>
              <a href="#industrias">Tiendas</a>
              <a href="#industrias">Spas</a>
            </div>
            <div>
              <div className="tf-footer-h">Empresa</div>
              <a href="/login">Iniciar sesión</a>
              <Link href="/register">Empezar gratis</Link>
              <a href="mailto:hola@turnflow.com.co">Contacto</a>
            </div>
          </div>
          <div className="tf-footer-bottom">
            <span>© 2025 TurnFlow. Todos los derechos reservados.</span>
            <span>Hecho con ♥ en Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
