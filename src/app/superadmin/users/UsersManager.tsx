'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, User, Edit2, KeyRound, MailCheck } from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'

type ProfileWithRels = Profile & { brands: { name: string } | null; establishments: { name: string } | null }
const roles: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'brand_admin', label: 'Admin de Marca' },
  { value: 'manager', label: 'Manager' },
  { value: 'advisor', label: 'Agente' },
  { value: 'reporting', label: 'Reporting' },
]

export function UsersManager({ users: initial, brands, establishments }: {
  users: ProfileWithRels[]
  brands: { id: string; name: string }[]
  establishments: { id: string; name: string; brand_id: string }[]
}) {
  const [users, setUsers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProfileWithRels | null>(null)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'advisor' as UserRole, brand_id: '', establishment_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal de cambio de contraseña
  const [pwModal, setPwModal] = useState<{ userId: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Estado de envío de verificación
  const [verifyLoadingId, setVerifyLoadingId] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)

  const filteredEsts = form.brand_id ? establishments.filter(e => e.brand_id === form.brand_id) : establishments

  async function handleSetPassword() {
    if (!pwModal) return
    setPwError(''); setPwLoading(true); setPwSuccess(false)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_password', userId: pwModal.userId, password: newPassword }),
    })
    const json = await res.json()
    setPwLoading(false)
    if (!res.ok) { setPwError(json.error); return }
    setPwSuccess(true)
    setTimeout(() => { setPwModal(null); setNewPassword(''); setPwSuccess(false) }, 1500)
  }

  async function handleResendVerification(userId: string, email: string) {
    setVerifyLoadingId(userId); setVerifySuccess(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_verification', email }),
    })
    setVerifyLoadingId(null)
    if (res.ok) { setVerifySuccess(userId); setTimeout(() => setVerifySuccess(null), 3000) }
  }

  function openNew() { setEditing(null); setForm({ email: '', password: '', full_name: '', role: 'advisor', brand_id: '', establishment_id: '' }); setError(''); setShowForm(true) }
  function openEdit(u: ProfileWithRels) { setEditing(u); setForm({ email: u.email, password: '', full_name: u.full_name || '', role: u.role, brand_id: u.brand_id || '', establishment_id: u.establishment_id || '' }); setError(''); setShowForm(true) }

  async function handleSave() {
    setError('')
    setLoading(true)

    if (editing) {
      // Editar perfil existente vía cliente (no cambia sesión)
      const supabase = createClient()
      const { error: err } = await supabase.from('profiles').update({
        full_name: form.full_name,
        role: form.role,
        brand_id: form.brand_id || null,
        establishment_id: form.establishment_id || null,
      }).eq('id', editing.id)
      if (err) { setError(err.message); setLoading(false); return }
      setUsers(us => us.map(u => u.id === editing.id ? {
        ...u, full_name: form.full_name, role: form.role,
        brand_id: form.brand_id || null, establishment_id: form.establishment_id || null,
      } : u))
      setShowForm(false); setLoading(false)
    } else {
      // Crear usuario vía API (admin.createUser no toca la sesión activa)
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          brand_id: form.brand_id || null,
          establishment_id: form.establishment_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setLoading(false); return }
      // Recargar lista sin perder sesión
      window.location.reload()
    }
  }

  const roleColors: Record<UserRole, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    brand_admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-sky-100 text-sky-700',
    advisor: 'bg-green-100 text-green-700',
    reporting: 'bg-amber-100 text-amber-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios <span className="ml-1 text-sm font-normal text-gray-400">({users.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">Asesores, administradores y superadmins</p>
        </div>
        <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo usuario</Button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editing && <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />}
            {!editing && <Input label="Contraseña *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />}
            <Input label="Nombre completo" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Select label="Rol" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole, brand_id: '', establishment_id: '' }))}>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
            {form.role !== 'superadmin' && (
              <Select label="Marca" value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value, establishment_id: '' }))}>
                <option value="">Sin marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            )}
            {form.role === 'advisor' && (
              <Select label="Sucursal" value={form.establishment_id} onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
                <option value="">Sin establecimiento</option>
                {filteredEsts.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            )}
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <Button loading={loading} onClick={handleSave}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {users.length === 0 && <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No hay usuarios.</div>}
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><User size={18} className="text-gray-500" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{u.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">{u.brands?.name}{u.establishments?.name && ` · ${u.establishments.name}`}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[u.role]}`}>
              {roles.find(r => r.value === u.role)?.label}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm" variant="ghost"
                title="Cambiar contraseña"
                onClick={() => { setPwModal({ userId: u.id, email: u.email }); setNewPassword(''); setPwError(''); setPwSuccess(false) }}
              >
                <KeyRound size={14} />
              </Button>
              <Button
                size="sm" variant="ghost"
                title={verifySuccess === u.id ? '¡Enviado!' : 'Reenviar correo de verificación'}
                onClick={() => handleResendVerification(u.id, u.email)}
              >
                {verifySuccess === u.id
                  ? <MailCheck size={14} className="text-green-600" />
                  : verifyLoadingId === u.id
                    ? <span className="text-xs text-gray-400">...</span>
                    : <MailCheck size={14} />
                }
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Edit2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal cambio de contraseña */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">{pwModal.email}</p>
            <Input
              label="Nueva contraseña *"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            {pwError && <p className="text-sm text-red-600 mt-2">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600 mt-2">✓ Contraseña actualizada</p>}
            <div className="flex gap-3 mt-4">
              <Button loading={pwLoading} onClick={handleSetPassword}>Guardar</Button>
              <Button variant="secondary" onClick={() => setPwModal(null)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
