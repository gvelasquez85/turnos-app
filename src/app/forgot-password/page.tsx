'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <Mail size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Correo enviado</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enviamos las instrucciones a <strong>{email}</strong>. Revisa tu bandeja de entrada y también la carpeta de spam.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              <ArrowLeft size={16} className="mr-2" /> Volver al login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white text-2xl font-bold mb-4">T</div>
          <h1 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Te enviaremos un enlace a tu correo</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <Input
            id="email"
            label="Correo electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <Button type="submit" loading={loading} size="lg" className="w-full">
            Enviar enlace
          </Button>
          <Link href="/login" className="text-center text-sm text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-1">
            <ArrowLeft size={14} /> Volver al login
          </Link>
        </form>
      </div>
    </div>
  )
}
