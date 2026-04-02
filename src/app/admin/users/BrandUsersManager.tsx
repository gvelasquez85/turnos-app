'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Edit2, KeyRound, MailCheck, User, UserPlus } from 'lucide-react'
import type { UserRole } from '@/types/database'

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  brand_id: string | null
  establishment_id: string | null
  establishments: { name: string } | null
}

// Roles que brand_admin puede crear dentro de su marca
const BRAND_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'advisor', label: 'Agente', description: 'Atiende la cola de espera' },
  { value: 'manager', label: 'Manager', description: 'Configura sucursales, motivos y promociones' },
  { value: 'reporting', label: 'Reporting', description: 'Solo accede a reportes' },
]

const roleColors: Partial<Record<UserRole, string>> = {
  advisor: 'bg-green-100 text-green-700',
  manager: 'bg-blue-100 text-blue-700',
  reporting: 'bg-amber-100 text-amber-700',
  brand_admin: 'bg-indigo-100 text-indigo-700',
}

export function BrandUsersManager({
  users: initial,
  establishments,
  brandId,
  maxAdvisors,
}: {
  users: ProfileRow[]
  establishments: { id: string; name: string }[]
  brandId: string
  maxAdvisors?: number
}) {
  const [users, setUsers] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProfileRow | null>(null)
  const [form, setForm] = useState({
    email: '', password: '', full_name: '',
    role: 'advisor' as UserRole,
    establishment_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal contraseña
  const [pwModal, setPwModal] = useState<{ userId: string; email: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Verificación
  const [verifyLoadingId, setVerifyLoadingId] = useState<string | null>(null)
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null)

  // Reclamar usuario huérfano
  const [claimModal, setClaimModal] = useState(false)
  const [claimEmail, setClaimEmail] = useState('')
  const [claimRole, setClaimRole] = useState<UserRole>('advisor')
  const [claimEstId, setClaimEstId] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState('')

  function openNew() {
    if (maxAdvisors !== undefined && users.length >= maxAdvisors) {
      setError(`Tu plan permite hasta ${maxAdvisors} usuario${maxAdvisors === 1 ? '' : 's'}. Actualiza tu membresía en Mi marca → Membresía.`)
      setShowForm(true)
      setEditing(null)
      return
    }
    setEditing(null)
    setForm({ email: '', password: '', full_name: '', role: 'advisor', establishment_id: '' })
    setError('')
    setShowForm(true)
  }

  function openEdit(u: ProfileRow) {
    setEditing(u)
    setForm({ email: u.email, password: '', full_name: u.full_name || '', role: u.role, establishment_id: u.establishment_id || '' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setError(''); setLoading(true)

    if (editing) {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          userId: editing.id,
          full_name: form.full_name,
          role: form.role,
          brand_id: brandId,
          establishment_id: form.establishment_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setLoading(false); return }
      setUsers(us => us.map(u => u.id === editing.id ? {
        ...u,
        full_name: form.full_name,
        role: form.role,
        establishment_id: form.establishment_id || null,
        establishments: establishments.find(e => e.id === form.establishment_id) ?? null,
      } : u))
      setShowForm(false)
    } else {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
          brand_id: brandId,
          establishment_id: form.establishment_id || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setLoading(false); return }
      window.location.reload()
      return
    }
    setLoading(false)
  }

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

  async function handleClaim() {
    setClaimError(''); setClaimLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'claim_user',
        email: claimEmail.trim(),
        brand_id: brandId,
        role: claimRole,
        establishment_id: claimEstId || null,
      }),
    })
    const json = await res.json()
    setClaimLoading(false)
    if (!res.ok) { setClaimError(json.error); return }
    setClaimModal(false)
    setClaimEmail(''); setClaimRole('advisor'); setClaimEstId('')
    window.location.reload()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Equipo <span className="ml-1 text-sm font-normal text-gray-400">({users.length})</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">Asesores, managers y usuarios de reportes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setClaimModal(true); setClaimError(''); setClaimEmail(''); setClaimRole('advisor'); setClaimEstId('') }}>
            <UserPlus size={16} className="mr-1" /> Reclamar existente
          </Button>
          <Button onClick={openNew}><Plus size={16} className="mr-1" /> Nuevo usuario</Button>
        </div>
      </div>

      {/* Leyenda de roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {BRAND_ROLES.map(r => (
          <div key={r.value} className="bg-white rounded-xl border border-gray-200 p-3 flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 shrink-0 ${roleColors[r.value]}`}>{r.label}</span>
            <p className="text-xs text-gray-500">{r.description}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Editar' : 'Nuevo'} usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editing && <Input label="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />}
            {!editing && <Input label="Contraseña *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />}
            <Input label="Nombre completo" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <Select
              label="Rol *"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole, establishment_id: '' }))}
            >
              {BRAND_ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.description}</option>)}
            </Select>
            {form.role === 'advisor' && (
              <Select
                label="Sucursal"
                value={form.establishment_id}
                onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}
              >
                <option value="">Sin sucursal asignada</option>
                {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
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
        {users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No hay usuarios en esta marca todavía.
          </div>
        )}
        {users.map(u => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <User size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{u.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
              {u.establishments?.name && (
                <p className="text-xs text-gray-400 mt-0.5">{u.establishments.name}</p>
              )}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
              {BRAND_ROLES.find(r => r.value === u.role)?.label ?? (u.role === 'brand_admin' ? 'Administrador' : u.role)}
            </span>
            {u.role !== 'brand_admin' && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="ghost" title="Cambiar contraseña"
                  onClick={() => { setPwModal({ userId: u.id, email: u.email }); setNewPassword(''); setPwError(''); setPwSuccess(false) }}>
                  <KeyRound size={14} />
                </Button>
                <Button size="sm" variant="ghost"
                  title={verifySuccess === u.id ? '¡Enviado!' : 'Reenviar verificación'}
                  onClick={() => handleResendVerification(u.id, u.email)}>
                  {verifySuccess === u.id
                    ? <MailCheck size={14} className="text-green-600" />
                    : verifyLoadingId === u.id
                      ? <span className="text-xs text-gray-400">...</span>
                      : <MailCheck size={14} />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Edit2 size={14} /></Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal reclamar usuario huérfano */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Reclamar usuario existente</h3>
            <p className="text-sm text-gray-500 mb-4">
              Asocia a tu marca un usuario que ya existe en el sistema pero no está asignado.
            </p>
            <Input label="Email del usuario *" type="email" value={claimEmail}
              onChange={e => setClaimEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
            <div className="mt-3">
              <Select label="Rol *" value={claimRole}
                onChange={e => setClaimRole(e.target.value as UserRole)}>
                {BRAND_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </div>
            {claimRole === 'advisor' && establishments.length > 0 && (
              <div className="mt-3">
                <Select label="Sucursal" value={claimEstId}
                  onChange={e => setClaimEstId(e.target.value)}>
                  <option value="">Sin sucursal asignada</option>
                  {establishments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
              </div>
            )}
            {claimError && <p className="text-sm text-red-600 mt-3">{claimError}</p>}
            <div className="flex gap-3 mt-4">
              <Button loading={claimLoading} onClick={handleClaim}>Asociar a mi marca</Button>
              <Button variant="secondary" onClick={() => setClaimModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal contraseña */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-gray-900 mb-1">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">{pwModal.email}</p>
            <Input label="Nueva contraseña *" type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
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
