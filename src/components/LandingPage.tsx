'use client'
import Link from 'next/link'
import { useState } from 'react'
import {
  Clock, Users, Monitor, BarChart2, MessageSquare, CheckCircle,
  ChevronRight, Menu, X, Star, Zap, Shield, Globe,
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
    <section className="pt-32 pb-20 px-4 text-center bg-gradient-to-b from-indigo-50/60 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} /> Gestión de turnos digital · Sin filas presenciales
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
          El turno inteligente<br />
          <span className="text-indigo-600">para tu negocio</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Tus clientes toman turno desde su celular, ven su posición en tiempo real y son llamados cuando llega su momento. Sin papel, sin desorden.
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
        <div className="bg-white rounded-2xl shadow-2xl shadow-indigo-100 border border-gray-100 overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-sm">Panel del asesor — Banco XYZ</span>
            </div>
            <span className="text-indigo-200 text-xs font-medium">● En vivo</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: '014', name: 'Carlos Mendoza', reason: 'Apertura de cuenta', wait: '2 min', color: 'indigo' },
              { num: '015', name: 'Ana Gómez', reason: 'Consulta de saldo', wait: '8 min', color: 'amber' },
              { num: '016', name: 'Luis Torres', reason: 'Préstamo personal', wait: '14 min', color: 'gray' },
            ].map((t, i) => (
              <div key={i} className={`rounded-xl border-2 p-4 ${i === 0 ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-2xl font-black ${i === 0 ? 'text-indigo-700' : 'text-gray-400'}`}>#{t.num}</span>
                  {i === 0 && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Atendiendo</span>}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t.reason}</p>
                <p className="text-xs text-gray-400 mt-2">Espera: ~{t.wait}</p>
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
      icon: Clock,
      title: 'Cola digital en segundos',
      desc: 'El cliente escanea un QR o entra al link. Ingresa su nombre, elige el motivo de visita y ya está en la fila — desde cualquier celular, sin app.',
    },
    {
      icon: Monitor,
      title: 'Pantalla de llamado para TV',
      desc: 'Conecta un televisor o monitor y muestra en tiempo real el turno que está siendo atendido. Diseño personalizable con los colores de tu marca.',
    },
    {
      icon: Users,
      title: 'Panel de asesores',
      desc: 'Cada asesor ve la cola de su sucursal, llama al siguiente, registra la atención y captura datos adicionales con formularios personalizables.',
    },
    {
      icon: BarChart2,
      title: 'Reportes y analítica',
      desc: 'Mide tiempos de espera, volúmenes por hora, rendimiento por asesor y motivos de visita. Todo exportable para tus procesos.',
    },
    {
      icon: MessageSquare,
      title: 'Notificaciones al cliente',
      desc: 'Avisa al cliente por push notification cuando su turno está próximo. Reduce abandonos y mejora la experiencia.',
    },
    {
      icon: Globe,
      title: 'Multi-sucursal',
      desc: 'Gestiona varias sedes desde un solo panel. Cada sucursal tiene su propia cola, asesores y configuración independiente.',
    },
  ]
  return (
    <section id="funcionalidades" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Todo lo que necesitas</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Una plataforma completa para gestionar la atención presencial de tus clientes sin complicaciones.</p>
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
      title: 'El cliente toma su turno',
      desc: 'Escanea el código QR en la entrada, abre el link en su celular o usa el kiosko. Ingresa sus datos y selecciona el motivo de visita. Listo — ya está en la fila.',
    },
    {
      n: '02',
      title: 'Espera donde quiera',
      desc: 'Puede esperar en la sala, en el café de al lado o en su carro. Ve su posición en tiempo real y recibe una notificación cuando es su turno.',
    },
    {
      n: '03',
      title: 'El asesor lo llama y registra',
      desc: 'El asesor ve la cola en su panel, llama al siguiente con un clic y al finalizar registra la atención. Los datos quedan en el historial de reportes.',
    },
  ]
  return (
    <section id="como-funciona" className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-gray-900 mb-3">Cómo funciona</h2>
          <p className="text-gray-500">Simple para el cliente. Poderoso para tu equipo.</p>
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
          <h2 className="text-3xl font-black text-gray-900 mb-3">Precios simples y transparentes</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Sin contratos. Sin cobros ocultos. Pagas solo lo que usas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Gratuito */}
          <div className="border-2 border-gray-200 rounded-2xl p-7 flex flex-col">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Gratuito</p>
            <p className="text-4xl font-black text-gray-900">Gratis</p>
            <p className="text-sm text-gray-400 mt-0.5 mb-5">para siempre</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                '1 sucursal incluida',
                '2 usuarios incluidos',
                'Cola digital con QR',
                'Panel de asesores',
                'Pantalla TV',
                'Reportes básicos',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-indigo-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/login"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors">
              Iniciar sesión
            </Link>
          </div>

          {/* Plan Por uso */}
          <div className="border-2 border-indigo-500 rounded-2xl p-7 flex flex-col shadow-lg shadow-indigo-100 relative">
            <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Pago por uso
            </div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Por sucursal adicional</p>
            <p className="text-4xl font-black text-gray-900">{formatCurrency(p.perEstablishment, 'COP')}</p>
            <p className="text-sm text-gray-400 mt-0.5 mb-5">por sucursal / mes</p>
            <ul className="flex flex-col gap-3 mb-8 flex-1">
              {[
                '2 usuarios incluidos por sucursal',
                `${formatCurrency(p.perAdditionalAdvisor, 'COP')} por usuario adicional / mes`,
                'Todo lo del plan gratuito',
                'Múltiples sucursales',
                'Reportes avanzados',
                'Soporte prioritario',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-indigo-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <a href="mailto:hola@turnflow.com.co?subject=Quiero%20conocer%20TurnFlow"
              className="w-full py-3 rounded-xl font-semibold text-sm text-center bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              Solicitar acceso
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
    <section className="py-16 px-4 bg-indigo-600">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} size={18} className="text-yellow-300 fill-yellow-300" />)}
        </div>
        <blockquote className="text-xl font-semibold text-white mb-4 leading-relaxed">
          &ldquo;Redujimos el tiempo de espera percibido en un 40% solo con mostrarle al cliente su posición en la cola. La implementación tardó menos de una hora.&rdquo;
        </blockquote>
        <p className="text-indigo-200 text-sm">— Gerente de operaciones, red de farmacias, Bogotá</p>
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
