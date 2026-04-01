'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { User, Lock, Check, AlertCircle, Store } from 'lucide-react'

interface Props {
  userId: string
  fullName: string
  email: string
  role?: string
  currentEstablishmentId?: string | null
  establishments?: { id: string; name: string }[]
}

export function ProfileSettings({ userId, fullName, email: initialEmail, role, currentEstablishmentId, establishments = [] }: Props) {
  const showEstPicker = (role === 'advisor' || role === 'manager') && establishments.length > 0
  const [tab, setTab] = useState<'info' | 'password' | 'sucursal'>('info')

  // Info tab
  const [name, setName] = useState(fullName)
  const [email, setEmail] = useState(initialEmail)
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg, setInfoMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Password tab
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Sucursal tab
  const [selectedEst, setSelectedEst] = useState(currentEstablishmentId || '')
  const [estSaving, setEstSaving] = useState(false)
  const [estMsg, setEstMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSaveInfo() {
    setInfoSaving(true)
    setInfoMsg(null)
    const supabase = createClient()

    if (email !== initialEmail) {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) { setInfoMsg({ type: 'err', text: error.message }); setInfoSaving(false); return }
    }

    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', userId)
    if (error) {
      setInfoMsg({ type: 'err', text: error.message })
    } else {
      setInfoMsg({ type: 'ok', text: email !== initialEmail ? 'Guardado. Revisa tu correo para confirmar el nuevo email.' : 'Cambios guardados.' })
    }
    setInfoSaving(false)
  }

  async function handleChangePassword() {
    setPwdMsg(null)
    if (!newPwd) { setPwdMsg({ type: 'err', text: 'Ingresa la nueva contraseña.' }); return }
    if (newPwd.length < 6) { setPwdMsg({ type: 'err', text: 'La contraseña debe tener al menos 6 caracteres.' }); return }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: 'err', text: 'Las contraseñas no coinciden.' }); return }

    setPwdSaving(true)
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: initialEmail, password: currentPwd })
    if (signInErr) { setPwdMsg({ type: 'err', text: 'Contraseña actual incorrecta.' }); setPwdSaving(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) {
      setPwdMsg({ type: 'err', text: error.message })
    } else {
      setPwdMsg({ type: 'ok', text: 'Contraseña actualizada correctamente.' })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    }
    setPwdSaving(false)
  }

  async function handleSaveEstablishment() {
    setEstSaving(true)
    setEstMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ establishment_id: selectedEst || null })
      .eq('id', userId)
    if (error) {
      setEstMsg({ type: 'err', text: error.message })
    } else {
      setEstMsg({ type: 'ok', text: 'Sucursal actualizada. Los cambios aplican en tu próxima sesión de cola.' })
    }
    setEstSaving(false)
  }

  const TABS = [
    { key: 'info' as const, label: 'Información', icon: User },
    { key: 'password' as const, label: 'Contraseña', icon: Lock },
    ...(showEstPicker ? [{ key: 'sucursal' as const, label: 'Mi sucursal', icon: Store }] : []),
  ]

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Actualiza tu información personal y configuración</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <Input label="Nombre completo" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
          <Input label="Correo electrónico" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          {infoMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${infoMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {infoMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
              {infoMsg.text}
            </div>
          )}
          <div className="pt-1"><Button onClick={handleSaveInfo} loading={infoSaving}>Guardar cambios</Button></div>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <Input label="Contraseña actual" type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
          <Input label="Nueva contraseña" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Mínimo 6 caracteres" />
          <Input label="Confirmar nueva contraseña" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repite la nueva contraseña" />
          {pwdMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${pwdMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {pwdMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
              {pwdMsg.text}
            </div>
          )}
          <div className="pt-1"><Button onClick={handleChangePassword} loading={pwdSaving}>Cambiar contraseña</Button></div>
        </div>
      )}

      {/* Sucursal tab */}
      {tab === 'sucursal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-500">Selecciona la sucursal desde la que atiendes por defecto. Puedes cambiarlo en cualquier momento.</p>
          <Select
            label="Sucursal asignada"
            value={selectedEst}
            onChange={e => setSelectedEst(e.target.value)}
          >
            <option value="">Sin asignación fija</option>
            {establishments.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
          {estMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${estMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {estMsg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
              {estMsg.text}
            </div>
          )}
          <div className="pt-1"><Button onClick={handleSaveEstablishment} loading={estSaving}>Guardar sucursal</Button></div>
        </div>
      )}
    </div>
  )
}
