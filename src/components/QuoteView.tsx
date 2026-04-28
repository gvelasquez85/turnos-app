/**
 * QuoteView — renders a quote using the brand's saved template.
 * Pure React component (no 'use client'). Uses inline styles for
 * dynamic colors so it works in both server and client contexts.
 */
import { QuoteTemplate } from '@/lib/quoteTemplate'

export interface QuoteItem {
  product_name: string
  product_sku?: string | null
  qty: number
  unit_price: number
  line_total: number
}

export interface QuoteViewData {
  id: string
  status: string
  total: number
  subtotal: number
  discount?: number | null
  notes?: string | null
  created_at: string
  due_date?: string | null
  // customer
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  // brand
  brandName: string
  brandLogoUrl?: string | null
  brandPhone?: string | null
  brandEmail?: string | null
  brandAddress?: string | null
  brandWebsite?: string | null
  brandNIT?: string | null
  // items
  items: QuoteItem[]
}

const FONT_MAP = {
  sans: "'Inter', 'Segoe UI', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
}

const RADIUS_MAP = {
  none: '0px',
  sm: '6px',
  md: '12px',
  lg: '20px',
}

const HEADER_SIZE_MAP = {
  sm: '18px',
  md: '22px',
  lg: '28px',
}

const BODY_SIZE_MAP = {
  xs: '10px',
  sm: '12px',
  md: '14px',
}

