'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback_error') {
      setError('El enlace expiró o es inválido. Solicita uno nuevo.')
    }
    if (searchParams.get('message') === 'password_updated') {
      setInfo('Contraseña actualizada. Ya puedes ingresar.')
    }
    if (searchParams.get('message') === 'reset_sent') {
      setInfo('Te enviamos un correo con el enlace para restablecer tu contraseña.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('email not confirmed')) {
        setError('Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.')
      } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        setError('Correo o contraseña incorrectos. Si es tu primera vez, usa "Olvidé mi contraseña" para crearla.')
      } else if (msg.includes('too many requests')) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      } else {
        setError(`Error: ${authError.message}`)
      }
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4">T</div>
          <h1 className="text-2xl font-bold text-gray-900">TurnosApp</h1>
          <p className="text-gray-500 text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <Input
            id="email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <Input
              id="password"
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Olvidé mi contraseña
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {info}
            </div>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
