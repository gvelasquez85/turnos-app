'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas')
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
          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  )
}
