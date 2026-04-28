'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Palette, Type, Layout, Eye, Save, RotateCcw,
  Building2, Phone, Mail, Globe, Hash, Calendar,
  ChevronDown, Check, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Download,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteTemplate {
  // Brand / company section
  showLogo: boolean
  logoPosition: 'left' | 'center' | 'right'
  showCompanyName: boolean
  showCompanyPhone: boolean
  showCompanyEmail: boolean
  showCompanyAddress: boolean
  showCompanyWebsite: boolean
  showCompanyNIT: boolean

  // Colors
  primaryColor: string
  accentColor: string
  textColor: string
  bgColor: string
  tableBg: string
  tableHeaderBg: string

  // Typography
  fontFamily: 'sans' | 'serif' | 'mono'
  headerSize: 'sm' | 'md' | 'lg'
  bodySize: 'xs' | 'sm' | 'md'

  // Layout
  headerLayout: 'logo-left' | 'logo-right' | 'logo-center' | 'no-logo'
  showBorder: boolean
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
  showWatermark: boolean

  // Quote fields shown
  showQuoteNumber: boolean
  showDate: boolean
  showDueDate: boolean
  showCustomerSection: boolean
  showNotes: boolean
  showBankInfo: boolean
  showPaymentTerms: boolean
  showSignatureLine: boolean
  showTaxes: boolean

  // Custom texts
  headerTitle: string
  footerText: string
  bankInfo: string
  paymentTerms: string
  closingMessage: string

  // Table columns
  showSKU: boolean
  showDescription: boolean
  showUnitPrice: boolean
  showDiscount: boolean
}

const DEFAULTS: QuoteTemplate = {
  showLogo: true,
  logoPosition: 'left',
  showCompanyName: true,
  showCompanyPhone: true,
  showCompanyEmail: true,
  showCompanyAddress: true,
  showCompanyWebsite: false,
  showCompanyNIT: true,
  primaryColor: '#4F46E5',
  accentColor: '#10B981',
  textColor: '#111827',
  bgColor: '#FFFFFF',
  tableBg: '#F9FAFB',
  tableHeaderBg: '#4F46E5',
  fontFamily: 'sans',
  headerSize: 'lg',
  bodySize: 'sm',
  headerLayout: 'logo-left',
  showBorder: true,
  borderRadius: 'md',
  showWatermark: false,
  showQuoteNumber: true,
  showDate: true,
  showDueDate: true,
  showCustomerSection: true,
  showNotes: true,
  showBankInfo: false,
  showPaymentTerms: true,
  showSignatureLine: false,
  showTaxes: false,
  headerTitle: 'COTIZACIÓN',
  footerText: 'Gracias por su preferencia.',
  bankInfo: '',
  paymentTerms: 'Válido por 30 días a partir de la fecha de emisión.',
  closingMessage: '',
  showSKU: false,
  showDescription: true,
  showUnitPrice: true,
  showDiscount: false,
}

const COLOR_PRESETS = [
  { name: 'Índigo', primary: '#4F46E5', accent: '#10B981' },
  { name: 'Azul', primary: '#2563EB', accent: '#F59E0B' },
  { name: 'Esmeralda', primary: '#059669', accent: '#6366F1' },
  { name: 'Rojo', primary: '#DC2626', accent: '#F59E0B' },
  { name: 'Gris oscuro', primary: '#1F2937', accent: '#10B981' },
  { name: 'Violeta', primary: '#7C3AED', accent: '#EC4899' },
]

const FONTS = [
  { key: 'sans', label: 'Sans-serif (moderno)', css: 'Inter, sans-serif' },
  { key: 'serif', label: 'Serif (clásico)', css: 'Georgia, serif' },
  { key: 'mono', label: 'Monoespaciado (técnico)', css: 'monospace' },
] as const

// ─── Preview Component ─────────────────────────────────────────────────────────

