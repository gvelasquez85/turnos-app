'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Plus, Edit2, KeyRound, MailCheck, User, Trash2, AlertTriangle } from 'lucide-react'
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

  // Eliminar
  const [deleteConfirm, setDeleteConfirm] = useState<ProfileRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Selección masiva
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  // brand_admin no cuenta para el límite del plan
  const teamCount = users.filter(u => u.role !== 'brand_admin').length
  // Solo los no-brand_admin son seleccionables
  const selectableUsers = users.filter(u => u.role !== 'brand_admin')

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleSelectAll() {
    if (selected.size === selectableUsers.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectableUsers.map(u => u.id)))
    }
  }

  function openNew() {
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

    if (!editing && maxAdvisors !== undefined && teamCount >= maxAdvisors) {
      setError(`Tu plan permite hasta ${maxAdvisors} usuario${maxAdvisors === 1 ? '' : 's'} (el administrador no cuenta). Actualiza tu membresía en Mi marca → Membresía.`)
      setLoading(false)
      return
    }

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

  async function handleDelete() {
    if (!deleteConfirm) return
    setDeleteLoading(true); setDeleteError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_user', userId: deleteConfirm.id }),
    })
    const json = await res.json()
    setDeleteLoading(false)
    if (!res.ok) { setDeleteError(json.error); return }
    setUsers(us => us.filter(u => u.id !== deleteConfirm.id))
    setSelected(s => { const n = new Set(s); n.delete(deleteConfirm.id); return n })
    setDeleteConfirm(null)
  }

  async function handleBulkDelete() {
    setBulkLoading(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_users_bulk', userIds: Array.from(selected) }),
    })
    const json = await res.json()
    setBulkLoading(false)
    if (!res.ok) { setDeleteError(json.error); setBulkDeleteConfirm(false); return }
    setUsers(us => us.filter(u => !selected.has(u.id)))
    setSelected(new Set())
    setBulkDeleteConfirm(false)
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
          <h1 className="text-xl font-bold text-gray-900">
            Equipo
            <span className="ml-1 text-sm font-normal text-gray-400">
              ({teamCount}{maxAdvisors !== undefined ? `/${maxAdvisors}` : ''})
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Asesores, managers y usuarios de reportes</p>
        </div>
        <Button
          onClick={openNew}
          disabled={maxAdvisors !== undefined && teamCount >= maxAdvisors}
          title={maxAdvisors !== undefined && teamCount >= maxAdvisors
            ? `Límite de ${maxAdvisors} usuario${maxAdvisors === 1 ? '' : 's'} alcanzado`
            : undefined}
        >
          <Plus size={16} className="mr-1" /> Nuevo usuario
        </Button>
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

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} usuario{selected.size === 1 ? '' : 's'} seleccionado{selected.size === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>Cancelar</Button>
            <Button size="sm" onClick={() => { setBulkDeleteConfirm(true); setDeleteError('') }}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              <Trash2 size={13} className="mr-1" /> Eliminar seleccionados
            </Button>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4">
          {deleteError}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Select-all row */}
        {selectableUsers.length > 0 && (
          <div className="flex items-center gap-3 px-1 mb-1">
            <input
              type="checkbox"
              checked={selected.size === selectableUsers.length && selectableUsers.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400">
              {selected.size === selectableUsers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </div>
        )}

        {users.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            No hay usuarios en esta marca todavía.
          </div>
        )}
        {users.map(u => (
          <div key={u.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-colors ${selected.has(u.id) ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200'}`}>
            {/* Checkbox (only for non-admin) */}
            {u.role !== 'brand_admin' ? (
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                onChange={() => toggleSelect(u.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
              />
            ) : (
              <div className="w-4 shrink-0" />
            )}

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
                <Button size="sm" variant="ghost" title="Eliminar usuario"
                  onClick={() => { setDeleteConfirm(u); setDeleteError('') }}
                  className="text-gray-300 hover:text-red-500">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

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

      {/* Modal eliminar individual */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar usuario</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-medium text-gray-900 text-sm">{deleteConfirm.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-gray-500">{deleteConfirm.email}</p>
            </div>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <Button loading={deleteLoading} onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1">
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar masivo */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar {selected.size} usuario{selected.size === 1 ? '' : 's'}</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
              {users.filter(u => selected.has(u.id)).map(u => (
                <p key={u.id} className="text-xs text-gray-600 py-0.5">{u.full_name || u.email}</p>
              ))}
            </div>
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <Button loading={bulkLoading} onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600 flex-1">
                Eliminar todos
              </Button>
              <Button variant="secondary" onClick={() => setBulkDeleteConfirm(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
