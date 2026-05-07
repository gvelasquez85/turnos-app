'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle, Mail, User, Lock, ArrowRight } from 'lucide-react'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Al menos 8 caracteres', ok: password.length >= 8 },
    { label: 'Una letra mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const color = score === 0 ? 'bg-gray-200' : score === 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-green-500'
  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="space-y-0.5">
        {checks.map(c => (
          <p key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${c.ok ? 'bg-green-500' : 'bg-gray-200'}`} />
            {c.label}
          </p>
        ))}
      </div>
    </div>
  )
}

function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [showCfm, setShowCfm]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim())        return setError('Ingresa tu nombre completo.')
    if (password.length < 6)     return setError('La contraseña debe tener al menos 6 caracteres.')
    if (password !== confirm)    return setError('Las contraseñas no coinciden.')

    setLoading(true)
    const supabase = createClient()
    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim(), role: 'brand_admin' },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (authError) {
      setLoading(false)
      const msg = authError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already registered')) {
        setError('Ya existe una cuenta con ese correo. Intenta iniciar sesión o recupera tu contraseña.')
      } else if (msg.includes('invalid email')) {
        setError('El correo ingresado no es válido.')
      } else {
        setError(`Error: ${authError.message}`)
      }
      return
    }

    // Send branded confirmation email via Brevo (bypasses Supabase's own mailer)
    await fetch('/api/auth/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: fullName.trim() }),
    })

    setLoading(false)
    setSuccess(true)
  }

  /* ── Éxito: correo enviado ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Enviamos un enlace de activación a{' '}
            <span className="font-semibold text-gray-700">{email}</span>.
            <br/>Haz clic en él para activar tu cuenta y comenzar.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
            <p className="text-sm font-medium text-blue-800 mb-2">¿No ves el correo?</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Revisa spam o correo no deseado</li>
              <li>• Puede tardar 1–2 minutos</li>
              <li>• El enlace expira en 24 horas</li>
            </ul>
          </div>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline font-medium">
            Ir a inicio de sesión <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  /* ── Formulario ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect x="10" y="11" width="20" height="3.5" rx="1.75" fill="white"/>
                <rect x="18.25" y="11" width="3.5" height="15" rx="1.75" fill="white"/>
                <circle cx="13" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
                <circle cx="20" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
                <circle cx="27" cy="32" r="2.2" fill="white" fillOpacity="0.65"/>
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Crea tu cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Gratis — sin tarjeta de crédito</p>
        </div>

        {/* Beneficios */}
        <div className="flex items-center justify-center gap-4 mb-5 flex-wrap">
          {['Gratis para siempre', 'Sin tarjeta', 'Cancela cuando quieras'].map(b => (
            <span key={b} className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle size={11} className="text-green-500" /> {b}
            </span>
          ))}
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="text" placeholder="Juan Pérez" value={fullName}
                onChange={e => setFullName(e.target.value)} required autoComplete="name"
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-300 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="email" placeholder="tu@empresa.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email"
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-300 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="new-password"
                className="w-full h-11 pl-9 pr-10 rounded-xl border border-gray-300 text-sm placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showCfm ? 'text' : 'password'} placeholder="Repite tu contraseña"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                required autoComplete="new-password"
                className={`w-full h-11 pl-9 pr-10 rounded-xl border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  confirm && confirm !== password ? 'border-red-300' :
                  confirm && confirm === password ? 'border-green-400' :
                  'border-gray-300 focus:border-indigo-500'
                }`}
              />
              <button type="button" onClick={() => setShowCfm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCfm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Términos */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Al registrarte aceptas nuestros{' '}
            <a href="#" className="text-indigo-500 hover:underline">Términos de uso</a>
            {' '}y{' '}
            <a href="#" className="text-indigo-500 hover:underline">Política de privacidad</a>.
          </p>

          {/* Botón */}
          <button type="submit" disabled={loading}
            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando cuenta...</>
              : <>Crear cuenta gratis <ArrowRight size={14} /></>
            }
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
