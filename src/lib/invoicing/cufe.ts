/**
 * CUFE / CUDE Calculator for Colombian Electronic Invoicing
 * Based on DIAN Anexo Técnico v1.9
 *
 * CUFE (Código Único de Factura Electrónica) — for invoices
 * CUDE (Código Único de Documento Electrónico) — for credit/debit notes
 *
 * Formula (invoice):
 *   SHA-384(NumFac + FecFac + HorFac + ValFac + CodImp1 + ValImp1 + CodImp2 + ValImp2 + CodImp3 + ValImp3 + ValTot + NitOFE + NumAdq + ClTec + TipoAmbiente)
 */

import { createHash } from 'crypto'

interface CufeParams {
  /** Invoice number (e.g., "SETP990000001") */
  invoiceNumber: string
  /** Issue date ISO format "YYYY-MM-DD" */
  issueDate: string
  /** Issue time "HH:MM:SS-05:00" */
  issueTime: string
  /** Invoice subtotal (before tax) */
  subtotal: number
  /** IVA tax code — "01" */
  taxCode1: string
  /** IVA amount */
  taxAmount1: number
  /** INC tax code — "04" */
  taxCode2: string
  /** INC amount */
  taxAmount2: number
  /** ICA tax code — "03" */
  taxCode3: string
  /** ICA amount */
  taxAmount3: number
  /** Total payable */
  total: number
  /** Issuer NIT (without DV) */
  issuerNit: string
  /** Customer identification number */
  customerIdNumber: string
  /** Technical key from DIAN resolution (for CUFE) or PIN (for CUDE) */
  technicalKey: string
  /** Environment: "1" = production, "2" = testing */
  environment: string
}

/**
 * Generates CUFE hash for an electronic invoice.
 * Returns lowercase hex SHA-384.
 */
export function generateCUFE(params: CufeParams): string {
  const {
    invoiceNumber,
    issueDate,
    issueTime,
    subtotal,
    taxCode1,
    taxAmount1,
    taxCode2,
    taxAmount2,
    taxCode3,
    taxAmount3,
    total,
    issuerNit,
    customerIdNumber,
    technicalKey,
    environment,
  } = params

  // Format amounts with 2 decimal places
  const fmtAmt = (n: number) => n.toFixed(2)

  const concatenated = [
    invoiceNumber,
    issueDate,
    issueTime,
    fmtAmt(subtotal),
    taxCode1,
    fmtAmt(taxAmount1),
    taxCode2,
    fmtAmt(taxAmount2),
    taxCode3,
    fmtAmt(taxAmount3),
    fmtAmt(total),
    issuerNit,
    customerIdNumber,
    technicalKey,
    environment,
  ].join('')

  return createHash('sha384').update(concatenated, 'utf8').digest('hex')
}

/**
 * Generates CUDE hash for credit/debit notes.
 * Same formula but uses PIN instead of technical key.
 */
export function generateCUDE(params: CufeParams): string {
  // Same algorithm, different semantic (PIN vs technical key)
  return generateCUFE(params)
}

/**
 * Generates QR code URL for DIAN validation.
 */
export function generateQRUrl(cufe: string, environment: string): string {
  const baseUrl = environment === '1'
    ? 'https://catalogo-vpfe.dian.gov.co/document/searchqr'
    : 'https://catalogo-vpfe-hab.dian.gov.co/document/searchqr'
  return `${baseUrl}?documentkey=${cufe}`
}
