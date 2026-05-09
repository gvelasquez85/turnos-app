'use client'
import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileCheck, Plus, Search, Clock, CheckCircle, XCircle,
  Send, ShoppingCart, Eye, Edit3, X, Loader2,
  User, Building2, Calendar, Hash, Mail, MessageSquare, MessageCircle,
  Minus, Trash2, AlertCircle, CheckCheck, ExternalLink, Copy,
} from 'lucide-react'
import Link from 'next/link'
import { buildWaMessage } from '@/lib/waTemplates'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Quote {
  id: string
  status: string
  total: number
  subtotal: number
  discount: number
  created_at: string
  establishment_id: string | null
  customer_id: string | null
  notes: string | null
  sent_at?: string | null
  sent_to_email?: string | null
  opened_at?: string | null
  customers: { name: string; email?: string | null; phone?: string | null } | null
}

interface SaleItem {
  id?: string
  product_id?: string | null
  product_name: string
  product_sku?: string | null
  qty: number
  unit_price: number
  line_total: number
}

const STATUS_MAP: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  draft:     { label: 'Borrador',    color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400',    icon: Clock },
  sent:      { label: 'Enviada',     color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',    icon: Send },
  accepted:  { label: 'Aceptada',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',   icon: CheckCircle },
  rejected:  { label: 'Rechazada',   color: 'bg-red-100 text-red-600',      dot: 'bg-red-400',     icon: XCircle },
  converted: { label: 'En venta',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: ShoppingCart },
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function CotizacionesManager({ brandId, quotes: initial, establishments, waTemplates = [], brandName = 'Tu negocio' }: {
  brandId: string
  quotes: Quote[]
  establishments: { id: string; name: string }[]
  waTemplates?: { category: string; body: string }[]
  brandName?: string
}) {
  const [quotes, setQuotes] = useState<Quote[]>(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Panel state
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null)
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'send'>('view')
  const [panelItems, setPanelItems] = useState<SaleItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Edit state
  const [editItems, setEditItems] = useState<SaleItem[]>([])
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Send modal state
  const [sendEmail, setSendEmail] = useState('')
  const [sendName, setSendName] = useState('')
  const [sendSubject, setSendSubject] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const estMap = useMemo(() => Object.fromEntries(establishments.map(e => [e.id, e.name])), [establishments])
  const waTemplateMap = useMemo(() => Object.fromEntries(waTemplates.map(t => [t.category, t.body])), [waTemplates])

  async function openQuoteWa(quote: Quote, category: 'quote_sent' | 'quote_followup') {
    const phone = quote.customers?.phone
    if (!phone) return
    const quoteLink = `${window.location.origin}/cotizacion/${quote.id}`
    const vars: Record<string, string> = {
      nombre: quote.customers?.name ?? '',
      negocio: brandName,
      total: fmt(quote.total),
      link: quoteLink,
      dias: quote.sent_at
        ? String(Math.floor((Date.now() - new Date(quote.sent_at).getTime()) / 86400000))
        : '1',
    }
    const defaults: Record<string, string> = {
      quote_sent:      `Hola {{nombre}} 👋, te enviamos tu cotización de {{negocio}} por *{{total}}*. Puedes verla aquí: {{link}}`,
      quote_followup:  `Hola {{nombre}}, hace {{dias}} días te enviamos una cotización de *{{total}}* en {{negocio}}. ¿Pudiste revisarla? Estamos listos para ayudarte: {{link}}`,
    }
    const body = waTemplateMap[category] ?? defaults[category]
    const url = buildWaMessage(body, vars, phone)
    window.open(url, '_blank')

    // Ask to mark as sent
    if (quote.status === 'draft') {
      const markSent = window.confirm('¿Deseas marcar esta cotización como enviada?')
      if (markSent) {
        const supabase = createClient()
        const now = new Date().toISOString()
        await supabase.from('sales').update({ status: 'sent', sent_at: now }).eq('id', quote.id)
        setQuotes(qs => qs.map(q => q.id === quote.id ? { ...q, status: 'sent', sent_at: now } : q))
      }
    }
  }

  const filtered = useMemo(() => {
    let list = [...quotes]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(x =>
        x.customers?.name?.toLowerCase().includes(q) ||
        x.notes?.toLowerCase().includes(q) ||
        x.customers?.email?.toLowerCase().includes(q)
      )
    }
    if (filterStatus) list = list.filter(x => x.status === filterStatus)
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [quotes, search, filterStatus])

  const openQuote = useMemo(() => quotes.find(q => q.id === openQuoteId) ?? null, [quotes, openQuoteId])

  // ── Open detail panel ──────────────────────────────────────────────────────
  async function openPanel(quoteId: string, mode: 'view' | 'edit' | 'send' = 'view') {
    setOpenQuoteId(quoteId)
    setPanelMode(mode)
    setSendResult(null)
    setLoadingItems(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('sale_items')
      .select('id, product_id, product_name, product_sku, qty, unit_price, line_total')
      .eq('sale_id', quoteId)

    const items = data ?? []
    setPanelItems(items)

    const q = quotes.find(x => x.id === quoteId)
    if (mode === 'edit') {
      setEditItems(items.map(it => ({ ...it })))
      setEditNotes(q?.notes ?? '')
    }
    if (mode === 'send') {
      setSendEmail(q?.customers?.email ?? q?.sent_to_email ?? '')
      setSendName(q?.customers?.name ?? '')
      setSendSubject(`Cotización #COT-${quoteId.slice(-6).toUpperCase()}`)
      setSendMessage('')
    }

    setLoadingItems(false)
  }

  function closePanel() {
    setOpenQuoteId(null)
    setPanelMode('view')
    setSendResult(null)
  }

  // ── Edit helpers ────────────────────────────────────────────────────────────
  function updateEditItem(idx: number, patch: Partial<SaleItem>) {
    setEditItems(its => its.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, ...patch }
      updated.line_total = Math.round(updated.qty * updated.unit_price)
      return updated
    }))
  }
  function removeEditItem(idx: number) {
    setEditItems(its => its.filter((_, i) => i !== idx))
  }
  const editSubtotal = editItems.reduce((s, it) => s + it.line_total, 0)

  // ── Save edited quote ───────────────────────────────────────────────────────
  async function saveEdit() {
    if (!openQuote || editItems.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const newTotal = editSubtotal

    // Update sale header
    await supabase.from('sales').update({
      subtotal: newTotal,
      total: newTotal,
      notes: editNotes || null,
    }).eq('id', openQuote.id)

    // Replace sale_items: delete old, insert new
    await supabase.from('sale_items').delete().eq('sale_id', openQuote.id)
    await supabase.from('sale_items').insert(
      editItems.map(it => ({
        sale_id: openQuote.id,
        product_id: it.product_id ?? null,
        product_name: it.product_name,
        product_sku: it.product_sku ?? null,
        qty: it.qty,
        unit_price: it.unit_price,
        line_total: it.line_total,
      }))
    )

    setQuotes(qs => qs.map(q => q.id === openQuote.id
      ? { ...q, subtotal: newTotal, total: newTotal, discount: 0, notes: editNotes || null }
      : q
    ))
    setPanelItems(editItems)
    setSaving(false)
    setPanelMode('view')
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    const patch: Record<string, unknown> = { status }
    if (status === 'converted') {
      const quote = quotes.find(q => q.id === id)
      if (quote) {
        // Use 'pending' so the sale enters the exact same flow as manually-created sales
        const { data: newSale } = await supabase.from('sales').insert({
          brand_id: brandId,
          establishment_id: quote.establishment_id,
          customer_id: quote.customer_id,
          type: 'sale',
          status: 'pending',
          total: quote.total,
          subtotal: (quote as any).subtotal ?? quote.total,
          discount: (quote as any).discount ?? 0,
          notes: `Desde cotización #${id.slice(-6).toUpperCase()}${(quote as any).notes ? `\n${(quote as any).notes}` : ''}`,
          source_quote_id: id,
        }).select().single()
        // Copy sale_items from quote
        if (newSale?.id) {
          const { data: qItems } = await supabase
            .from('sale_items').select('*').eq('sale_id', id)
          if (qItems?.length) {
            await supabase.from('sale_items').insert(
              qItems.map(({ id: _id, sale_id: _sid, ...rest }: any) => ({ ...rest, sale_id: newSale.id }))
            )
          }
          try {
            await fetch('/api/admin/sales/update-inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ saleId: newSale.id, brandId }),
            })
          } catch {}
        }
      }
    }
    if (status === 'accepted') {
      const quote = quotes.find(q => q.id === id)
      if (quote) {
        const { data: newSale } = await supabase.from('sales').insert({
          brand_id: brandId,
          establishment_id: quote.establishment_id,
          customer_id: quote.customer_id,
          type: 'sale',
          status: 'pending',
          total: quote.total,
          subtotal: (quote as any).subtotal ?? quote.total,
          discount: (quote as any).discount ?? 0,
          notes: `Desde cotización #${id.slice(-6).toUpperCase()}${(quote as any).notes ? `\n${(quote as any).notes}` : ''}`,
          source_quote_id: id,
        }).select().single()

        // Update inventory based on quote items
        if (newSale?.id) {
          try {
            await fetch('/api/admin/sales/update-inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ saleId: newSale.id, brandId }),
            })
          } catch {}
        }
      }
    }
    const { data } = await supabase.from('sales').update(patch).eq('id', id).select().single()
    if (data) setQuotes(qs => qs.map(q => q.id === id ? { ...q, ...data } : q))
    if (openQuote?.id === id) setOpenQuoteId(null)
  }

  // ── Send quote ─────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!openQuote || !sendEmail) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: openQuote.id,
          recipientEmail: sendEmail,
          recipientName: sendName,
          subject: sendSubject,
          message: sendMessage,
        }),
      })
      const body = await res.json()
      if (res.ok && body.ok) {
        setSendResult({ ok: true, msg: `✓ Cotización enviada a ${sendEmail}` })
        setQuotes(qs => qs.map(q => q.id === openQuote.id
          ? { ...q, status: 'sent', sent_at: new Date().toISOString(), sent_to_email: sendEmail }
          : q
        ))
      } else if (res.status === 503) {
        setSendResult({ ok: false, msg: '⚙️ El envío de correos no está configurado. Ve a Ajustes → Comunicaciones y agrega tu API key de Brevo y el correo remitente.' })
      } else {
        setSendResult({ ok: false, msg: body.error || `Error ${res.status} al enviar` })
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: e.message || 'Error de red' })
    }
    setSending(false)
  }

  // ── Copy public link ───────────────────────────────────────────────────────
  function copyLink(id: string) {
    const url = `${window.location.origin}/cotizacion/${id}`
    navigator.clipboard.writeText(url).catch(() => {})
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total: quotes.length,
    sent: quotes.filter(q => q.status === 'sent').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    value: quotes.filter(q => ['accepted', 'converted'].includes(q.status)).reduce((s, q) => s + q.total, 0),
    opened: quotes.filter(q => q.opened_at != null).length,
  }), [quotes])

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* ── LEFT: list ── */}
      <div className={`flex-1 min-w-0 ${openQuoteId ? 'hidden lg:block' : ''}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
            <p className="text-gray-500 text-sm mt-0.5">{quotes.length} en total</p>
          </div>
          <Link
            href="/admin/ventas/nueva-venta?type=quote"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
          >
            <Plus size={15} /> Nueva cotización
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Total', value: kpis.total, color: 'text-gray-700' },
            { label: 'Enviadas', value: kpis.sent, color: 'text-blue-700' },
            { label: 'Abiertas', value: kpis.opened, color: 'text-indigo-700' },
            { label: 'Aceptadas', value: kpis.accepted, color: 'text-green-700' },
            { label: 'Valor aceptado', value: fmt(kpis.value), color: 'text-purple-700', wide: true },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Buscar cliente, email o notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 py-14 text-center">
            <FileCheck size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">Sin cotizaciones</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {filtered.map(q => {
              const s = STATUS_MAP[q.status] ?? STATUS_MAP.draft
              const Icon = s.icon
              const isOpen = openQuoteId === q.id
              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${isOpen ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  onClick={() => openPanel(q.id, 'view')}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{q.customers?.name ?? 'Sin cliente'}</p>
                      {q.opened_at && (
                        <span title="Cotización abierta por el cliente" className="flex items-center gap-0.5 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                          <Eye size={9} /> Abierta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                      {q.sent_to_email && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Mail size={9} /> {q.sent_to_email}
                        </span>
                      )}
                      {q.establishment_id && (
                        <span className="text-[10px] text-gray-400">{estMap[q.establishment_id]}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmt(q.total)}</p>
                    <p className="text-[10px] text-gray-400">{fmtDate(q.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── RIGHT: Detail panel ── */}
      {openQuoteId && openQuote && (
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <p className="font-mono text-xs text-gray-400 mb-0.5"># COT-{openQuote.id.slice(-6).toUpperCase()}</p>
                <p className="font-bold text-gray-900">{openQuote.customers?.name ?? 'Sin cliente'}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mode tabs */}
                {(['view', 'edit', 'send'] as const).map(mode => {
                  const isLocked = (openQuote.status === 'accepted' || openQuote.status === 'rejected') && mode === 'edit'
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        if (isLocked) return
                        setPanelMode(mode as any)
                        if (mode === 'edit') {
                          setEditItems(panelItems.map(it => ({ ...it })))
                          setEditNotes(openQuote.notes ?? '')
                        }
                        if (mode === 'send') {
                          setSendEmail(openQuote.customers?.email ?? openQuote.sent_to_email ?? '')
                          setSendName(openQuote.customers?.name ?? '')
                          setSendSubject(`Cotización #COT-${openQuote.id.slice(-6).toUpperCase()}`)
                          setSendMessage('')
                          setSendResult(null)
                        }
                      }}
                      disabled={isLocked}
                      className={`p-1.5 rounded-lg transition-colors ${panelMode === mode ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                      title={mode === 'view' ? 'Ver detalle' : mode === 'edit' ? (isLocked ? 'Bloqueado — cotización cerrada' : 'Editar') : 'Enviar'}
                    >
                      {mode === 'view' ? <Eye size={15} /> : mode === 'edit' ? <Edit3 size={15} /> : <Send size={15} />}
                    </button>
                  )
                })}
                <button onClick={closePanel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 ml-1">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>

              {/* ── VIEW MODE ── */}
              {panelMode === 'view' && (
                <div className="p-5 space-y-4">
                  {/* Locked banner */}
                  {(openQuote.status === 'accepted' || openQuote.status === 'rejected') && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${openQuote.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {openQuote.status === 'accepted' ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {openQuote.status === 'accepted' ? 'Cotización aceptada — solo lectura' : 'Cotización rechazada — solo lectura'}
                    </div>
                  )}
                  {/* Status + dates */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {(() => { const s = STATUS_MAP[openQuote.status] ?? STATUS_MAP.draft; return (
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                        <s.icon size={11} /> {s.label}
                      </span>
                    )})()}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={11} /> {fmtDate(openQuote.created_at)}
                    </span>
                    {openQuote.sent_at && (
                      <span className="flex items-center gap-1 text-xs text-blue-500">
                        <Send size={11} /> Enviado {fmtDateTime(openQuote.sent_at)}
                      </span>
                    )}
                    {openQuote.opened_at && (
                      <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Eye size={11} /> Abierto {fmtDateTime(openQuote.opened_at)}
                      </span>
                    )}
                    {openQuote.sent_at && !openQuote.opened_at && (
                      <span className="text-xs text-gray-400">· No abierto aún</span>
                    )}
                  </div>

                  {/* Customer info */}
                  {openQuote.customers && (
                    <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                        <User size={13} className="text-gray-400" /> {openQuote.customers.name}
                      </div>
                      {openQuote.customers.email && (
                        <p className="text-gray-500 flex items-center gap-1.5">
                          <Mail size={12} className="text-gray-400" /> {openQuote.customers.email}
                        </p>
                      )}
                      {openQuote.sent_to_email && openQuote.sent_to_email !== openQuote.customers.email && (
                        <p className="text-blue-500 text-xs flex items-center gap-1">
                          <Send size={10} /> Enviado a: {openQuote.sent_to_email}
                        </p>
                      )}
                    </div>
                  )}
                  {!openQuote.customers && openQuote.sent_to_email && (
                    <div className="bg-gray-50 rounded-xl p-3 text-sm">
                      <p className="text-blue-500 flex items-center gap-1.5">
                        <Mail size={13} /> Enviado a: {openQuote.sent_to_email}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Productos / Servicios</p>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs text-gray-400">
                            <th className="pb-1.5 text-left font-semibold">Item</th>
                            <th className="pb-1.5 text-center font-semibold">Cant.</th>
                            <th className="pb-1.5 text-right font-semibold">P. Unit.</th>
                            <th className="pb-1.5 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {panelItems.map((it, i) => (
                            <tr key={i}>
                              <td className="py-2 font-medium text-gray-900 text-xs">{it.product_name}</td>
                              <td className="py-2 text-center text-gray-500 text-xs">{it.qty}</td>
                              <td className="py-2 text-right text-gray-500 text-xs">{fmt(it.unit_price)}</td>
                              <td className="py-2 text-right font-semibold text-xs">{fmt(it.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-gray-100 pt-3 space-y-1">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Subtotal</span><span>{fmt(openQuote.subtotal ?? openQuote.total)}</span>
                    </div>
                    {(openQuote.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Descuento</span><span>−{fmt(openQuote.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>Total</span><span>{fmt(openQuote.total)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {openQuote.notes && (
                    <div className="p-3 bg-amber-50 rounded-xl border-l-4 border-amber-300">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Notas</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{openQuote.notes}</p>
                    </div>
                  )}

                  {/* Public link */}
                  <div className="flex items-center gap-2">
                    <a
                      href={`/cotizacion/${openQuote.id}`}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                    >
                      <ExternalLink size={11} /> Ver vista pública del cliente
                    </a>
                    <button
                      onClick={() => copyLink(openQuote.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
                    >
                      <Copy size={11} /> Copiar enlace
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                    {openQuote.status === 'draft' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPanelMode('send')
                            setSendEmail(openQuote.customers?.email ?? '')
                            setSendName(openQuote.customers?.name ?? '')
                            setSendSubject(`Cotización #COT-${openQuote.id.slice(-6).toUpperCase()}`)
                            setSendMessage('')
                            setSendResult(null)
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
                        >
                          <Send size={14} /> Enviar por email
                        </button>
                        {openQuote.customers?.phone && (
                          <button
                            onClick={() => openQuoteWa(openQuote, 'quote_sent')}
                            className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-100 border border-green-200"
                          >
                            <MessageCircle size={14} /> Enviar por WA
                          </button>
                        )}
                      </div>
                    )}
                    {openQuote.status === 'sent' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPanelMode('send')
                            setSendEmail(openQuote.sent_to_email ?? openQuote.customers?.email ?? '')
                            setSendName(openQuote.customers?.name ?? '')
                            setSendSubject(`[Recordatorio] Cotización #COT-${openQuote.id.slice(-6).toUpperCase()}`)
                            setSendMessage('Te enviamos un recordatorio sobre la cotización que te enviamos anteriormente.')
                            setSendResult(null)
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 border border-blue-200"
                        >
                          <Send size={14} /> Recordatorio email
                        </button>
                        {openQuote.customers?.phone && (
                          <button
                            onClick={() => openQuoteWa(openQuote, 'quote_followup')}
                            className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-100 border border-green-200"
                          >
                            <MessageCircle size={14} /> Seguimiento WA
                          </button>
                        )}
                      </div>
                    )}
                    {openQuote.status === 'sent' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(openQuote.id, 'accepted')}
                          className="flex-1 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-green-100 border border-green-200"
                        >
                          <CheckCircle size={13} /> Marcar aceptada
                        </button>
                        <button
                          onClick={() => updateStatus(openQuote.id, 'rejected')}
                          className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 border border-red-200"
                        >
                          <XCircle size={13} /> Rechazada
                        </button>
                      </div>
                    )}
                    {openQuote.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(openQuote.id, 'converted')}
                        className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-purple-700"
                      >
                        <ShoppingCart size={14} /> Convertir en venta
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── EDIT MODE ── */}
              {panelMode === 'edit' && (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Edit3 size={14} /> Editando cotización
                  </p>

                  <div className="space-y-2">
                    {editItems.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{it.product_name}</p>
                          <p className="text-xs text-gray-400">{fmt(it.unit_price)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => it.qty > 1 ? updateEditItem(idx, { qty: it.qty - 1 }) : removeEditItem(idx)}
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-200"
                          >
                            <Minus size={10} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={it.qty}
                            onChange={e => updateEditItem(idx, { qty: Math.max(1, Math.floor(parseInt(e.target.value) || 1)) })}
                            className="w-12 text-center text-sm font-bold border border-gray-200 rounded-lg py-0.5 focus:outline-none focus:border-indigo-400"
                          />
                          <button
                            onClick={() => updateEditItem(idx, { qty: it.qty + 1 })}
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <p className="text-sm font-bold w-20 text-right shrink-0">{fmt(it.line_total)}</p>
                        <button onClick={() => removeEditItem(idx)} className="text-gray-300 hover:text-red-500 shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2">
                    <span>Total</span><span>{fmt(editSubtotal)}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Notas</label>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                      placeholder="Condiciones, vigencia, observaciones..."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setPanelMode('view')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving || editItems.length === 0}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                      {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── SEND MODE ── */}
              {panelMode === 'send' && (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Send size={16} className="text-blue-600" />
                    <p className="font-semibold text-gray-900">Enviar cotización por email</p>
                  </div>

                  {sendResult ? (
                    <div className={`p-4 rounded-xl flex items-start gap-3 ${sendResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {sendResult.ok
                        ? <CheckCheck size={18} className="text-green-600 shrink-0 mt-0.5" />
                        : <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className={`text-sm font-semibold ${sendResult.ok ? 'text-green-800' : 'text-red-700'}`}>{sendResult.msg}</p>
                        {sendResult.ok && (
                          <p className="text-xs text-green-600 mt-1">
                            El estado de la cotización cambió a <strong>Enviada</strong>. Sabrás cuando el cliente la abra.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Recipient */}
                  <div className="bg-blue-50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Destinatario</p>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-400 shrink-0" />
                      <input
                        value={sendName}
                        onChange={e => setSendName(e.target.value)}
                        placeholder="Nombre del cliente"
                        className="flex-1 bg-white rounded-lg border border-blue-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-blue-400 shrink-0" />
                      <input
                        type="email"
                        value={sendEmail}
                        onChange={e => setSendEmail(e.target.value)}
                        placeholder="correo@cliente.com *"
                        className="flex-1 bg-white rounded-lg border border-blue-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    {!sendEmail && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} /> El correo del destinatario es obligatorio
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Asunto del correo</label>
                    <input
                      value={sendSubject}
                      onChange={e => setSendSubject(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Mensaje personalizado <span className="text-gray-300 font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={sendMessage}
                      onChange={e => setSendMessage(e.target.value)}
                      rows={3}
                      placeholder="Agrega una nota o mensaje de acompañamiento al correo..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                    />
                  </div>

                  {/* Preview summary */}
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-600 mb-1.5">El cliente recibirá:</p>
                    <p>• Email con el detalle de la cotización ({panelItems.length} ítem{panelItems.length !== 1 ? 's' : ''})</p>
                    <p>• Total: <strong className="text-gray-800">{fmt(openQuote.total)}</strong></p>
                    <p>• Enlace para ver la cotización completa y aceptar/rechazar</p>
                    <p>• Sabrás cuando abra el correo</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPanelMode('view')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={sending || !sendEmail || !!sendResult?.ok}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {sending ? 'Enviando…' : sendResult?.ok ? 'Enviado ✓' : 'Confirmar envío'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
