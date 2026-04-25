'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  Clock, Users, Monitor, BarChart2, MessageSquare, CheckCircle,
  ChevronRight, Menu, X, Star, Zap, Shield, Globe, Tag,
} from 'lucide-react'
import { PRICING_COP, formatCurrency } from '@/lib/billing-cop'

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-indigo-600 tracking-tight">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Clock size={16} className="text-white" />
          </div>
          TurnFlow
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#funcionalidades" className="hover:text-indigo-600 transition-colors">Funcionalidades</a>
          <a href="#como-funciona" className="hover:text-indigo-600 transition-colors">Cómo funciona</a>
          <a href="#precios" className="hover:text-indigo-600 transition-colors">Precios</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Iniciar sesión
          </Link>
          <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow" className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            Solicitar acceso
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(v => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-medium">
          <a href="#funcionalidades" onClick={() => setOpen(false)} className="py-2 text-gray-700">Funcionalidades</a>
          <a href="#como-funciona" onClick={() => setOpen(false)} className="py-2 text-gray-700">Cómo funciona</a>
          <a href="#precios" onClick={() => setOpen(false)} className="py-2 text-gray-700">Precios</a>
          <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
            <Link href="/login" className="py-2.5 text-center text-gray-700 border border-gray-200 rounded-xl">Iniciar sesión</Link>
            <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow" className="py-2.5 text-center font-semibold bg-indigo-600 text-white rounded-xl">Solicitar acceso</a>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 text-center bg-gradient-to-b from-emerald-50/60 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Gestión integral de clientes · Nunca pierdas una oportunidad
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
          Gestiona tus clientes,<br />
          <span className="text-emerald-600">crece tu negocio</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Nunca más pierdas un cliente por falta de seguimiento. Ten todo su historial de compras, visitas, intereses y recordatorios en un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
            Solicitar acceso <ChevronRight size={18} />
          </a>
          <a href="#como-funciona"
            className="w-full sm:w-auto px-8 py-3.5 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-center">
            Ver cómo funciona
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">Escríbenos y te configuramos la plataforma en menos de 24 horas</p>
      </div>

      {/* Mock preview */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl shadow-emerald-100 border border-gray-100 overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm">Panel de Clientes — Farmacia Central</span>
            </div>
            <span className="text-emerald-200 text-xs font-medium">● Actualizado</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'María Rodríguez', last: 'Ayer', tags: 'Cliente frecuente', note: '5 compras este mes', color: 'emerald' },
              { name: 'Juan Pérez', last: 'Hace 15 días', tags: 'Inactivo', note: 'Compró medicinas', color: 'amber' },
              { name: 'Laura González', last: 'Hace 1 mes', tags: 'Cumpleaños (5 feb)', note: 'Premium', color: 'gray' },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl border-2 p-4 ${i === 0 ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold ${i === 0 ? 'text-emerald-700' : 'text-gray-600'}`}>{c.name}</span>
                  {i === 0 && <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-medium">Hoy</span>}
                </div>
                <p className="text-xs text-gray-500 mb-2">Última visita: {c.last}</p>
                <p className="text-xs font-medium text-gray-700 mb-1">{c.tags}</p>
                <p className="text-xs text-gray-400">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const items = [
    { value: '< 5 min', label: 'Configuración inicial' },
    { value: '100%', label: 'Desde el celular' },
    { value: '0 papel', label: 'Proceso 100% digital' },
    { value: 'Tiempo real', label: 'Pantalla de llamado' },
  ]
  return (
    <section className="bg-indigo-600 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-indigo-200 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon: Users,
      title: 'Directorio completo de clientes',
      desc: 'Centraliza toda la información: teléfono, canal de contacto, intereses, historial de compras y visitas. Todo en un único lugar accesible.',
    },
    {
      icon: BarChart2,
      title: 'Historial y análisis',
      desc: 'Registra cada interacción, compra y visita. Entiende patrones de comportamiento, identifica oportunidades de venta y seguimiento.',
    },
    {
      icon: Tag,
      title: 'Segmentación con etiquetas',
      desc: 'Organiza clientes con etiquetas personalizadas: "Cliente frecuente", "Inactivo", "Premium", "Debe volver en 30 días".',
    },
    {
      icon: MessageSquare,
      title: 'Recordatorios automáticos',
      desc: 'Cumpleaños, aniversarios, compras pendientes. Envía recordatorios por WhatsApp, email o SMS. Nunca olvides un cliente importante.',
    },
    {
      icon: Clock,
      title: 'Cola de espera digital (add-on)',
      desc: 'Opcional: Clientes toman turnos por QR, ven su posición en tiempo real. Panel TV y reportes de espera incluidos.',
    },
    {
      icon: Globe,
      title: 'Multi-sucursal ilimitada',
      desc: 'Gestiona múltiples sedes con un único panel. Cada sucursal con sus clientes, configuración y equipo independientes.',
    },
  ]
  return (
    <section id="funcionalidades" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Una plataforma integral</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Todas las herramientas para no perder nunca un cliente y hacer crecer tu negocio.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <f.icon size={20} className="text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Registra cada cliente',
      desc: 'Cada vez que alguien entra a tu tienda, toma un turno o hace una compra, TurnFlow registra su información. Teléfono, intereses, historial — todo automático.',
    },
    {
      n: '02',
      title: 'Analiza y segmenta',
      desc: 'Entiende quiénes son tus clientes frecuentes, quién está inactivo, cuáles gastaron más. Crea etiquetas para segmentar y estrategias claras.',
    },
    {
      n: '03',
      title: 'No pierdas oportunidades',
      desc: 'Envía recordatorios de cumpleaños, recompras pendientes, ofertas especiales. Mantén a tus clientes comprometidos y aumenta la lealtad.',
    },
  ]
  return (
    <section id="como-funciona" className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Cómo funciona</h2>
          <p className="text-gray-500">Tres pasos para convertir visitantes en clientes leales.</p>
        </div>
        <div className="flex flex-col gap-8">
          {steps.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 flex gap-6 items-start">
              <div className="text-3xl font-black text-indigo-100 shrink-0 w-12 text-center">{s.n}</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const p = PRICING_COP
  return (
    <section id="precios" className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Planes simples y transparentes</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Clientes es gratis y para siempre. Las colas digitales y reportes avanzados son un módulo opcional.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Gratuito */}
          <div className="border-2 border-emerald-200 rounded-2xl p-7 flex flex-col bg-emerald-50/50">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">Para empezar</p>
            <p className="text-4xl font-black text-gray-900">Gratis</p>
            <p className="text-sm text-gray-400 mt-0.5 mb-5">para siempre</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                '✓ Módulo Clientes completo',
                '✓ 1 sucursal incluida',
                '✓ 2 usuarios incluidos',
                '✓ Cola de espera lite (QR)',
                '✓ Historial de clientes',
                '✓ Tags y recordatorios',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-100 transition-colors">
              Comienza ahora
            </Link>
          </div>

          {/* Plan Profesional */}
          <div className="border-2 border-indigo-500 rounded-2xl p-7 flex flex-col shadow-lg shadow-indigo-100 relative">
            <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Recomendado
            </div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Profesional</p>
            <p className="text-4xl font-black text-gray-900">Plan base</p>
            <p className="text-sm text-gray-400 mt-0.5 mb-5">+ colas y reportes avanzados</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                '✓ Todo del plan gratuito',
                '✓ Panel de asesores en tiempo real',
                '✓ Pantalla TV de llamado',
                '✓ Reportes de espera y analítica',
                '✓ Múltiples sucursales',
                '✓ Soporte prioritario',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-indigo-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow%20Profesional"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              Solicitar demo
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">Precios incluyen IVA · Facturación mensual en COP · Sin permanencia</p>
      </div>
    </section>
  )
}

// ─── Testimonial / Social proof ───────────────────────────────────────────────
function SocialProof() {
  return (
    <section className="py-16 px-4 bg-emerald-600">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-yellow-300 fill-yellow-300" />)}
        </div>
        <blockquote className="text-xl font-semibold text-white mb-4 leading-relaxed">
          &ldquo;Aumentamos las compras recurrentes en un 35% simplemente haciendo seguimiento inteligente con recordatorios de cumpleaños y recompras. Fue más fácil que esperábamos.&rdquo;
        </blockquote>
        <p className="text-emerald-200 text-sm">— Gerente comercial, cadena de tiendas, Medellín</p>
      </div>
    </section>
  )
}

// ─── CTA final ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-20 px-4 bg-white text-center">
      <div className="max-w-2xl mx-auto">
        <Shield size={32} className="text-indigo-300 mx-auto mb-4" />
        <h2 className="text-3xl font-black text-gray-900 mb-4">¿Listo para transformar la atención de tus clientes?</h2>
        <p className="text-gray-500 mb-8">
          Escríbenos y te configuramos la plataforma en menos de 24 horas.
          La primera sucursal es gratis, sin tarjeta de crédito, sin compromiso.
        </p>
        <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow"
          className="inline-flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-base">
          Solicitar acceso <ChevronRight size={20} />
        </a>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-black text-lg text-indigo-600">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Clock size={13} className="text-white" />
          </div>
          TurnFlow
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link href="/login" className="hover:text-gray-800">Iniciar sesión</Link>
          <a href="mailto:hola@turnflow.com.co" className="hover:text-gray-800">Contacto</a>
          <a href="#precios" className="hover:text-gray-800">Precios</a>
        </div>
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} TurnFlow · Colombia · IVA incluido
        </p>
      </div>
    </footer>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Pricing />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
