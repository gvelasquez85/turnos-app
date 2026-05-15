'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Save, Check, Settings, Shield, Key, AlertTriangle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props {
  brandId: string
  config: any | null
  docTypes: { code: string; name: string }[]
  taxResponsibilities: { code: string; name: string }[]
  departments: { code: string; name: string }[]
  municipalities: { code: string; name: string; department_code: string }[]
}

export default function FiscalConfig({ brandId, config, docTypes, taxResponsibilities, departments, municipalities }: Props) {
  const [nit, setNit] = useState(config?.nit ?? '')
  const [dv, setDv] = useState(config?.dv ?? '')
  const [companyName, setCompanyName] = useState(config?.company_name ?? '')
  const [tradeName, setTradeName] = useState(config?.trade_name ?? '')
  const [docType, setDocType] = useState(config?.document_type ?? '31')
  const [taxScheme, setTaxScheme] = useState(config?.tax_scheme_code ?? 'O-13')
  const [selectedResponsibilities, setSelectedResponsibilities] = useState<string[]>(config?.tax_responsibilities ?? [])
  const [ciiu, setCiiu] = useState(config?.ciiu_code ?? '')
  const [address, setAddress] = useState(config?.address ?? '')
  const [departmentCode, setDepartmentCode] = useState(config?.department_code ?? '')
  const [municipalityCode, setMunicipalityCode] = useState(config?.municipality_code ?? '')
  const [postalCode, setPostalCode] = useState(config?.postal_code ?? '')
  const [email, setEmail] = useState(config?.contact_email ?? '')
  const [phone, setPhone] = useState(config?.contact_phone ?? '')
  const [environment, setEnvironment] = useState<string>(config?.environment ?? 'testing')
  const [softwareId, setSoftwareId] = useState(config?.software_id ?? '')
  const [softwarePin, setSoftwarePin] = useState(config?.software_pin ?? '')
  const [testSetId, setTestSetId] = useState(config?.test_set_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filteredMunicipalities = useMemo(() =>
    municipalities.filter(m => m.department_code === departmentCode),
    [municipalities, departmentCode]
  )

  function toggleResponsibility(code: string) {
    setSelectedResponsibilities(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function calculateDV(nitValue: string): string {
    if (!nitValue || nitValue.length < 5) return ''
    const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71]
    const digits = nitValue.split('').reverse().map(Number)
    let sum = 0
    for (let i = 0; i < digits.length && i < primes.length; i++) {
      sum += digits[i] * primes[i]
    }
    const remainder = sum % 11
    if (remainder === 0 || remainder === 1) return String(remainder)
    return String(11 - remainder)
  }

  function handleNitChange(value: string) {
    const clean = value.replace(/\D/g, '')
    setNit(clean)
    setDv(calculateDV(clean))
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    const payload = {
      brand_id: brandId,
      nit,
      dv,
      company_name: companyName,
      trade_name: tradeName || null,
      document_type: docType,
      tax_scheme_code: taxScheme,
      tax_responsibilities: selectedResponsibilities,
      ciiu_code: ciiu || null,
      address,
      department_code: departmentCode,
      municipality_code: municipalityCode,
      postal_code: postalCode || null,
      contact_email: email || null,
      contact_phone: phone || null,
      environment,
      software_id: softwareId || null,
      software_pin: softwarePin || null,
      test_set_id: testSetId || null,
      updated_at: new Date().toISOString(),
    }

    if (config?.id) {
      await supabase.from('fiscal_configs').update(payload).eq('id', config.id)
    } else {
      await supabase.from('fiscal_configs').insert(payload)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputClass = "w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
  const labelClass = "text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1"

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/facturacion" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings size={20} className="text-gray-600" /> Configuración Fiscal
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Datos del emisor para facturación electrónica</p>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Datos de la empresa</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>NIT</label>
            <div className="flex gap-2">
              <input type="text" value={nit} onChange={e => handleNitChange(e.target.value)}
                placeholder="900123456" className={inputClass} maxLength={15} />
              <div className="shrink-0 w-14">
                <input type="text" value={dv} readOnly placeholder="DV"
                  className={`${inputClass} text-center bg-gray-50 dark:bg-gray-700`} />
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Tipo de documento</label>
            <select value={docType} onChange={e => setDocType(e.target.value)} className={inputClass}>
              {docTypes.map(dt => (
                <option key={dt.code} value={dt.code}>{dt.code} — {dt.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Razón social</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.A.S." className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nombre comercial (opcional)</label>
            <input type="text" value={tradeName} onChange={e => setTradeName(e.target.value)}
              placeholder="Mi Tienda" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Código CIIU</label>
            <input type="text" value={ciiu} onChange={e => setCiiu(e.target.value)}
              placeholder="4711" className={inputClass} maxLength={4} />
          </div>
        </div>
      </div>

      {/* Tax info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Información tributaria</p>

        <div>
          <label className={labelClass}>Régimen tributario</label>
          <select value={taxScheme} onChange={e => setTaxScheme(e.target.value)} className={inputClass}>
            <option value="O-13">Régimen común (O-13)</option>
            <option value="O-23">Régimen simple de tributación (O-23)</option>
            <option value="O-47">Régimen especial (O-47)</option>
            <option value="O-49">No responsable de IVA (O-49)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Responsabilidades fiscales</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {taxResponsibilities.map(tr => (
              <label key={tr.code} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={selectedResponsibilities.includes(tr.code)}
                  onChange={() => toggleResponsibility(tr.code)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400" />
                <span className="text-xs">{tr.code} — {tr.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Dirección</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>Dirección</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Calle 123 # 45-67" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Departamento</label>
            <select value={departmentCode} onChange={e => { setDepartmentCode(e.target.value); setMunicipalityCode('') }}
              className={inputClass}>
              <option value="">Seleccionar...</option>
              {departments.map(d => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Municipio</label>
            <select value={municipalityCode} onChange={e => setMunicipalityCode(e.target.value)}
              className={inputClass}>
              <option value="">Seleccionar...</option>
              {filteredMunicipalities.map(m => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Código postal</label>
            <input type="text" value={postalCode} onChange={e => setPostalCode(e.target.value)}
              placeholder="110111" className={inputClass} maxLength={6} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <p className="font-semibold text-gray-900 dark:text-gray-100">Contacto</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="facturacion@miempresa.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="3001234567" className={inputClass} />
          </div>
        </div>
      </div>

      {/* DIAN Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-emerald-600" />
          <p className="font-semibold text-gray-900 dark:text-gray-100">Integración DIAN</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Datos del software registrado en el portal de DIAN</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Ambiente</label>
            <select value={environment} onChange={e => setEnvironment(e.target.value)} className={inputClass}>
              <option value="testing">Habilitación (pruebas)</option>
              <option value="production">Producción</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Software ID</label>
            <input type="text" value={softwareId} onChange={e => setSoftwareId(e.target.value)}
              placeholder="UUID del software DIAN" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>PIN del software</label>
            <input type="text" value={softwarePin} onChange={e => setSoftwarePin(e.target.value)}
              placeholder="PIN de 5 dígitos" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Test Set ID (habilitación)</label>
            <input type="text" value={testSetId} onChange={e => setTestSetId(e.target.value)}
              placeholder="UUID del set de pruebas" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Certificate */}
      <CertificateSection brandId={brandId} config={config} environment={environment} />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !nit || !companyName}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
      >
        {saved ? <Check size={15} /> : <Save size={15} />}
        {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar configuración'}
      </button>
    </div>
  )
}

function CertificateSection({ brandId, config, environment }: { brandId: string; config: any; environment: string }) {
  const [generating, setGenerating] = useState(false)
  const [certResult, setCertResult] = useState<any>(null)
  const [certError, setCertError] = useState('')

  const hasCert = !!config?.certificate_base64
  const isTest = config?.certificate_is_test

  async function handleGenerateTestCert() {
    setGenerating(true)
    setCertError('')
    setCertResult(null)

    try {
      const res = await fetch('/api/invoicing/test-cert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCertError(data.error || 'Error generando certificado')
      } else {
        setCertResult(data)
      }
    } catch (err: any) {
      setCertError(err.message || 'Error de conexión')
    }

    setGenerating(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Key size={16} className="text-amber-600" />
        <p className="font-semibold text-gray-900 dark:text-gray-100">Certificado Digital</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Necesario para firmar documentos electrónicos (XAdES-EPES).
        {environment === 'testing'
          ? ' En ambiente de habilitación puedes usar un certificado de pruebas gratuito.'
          : ' En producción necesitas un certificado de una CA autorizada (Certicámara, GSE, Andes SCD).'}
      </p>

      {hasCert && (
        <div className={`flex items-start gap-3 p-3 rounded-lg ${isTest ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
          {isTest ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> : <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" />}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isTest ? 'Certificado de pruebas activo' : 'Certificado de producción activo'}
            </p>
            {config.certificate_serial && (
              <p className="text-xs text-gray-500 mt-1">Serial: {config.certificate_serial}</p>
            )}
            {config.certificate_valid_to && (
              <p className="text-xs text-gray-500">Válido hasta: {config.certificate_valid_to}</p>
            )}
            {isTest && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Solo válido para habilitación. Para producción sube un certificado de CA autorizada.
              </p>
            )}
          </div>
        </div>
      )}

      {certResult && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">Certificado generado exitosamente</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">Serial: {certResult.serialNumber}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{certResult.warning}</p>
        </div>
      )}

      {certError && (
        <p className="text-sm text-red-600">{certError}</p>
      )}

      <div className="flex gap-2">
        {environment === 'testing' && (
          <button
            onClick={handleGenerateTestCert}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50"
          >
            <Key size={14} />
            {generating ? 'Generando...' : hasCert ? 'Regenerar certificado de pruebas' : 'Generar certificado de pruebas'}
          </button>
        )}
      </div>
    </div>
  )
}
