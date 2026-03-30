'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, User, Edit2 } from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'

type ProfileWithRels = Profile & { brands: { name: string } | null; establishments: { name: string } | null }
const roles: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'brand_admin', label: 'Admin de Marca' },
  { value: 'advisor', label: 'Asesor' },
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

  const filteredEsts = form.brand_id ? establishments.filter(e => e.brand_id === form.brand_id) : establishments

  function openNew() { setEditing(null); setForm({ email: '', password: '', full_name: '', role: 'advisor', brand_id: '', establishment_id: '' }); setError(''); setShowForm(true) }
  function openEdit(u: ProfileWithRels) { setEditing(u); setForm({ email: u.email, password: '', full_name: u.full_name || '', role: u.role, brand_id: u.brand_id || '', establishment_id: u.establishment_id || '' }); setError(''); setShowForm(true) }

  async function handleSave() {
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (editing) {
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
    } else {
      // Create user via Supabase Auth (admin API not available from client, use signup)
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: form.role } }
      })
      if (signupErr || !data.user) { setError(signupErr?.message || 'Error al crear usuario'); setLoading(false); return }
      // Update profile with brand/establishment
      await supabase.from('profiles').update({
        role: form.role,
        brand_id: form.brand_id || null,
        establishment_id: form.establishment_id || null,
      }).eq('id', data.user.id)
      // Reload page to show new user
      window.location.reload()
      return
    }
    setShowForm(false); setLoading(false)
  }

  const roleColors: Record<UserRole, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    brand_admin: 'bg-blue-100 text-blue-700',
    advisor: 'bg-gray-100 text-gray-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Rol</label>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole, brand_id: '', establishment_id: '' }))}>
                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {form.role !== 'superadmin' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Marca</label>
                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value, establishment_id: '' }))}>
                  <option value="">Sin marca</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {form.role === 'advisor' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Establecimiento</label>
                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={form.establishment_id} onChange={e => setForm(f => ({ ...f, establishment_id: e.target.value }))}>
                  <option value="">Sin establecimiento</option>
                  {filteredEsts.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
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
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role]}`}>
              {roles.find(r => r.value === u.role)?.label}
            </span>
            <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Edit2 size={14} /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}