function fmtCOP(n: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

interface Props {
  t: QuoteTemplate
  data: QuoteViewData
  /** When true, renders accept/reject buttons */
  showActions?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export function QuoteView({ t, data, showActions }: Props) {
  const font = FONT_MAP[t.fontFamily]
  const radius = RADIUS_MAP[t.borderRadius]
  const headerSize = HEADER_SIZE_MAP[t.headerSize]
  const bodySize = BODY_SIZE_MAP[t.bodySize]

  const subtotal = data.subtotal ?? data.total
  const tax = t.showTaxes ? subtotal * 0.19 : 0
  const total = data.total

  const quoteNum = `COT-${data.id.slice(-6).toUpperCase()}`

  const headerFlexDir =
    t.headerLayout === 'logo-right' ? 'row-reverse' :
    t.headerLayout === 'logo-center' ? 'column' : 'row'
  const headerAlign =
    t.headerLayout === 'logo-center' ? 'center' : 'flex-start'

  const isPending = ['sent', 'draft'].includes(data.status)

  return (
    <div
      style={{
        fontFamily: font,
        color: t.textColor,
        background: t.bgColor,
        borderRadius: radius,
        border: t.showBorder ? `1.5px solid ${t.primaryColor}33` : 'none',
        overflow: 'hidden',
        maxWidth: 700,
        margin: '0 auto',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* ── Header ── */}
      <div style={{ background: `${t.primaryColor}14`, padding: '24px 32px' }}>
        <div style={{
          display: 'flex',
          flexDirection: headerFlexDir as any,
          alignItems: t.headerLayout === 'logo-center' ? 'center' : 'flex-start',
          gap: 16,
          justifyContent: 'space-between',
        }}>
          {/* Logo + company info */}
          {t.headerLayout !== 'no-logo' && t.showLogo && (
            <div style={{ textAlign: t.headerLayout === 'logo-center' ? 'center' : 'left' }}>
              {data.brandLogoUrl ? (
                <img
                  src={data.brandLogoUrl}
                  alt={data.brandName}
                  style={{ height: 48, objectFit: 'contain', borderRadius: 8 }}
                />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: t.primaryColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 22,
                }}>
                  {data.brandName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          <div style={{ flex: 1, textAlign: t.headerLayout === 'logo-center' ? 'center' : 'left' }}>
            {t.showCompanyName && (
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: bodySize, color: t.primaryColor }}>
                {data.brandName}
              </p>
            )}
            {t.showCompanyPhone && data.brandPhone && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>📞 {data.brandPhone}</p>
            )}
            {t.showCompanyEmail && data.brandEmail && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>✉ {data.brandEmail}</p>
            )}
            {t.showCompanyNIT && data.brandNIT && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>NIT {data.brandNIT}</p>
            )}
            {t.showCompanyAddress && data.brandAddress && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>{data.brandAddress}</p>
            )}
            {t.showCompanyWebsite && data.brandWebsite && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>{data.brandWebsite}</p>
            )}
          </div>

          {/* Quote title block */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{
              margin: '0 0 4px', fontWeight: 900,
              fontSize: headerSize, letterSpacing: 2,
              color: t.primaryColor,
            }}>
              {t.headerTitle}
            </p>
            {t.showQuoteNumber && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280', fontFamily: 'monospace' }}>
                # {quoteNum}
              </p>
            )}
            {t.showDate && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>
                {fmtDate(data.created_at)}
              </p>
            )}
            {t.showDueDate && data.due_date && (
              <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>
                Vence: {fmtDate(data.due_date)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer section ── */}
      {t.showCustomerSection && data.customerName && (
        <div style={{ padding: '16px 32px 8px' }}>
          <p style={{
            margin: '0 0 6px', fontSize: 9, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase', color: t.primaryColor,
          }}>
            Para
          </p>
          <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: bodySize }}>{data.customerName}</p>
          {data.customerEmail && (
            <p style={{ margin: '0 0 2px', fontSize: bodySize, color: '#6b7280' }}>{data.customerEmail}</p>
          )}
          {data.customerPhone && (
            <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>{data.customerPhone}</p>
          )}
        </div>
      )}

      {/* ── Items table ── */}
      <div style={{ padding: '16px 32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: bodySize }}>
          <thead>
            <tr style={{ background: t.tableHeaderBg }}>
              {t.showSKU && (
                <th style={{ padding: '8px 10px', textAlign: 'left', color: '#fff', fontWeight: 600, borderRadius: '6px 0 0 0' }}>
                  SKU
                </th>
              )}
              <th style={{ padding: '8px 10px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>
                Producto / Servicio
              </th>
              <th style={{ padding: '8px 10px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>Cant.</th>
              {t.showUnitPrice && (
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 600 }}>P. Unit.</th>
              )}
              {t.showDiscount && (
                <th style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 600 }}>Desc.</th>
              )}
              <th style={{ padding: '8px 10px', textAlign: 'right', color: '#fff', fontWeight: 600, borderRadius: '0 6px 0 0' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? t.tableBg : t.bgColor, borderBottom: `1px solid ${t.primaryColor}18` }}>
                {t.showSKU && (
                  <td style={{ padding: '8px 10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                    {item.product_sku ?? '—'}
                  </td>
                )}
                <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                  {item.product_name}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center', color: '#6b7280' }}>{item.qty}</td>
                {t.showUnitPrice && (
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#6b7280' }}>{fmtCOP(item.unit_price)}</td>
                )}
                {t.showDiscount && (
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#6b7280' }}>—</td>
                )}
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{fmtCOP(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div style={{ padding: '0 32px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: bodySize, color: '#6b7280' }}>
            <span>Subtotal</span><span>{fmtCOP(subtotal)}</span>
          </div>
          {(data.discount ?? 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: bodySize, color: '#ef4444' }}>
              <span>Descuento</span><span>−{fmtCOP(data.discount ?? 0)}</span>
            </div>
          )}
          {t.showTaxes && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: bodySize, color: '#6b7280' }}>
              <span>IVA 19%</span><span>{fmtCOP(tax)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 12px', marginTop: 6,
            background: t.primaryColor, color: '#fff',
            borderRadius: 8, fontWeight: 800, fontSize: 15,
          }}>
            <span>Total</span><span>{fmtCOP(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Notes ── */}
      {t.showNotes && data.notes && (
        <div style={{ padding: '0 32px 20px' }}>
          <p style={{
            margin: '0 0 6px', fontSize: 9, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase', color: t.primaryColor,
          }}>Notas</p>
          <div style={{ background: `${t.primaryColor}0f`, borderLeft: `3px solid ${t.primaryColor}`, borderRadius: 6, padding: '10px 14px' }}>
            <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280', whiteSpace: 'pre-wrap' }}>{data.notes}</p>
          </div>
        </div>
      )}

      {/* ── Payment terms ── */}
      {t.showPaymentTerms && t.paymentTerms && (
        <div style={{ padding: '0 32px 16px' }}>
          <p style={{
            margin: '0 0 4px', fontSize: 9, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase', color: t.primaryColor,
          }}>Condiciones</p>
          <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280' }}>{t.paymentTerms}</p>
        </div>
      )}

      {/* ── Bank info ── */}
      {t.showBankInfo && t.bankInfo && (
        <div style={{ padding: '0 32px 16px' }}>
          <p style={{
            margin: '0 0 4px', fontSize: 9, fontWeight: 700,
            letterSpacing: 2, textTransform: 'uppercase', color: t.primaryColor,
          }}>Datos bancarios</p>
          <p style={{ margin: 0, fontSize: bodySize, color: '#6b7280', whiteSpace: 'pre-wrap' }}>{t.bankInfo}</p>
        </div>
      )}

      {/* ── Signature ── */}
      {t.showSignatureLine && (
        <div style={{ display: 'flex', gap: 32, padding: '8px 32px 24px', marginTop: 16 }}>
          {['Firma autorizada', 'Firma cliente'].map(label => (
            <div key={label} style={{ flex: 1, borderTop: '1px solid #d1d5db', paddingTop: 8, textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: bodySize, color: '#9ca3af' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Action buttons (public view) ── */}
      {showActions && isPending && (
        <div style={{ padding: '20px 32px', borderTop: `1px solid ${t.primaryColor}18`, textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', fontSize: bodySize, color: '#6b7280' }}>¿Aceptas esta cotización?</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a
              href={`/cotizacion/${data.id}/responder?action=accept`}
              style={{
                display: 'inline-block', padding: '10px 24px',
                background: '#16a34a', color: '#fff',
                borderRadius: 10, fontWeight: 700, fontSize: bodySize,
                textDecoration: 'none',
              }}
            >
              ✓ Aceptar cotización
            </a>
            <a
              href={`/cotizacion/${data.id}/responder?action=reject`}
              style={{
                display: 'inline-block', padding: '10px 24px',
                background: '#fff', color: '#6b7280',
                borderRadius: 10, fontWeight: 700, fontSize: bodySize,
                textDecoration: 'none', border: '1px solid #e5e7eb',
              }}
            >
              Rechazar
            </a>
          </div>
        </div>
      )}

      {data.status === 'accepted' && (
        <div style={{ padding: '20px 32px', background: '#f0fdf4', textAlign: 'center', borderTop: '1px solid #bbf7d0' }}>
          <p style={{ margin: 0, color: '#15803d', fontWeight: 700, fontSize: bodySize }}>✓ Cotización aceptada</p>
          <p style={{ margin: '4px 0 0', color: '#16a34a', fontSize: bodySize }}>Nos pondremos en contacto contigo pronto.</p>
        </div>
      )}

      {data.status === 'rejected' && (
        <div style={{ padding: '20px 32px', background: '#fef2f2', textAlign: 'center', borderTop: '1px solid #fecaca' }}>
          <p style={{ margin: 0, color: '#dc2626', fontWeight: 700, fontSize: bodySize }}>Cotización rechazada</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: '14px 32px', textAlign: 'center',
        background: `${t.primaryColor}12`, borderTop: `1px solid ${t.primaryColor}20`,
      }}>
        <p style={{ margin: 0, fontSize: bodySize, color: '#9ca3af' }}>{t.footerText}</p>
        {t.showWatermark && (
          <p style={{ margin: '4px 0 0', fontSize: 9, color: '#d1d5db' }}>
            Generado con TurnFlow
          </p>
        )}
      </div>
    </div>
  )
}