function QuotePreview({ t, brandName, brandLogoUrl }: {
  t: QuoteTemplate
  brandName: string
  brandLogoUrl: string | null
}) {
  const fontCSS = FONTS.find(f => f.key === t.fontFamily)?.css ?? 'sans-serif'
  const headerSizeClass = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }[t.headerSize]
  const bodySizeClass = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm' }[t.bodySize]
  const radiusClass = { none: 'rounded-none', sm: 'rounded', md: 'rounded-lg', lg: 'rounded-2xl' }[t.borderRadius]

  const sampleItems = [
    { sku: 'P001', name: 'Producto ejemplo A', desc: 'Descripción del servicio o producto', qty: 2, unit: 'und', price: 150000, disc: 0 },
    { sku: 'P002', name: 'Servicio de instalación', desc: 'Mano de obra y materiales incluidos', qty: 1, unit: 'hr', price: 80000, disc: 10 },
    { sku: 'P003', name: 'Soporte técnico mensual', desc: 'Plan premium', qty: 3, unit: 'mes', price: 45000, disc: 0 },
  ]

  const subtotal = sampleItems.reduce((s, i) => s + i.qty * i.price * (1 - i.disc / 100), 0)
  const tax = t.showTaxes ? subtotal * 0.19 : 0
  const total = subtotal + tax

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

  return (
    <div
      className={`w-full mx-auto shadow-md ${radiusClass} overflow-hidden`}
      style={{
        background: t.bgColor,
        color: t.textColor,
        fontFamily: fontCSS,
        border: t.showBorder ? `1.5px solid ${t.primaryColor}33` : undefined,
        maxWidth: 680,
      }}
    >
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{ background: t.primaryColor + '12' }}
      >
        <div className={`flex ${t.headerLayout === 'logo-right' ? 'flex-row-reverse' : t.headerLayout === 'logo-center' ? 'flex-col items-center text-center' : 'flex-row'} items-start gap-4 justify-between`}>
          {/* Logo + brand */}
          {t.showLogo && (
            <div className="shrink-0">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={brandName} className="h-12 object-contain" />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: t.primaryColor }}
                >
                  {brandName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          <div className={t.headerLayout === 'logo-center' ? 'text-center mt-2' : 'flex-1'}>
            {t.showCompanyName && (
              <p className={`font-bold ${bodySizeClass}`} style={{ color: t.primaryColor }}>{brandName}</p>
            )}
            {t.showCompanyPhone && (
              <p className={`${bodySizeClass} text-gray-500`}>
                <Phone size={9} className="inline mr-1" />+57 300 000 0000
              </p>
            )}
            {t.showCompanyEmail && (
              <p className={`${bodySizeClass} text-gray-500`}>
                <Mail size={9} className="inline mr-1" />contacto@empresa.com
              </p>
            )}
            {t.showCompanyNIT && (
              <p className={`${bodySizeClass} text-gray-500`}>
                <Hash size={9} className="inline mr-1" />NIT 900.000.000-1
              </p>
            )}
            {t.showCompanyAddress && (
              <p className={`${bodySizeClass} text-gray-500`}>Cra. 7 # 32-45, Bogotá</p>
            )}
            {t.showCompanyWebsite && (
              <p className={`${bodySizeClass} text-gray-500`}>
                <Globe size={9} className="inline mr-1" />www.empresa.com
              </p>
            )}
          </div>
          {/* Quote title */}
          <div className="text-right shrink-0">
            <p className={`font-black tracking-widest ${headerSizeClass}`} style={{ color: t.primaryColor }}>
              {t.headerTitle}
            </p>
            {t.showQuoteNumber && (
              <p className={`${bodySizeClass} text-gray-500 font-mono`}># COT-2025-001</p>
            )}
            {t.showDate && (
              <p className={`${bodySizeClass} text-gray-500`}>
                <Calendar size={9} className="inline mr-1" />Fecha: 27/04/2025
              </p>
            )}
            {t.showDueDate && (
              <p className={`${bodySizeClass} text-gray-500`}>Vence: 27/05/2025</p>
            )}
          </div>
        </div>
      </div>

      {/* Customer */}
      {t.showCustomerSection && (
        <div className="px-6 pt-4 pb-2">
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1`} style={{ color: t.primaryColor }}>Para</p>
          <p className={`font-semibold ${bodySizeClass}`}>Cliente de Ejemplo S.A.S</p>
          <p className={`${bodySizeClass} text-gray-500`}>cliente@empresa.com · +57 310 000 0000</p>
          <p className={`${bodySizeClass} text-gray-500`}>Bogotá, Colombia</p>
        </div>
      )}

      {/* Items table */}
      <div className="px-6 pt-3 pb-2">
        <table className="w-full" style={{ fontSize: bodySizeClass === 'text-xs' ? 11 : bodySizeClass === 'text-[10px]' ? 9 : 13 }}>
          <thead>
            <tr style={{ background: t.tableHeaderBg, color: '#fff' }}>
              {t.showSKU && <th className="px-2 py-1.5 text-left font-semibold rounded-tl">SKU</th>}
              <th className="px-2 py-1.5 text-left font-semibold">Producto / Servicio</th>
              {t.showDescription && <th className="px-2 py-1.5 text-left font-semibold hidden">Descripción</th>}
              <th className="px-2 py-1.5 text-center font-semibold">Cant.</th>
              {t.showUnitPrice && <th className="px-2 py-1.5 text-right font-semibold">P. Unit.</th>}
              {t.showDiscount && <th className="px-2 py-1.5 text-right font-semibold">Desc.</th>}
              <th className="px-2 py-1.5 text-right font-semibold rounded-tr">Total</th>
            </tr>
          </thead>
          <tbody>
            {sampleItems.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? t.tableBg : t.bgColor }}>
                {t.showSKU && <td className="px-2 py-1.5 font-mono text-gray-400">{item.sku}</td>}
                <td className="px-2 py-1.5">
                  <p className="font-medium">{item.name}</p>
                  {t.showDescription && <p className="text-gray-400" style={{ fontSize: '0.8em' }}>{item.desc}</p>}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600">{item.qty} {item.unit}</td>
                {t.showUnitPrice && <td className="px-2 py-1.5 text-right text-gray-600">{fmt(item.price)}</td>}
                {t.showDiscount && <td className="px-2 py-1.5 text-right text-gray-500">{item.disc > 0 ? `${item.disc}%` : '—'}</td>}
                <td className="px-2 py-1.5 text-right font-semibold">{fmt(item.qty * item.price * (1 - item.disc / 100))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-6 pb-4 flex justify-end">
        <div className="min-w-[200px]">
          <div className={`flex justify-between ${bodySizeClass} py-0.5 text-gray-500`}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          {t.showTaxes && (
            <div className={`flex justify-between ${bodySizeClass} py-0.5 text-gray-500`}>
              <span>IVA 19%</span><span>{fmt(tax)}</span>
            </div>
          )}
          <div
            className={`flex justify-between font-bold py-1.5 px-2 rounded mt-1 ${bodySizeClass}`}
            style={{ background: t.primaryColor, color: '#fff' }}
          >
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {t.showNotes && (
        <div className="px-6 pb-3">
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1`} style={{ color: t.primaryColor }}>Notas</p>
          <p className={`${bodySizeClass} text-gray-500 italic`}>
            Ejemplo de nota o condición especial para esta cotización.
          </p>
        </div>
      )}

      {/* Payment terms */}
      {t.showPaymentTerms && t.paymentTerms && (
        <div className="px-6 pb-3">
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1`} style={{ color: t.primaryColor }}>Condiciones</p>
          <p className={`${bodySizeClass} text-gray-500`}>{t.paymentTerms}</p>
        </div>
      )}

      {/* Bank info */}
      {t.showBankInfo && t.bankInfo && (
        <div className="px-6 pb-3">
          <p className={`text-[9px] font-bold uppercase tracking-widest mb-1`} style={{ color: t.primaryColor }}>Datos bancarios</p>
          <p className={`${bodySizeClass} text-gray-500 whitespace-pre-line`}>{t.bankInfo}</p>
        </div>
      )}

      {/* Signature */}
      {t.showSignatureLine && (
        <div className="px-6 pb-4 mt-4 flex gap-8">
          <div className="flex-1 border-t border-gray-300 pt-2">
            <p className={`${bodySizeClass} text-gray-400 text-center`}>Firma autorizada</p>
          </div>
          <div className="flex-1 border-t border-gray-300 pt-2">
            <p className={`${bodySizeClass} text-gray-400 text-center`}>Firma cliente</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 text-center" style={{ background: t.primaryColor + '18' }}>
        <p className={`${bodySizeClass} text-gray-500`}>{t.footerText}</p>
        {t.showWatermark && (
          <p className="text-[8px] text-gray-300 mt-0.5">Cotización generada con TurnFlow</p>
        )}
      </div>
    </div>
  )
}

// ─── Section / Toggle helpers ──────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-xs text-gray-400 font-mono ml-auto">{value}</span>
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  )
}

// ─── Main Designer ─────────────────────────────────────────────────────────────

export function QuoteDesigner({ brandId, brandName, brandLogoUrl }: {
  brandId: string
  brandName: string
  brandLogoUrl: string | null
}) {
  const [template, setTemplate] = useState<QuoteTemplate>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'fields'>('design')

  const set = useCallback(<K extends keyof QuoteTemplate>(key: K, value: QuoteTemplate[K]) => {
    setTemplate(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('brands').update({
      quote_template: template,
    }).eq('id', brandId)
    setSaving(false)
    setSaved(true)
  }

  function handleReset() {
    if (confirm('¿Restaurar configuración por defecto?')) {
      setTemplate(DEFAULTS)
      setSaved(false)
    }
  }

  const tabs = [
    { key: 'design', label: 'Diseño', icon: Palette },
    { key: 'content', label: 'Contenido', icon: Type },
    { key: 'fields', label: 'Campos', icon: Layout },
  ] as const

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diseñador de cotizaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personaliza el aspecto visual de tus cotizaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RotateCcw size={14} /> Restaurar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar plantilla'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* LEFT: Controls */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
          {/* Tabs */}
          <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50 gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-white shadow text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>

            {/* ── DESIGN TAB ── */}
            {activeTab === 'design' && (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Paleta de colores</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLOR_PRESETS.map(p => (
                      <button
                        key={p.name}
                        onClick={() => setTemplate(prev => ({ ...prev, primaryColor: p.primary, accentColor: p.accent, tableHeaderBg: p.primary }))}
                        title={p.name}
                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ background: p.primary }}
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <ColorPicker label="Color principal" value={template.primaryColor} onChange={v => { set('primaryColor', v); set('tableHeaderBg', v) }} />
                    <ColorPicker label="Color acento" value={template.accentColor} onChange={v => set('accentColor', v)} />
                    <ColorPicker label="Color texto" value={template.textColor} onChange={v => set('textColor', v)} />
                    <ColorPicker label="Fondo cotización" value={template.bgColor} onChange={v => set('bgColor', v)} />
                    <ColorPicker label="Fondo tabla (filas)" value={template.tableBg} onChange={v => set('tableBg', v)} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tipografía</p>
                  <div className="space-y-1">
                    {FONTS.map(f => (
                      <button
                        key={f.key}
                        onClick={() => set('fontFamily', f.key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                          template.fontFamily === f.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ fontFamily: f.css }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tamaño encabezado</p>
                      <div className="flex gap-1">
                        {(['sm', 'md', 'lg'] as const).map(s => (
                          <button key={s} onClick={() => set('headerSize', s)} className={`flex-1 py-1 text-xs rounded ${template.headerSize === s ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tamaño cuerpo</p>
                      <div className="flex gap-1">
                        {(['xs', 'sm', 'md'] as const).map(s => (
                          <button key={s} onClick={() => set('bodySize', s)} className={`flex-1 py-1 text-xs rounded ${template.bodySize === s ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Layout del encabezado</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'logo-left', label: 'Logo izquierda' },
                      { key: 'logo-right', label: 'Logo derecha' },
                      { key: 'logo-center', label: 'Logo centrado' },
                      { key: 'no-logo', label: 'Sin logo' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => set('headerLayout', opt.key as any)}
                        className={`py-2 text-xs rounded-lg border text-center transition-colors ${
                          template.headerLayout === opt.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Estilo</p>
                  <Field label="Borde exterior"><Toggle checked={template.showBorder} onChange={v => set('showBorder', v)} /></Field>
                  <Field label="Radio de esquinas">
                    <select
                      value={template.borderRadius}
                      onChange={e => set('borderRadius', e.target.value as any)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="none">Recto</option>
                      <option value="sm">Pequeño</option>
                      <option value="md">Medio</option>
                      <option value="lg">Grande</option>
                    </select>
                  </Field>
                  <Field label="Marca de agua TurnFlow"><Toggle checked={template.showWatermark} onChange={v => set('showWatermark', v)} /></Field>
                </div>
              </>
            )}

            {/* ── CONTENT TAB ── */}
            {activeTab === 'content' && (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Empresa / Marca</p>
                  <Field label="Mostrar logo"><Toggle checked={template.showLogo} onChange={v => set('showLogo', v)} /></Field>
                  <Field label="Nombre empresa"><Toggle checked={template.showCompanyName} onChange={v => set('showCompanyName', v)} /></Field>
                  <Field label="Teléfono"><Toggle checked={template.showCompanyPhone} onChange={v => set('showCompanyPhone', v)} /></Field>
                  <Field label="Email"><Toggle checked={template.showCompanyEmail} onChange={v => set('showCompanyEmail', v)} /></Field>
                  <Field label="Dirección"><Toggle checked={template.showCompanyAddress} onChange={v => set('showCompanyAddress', v)} /></Field>
                  <Field label="Sitio web"><Toggle checked={template.showCompanyWebsite} onChange={v => set('showCompanyWebsite', v)} /></Field>
                  <Field label="NIT / ID fiscal"><Toggle checked={template.showCompanyNIT} onChange={v => set('showCompanyNIT', v)} /></Field>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Título</p>
                  <input
                    type="text"
                    value={template.headerTitle}
                    onChange={e => set('headerTitle', e.target.value)}
                    placeholder="COTIZACIÓN"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Condiciones de pago</p>
                  <textarea
                    value={template.paymentTerms}
                    onChange={e => set('paymentTerms', e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    placeholder="Válido por 30 días…"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Datos bancarios</p>
                  <Field label="Mostrar datos bancarios"><Toggle checked={template.showBankInfo} onChange={v => set('showBankInfo', v)} /></Field>
                  {template.showBankInfo && (
                    <textarea
                      value={template.bankInfo}
                      onChange={e => set('bankInfo', e.target.value)}
                      rows={3}
                      className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                      placeholder="Banco: Bancolombia&#10;Cuenta corriente: 000-000000&#10;A nombre de: Mi Empresa S.A.S"
                    />
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Pie de página</p>
                  <input
                    type="text"
                    value={template.footerText}
                    onChange={e => set('footerText', e.target.value)}
                    placeholder="Gracias por su preferencia."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </>
            )}

            {/* ── FIELDS TAB ── */}
            {activeTab === 'fields' && (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Encabezado cotización</p>
                  <Field label="Número de cotización"><Toggle checked={template.showQuoteNumber} onChange={v => set('showQuoteNumber', v)} /></Field>
                  <Field label="Fecha de emisión"><Toggle checked={template.showDate} onChange={v => set('showDate', v)} /></Field>
                  <Field label="Fecha de vencimiento"><Toggle checked={template.showDueDate} onChange={v => set('showDueDate', v)} /></Field>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Columnas de la tabla</p>
                  <Field label="SKU / Código"><Toggle checked={template.showSKU} onChange={v => set('showSKU', v)} /></Field>
                  <Field label="Descripción"><Toggle checked={template.showDescription} onChange={v => set('showDescription', v)} /></Field>
                  <Field label="Precio unitario"><Toggle checked={template.showUnitPrice} onChange={v => set('showUnitPrice', v)} /></Field>
                  <Field label="Descuento"><Toggle checked={template.showDiscount} onChange={v => set('showDiscount', v)} /></Field>
                  <Field label="Impuestos (IVA 19%)"><Toggle checked={template.showTaxes} onChange={v => set('showTaxes', v)} /></Field>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Secciones adicionales</p>
                  <Field label="Sección cliente"><Toggle checked={template.showCustomerSection} onChange={v => set('showCustomerSection', v)} /></Field>
                  <Field label="Notas"><Toggle checked={template.showNotes} onChange={v => set('showNotes', v)} /></Field>
                  <Field label="Condiciones de pago"><Toggle checked={template.showPaymentTerms} onChange={v => set('showPaymentTerms', v)} /></Field>
                  <Field label="Línea de firma"><Toggle checked={template.showSignatureLine} onChange={v => set('showSignatureLine', v)} /></Field>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye size={15} />
              Vista previa en tiempo real
            </div>
          </div>
          <div
            className="bg-gray-100 rounded-xl p-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 220px)' }}
          >
            <QuotePreview t={template} brandName={brandName} brandLogoUrl={brandLogoUrl} />
          </div>
        </div>
      </div>
    </div>
  )
}
