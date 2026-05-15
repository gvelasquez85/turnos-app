/**
 * Test Certificate Generator
 *
 * Generates a self-signed PKCS#12 (.p12) certificate for DIAN's
 * habilitación (testing) environment. This certificate is NOT valid
 * for production — production requires a certificate from an
 * authorized CA (e.g., Certicámara, GSE, Andes SCD).
 *
 * Uses Node.js built-in crypto + forge for PKCS#12 packaging.
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

interface CertificateInfo {
  companyName: string
  nit: string
  email?: string
  password: string
}

interface GeneratedCertificate {
  /** Base64 encoded .p12 file */
  p12Base64: string
  /** Certificate serial number */
  serialNumber: string
  /** Certificate valid from */
  validFrom: string
  /** Certificate valid to */
  validTo: string
  /** Password used */
  password: string
  /** Warning message */
  warning: string
}

/**
 * Generates a self-signed test certificate using OpenSSL CLI.
 * Requires openssl to be available in PATH.
 *
 * The certificate is:
 * - Self-signed (not issued by a real CA)
 * - Valid for 1 year
 * - RSA 2048-bit key
 * - PKCS#12 format (.p12)
 *
 * ONLY for DIAN habilitación environment.
 */
export function generateTestCertificate(info: CertificateInfo): GeneratedCertificate {
  const tmpDir = join('/tmp', `cert-${randomUUID()}`)
  mkdirSync(tmpDir, { recursive: true })

  const keyFile = join(tmpDir, 'key.pem')
  const certFile = join(tmpDir, 'cert.pem')
  const p12File = join(tmpDir, 'cert.p12')

  try {
    const subject = `/C=CO/O=${info.companyName.replace(/[^a-zA-Z0-9 ]/g, '')}/CN=${info.nit}/emailAddress=${info.email || 'test@test.com'}`

    // Generate RSA private key
    execSync(`openssl genrsa -out "${keyFile}" 2048 2>/dev/null`)

    // Generate self-signed certificate (valid 365 days)
    execSync(
      `openssl req -new -x509 -key "${keyFile}" -out "${certFile}" -days 365 -subj "${subject}" 2>/dev/null`
    )

    // Package as PKCS#12
    execSync(
      `openssl pkcs12 -export -out "${p12File}" -inkey "${keyFile}" -in "${certFile}" -passout pass:${info.password} 2>/dev/null`
    )

    const p12Buffer = readFileSync(p12File)
    const p12Base64 = p12Buffer.toString('base64')

    // Extract cert info
    const certInfo = execSync(
      `openssl x509 -in "${certFile}" -noout -serial -startdate -enddate 2>/dev/null`
    ).toString()

    const serialMatch = certInfo.match(/serial=([A-F0-9]+)/i)
    const startMatch = certInfo.match(/notBefore=(.+)/)
    const endMatch = certInfo.match(/notAfter=(.+)/)

    return {
      p12Base64,
      serialNumber: serialMatch?.[1] ?? 'unknown',
      validFrom: startMatch?.[1]?.trim() ?? new Date().toISOString(),
      validTo: endMatch?.[1]?.trim() ?? new Date(Date.now() + 365 * 86400000).toISOString(),
      password: info.password,
      warning: '⚠️ Certificado de PRUEBAS autofirmado. Solo válido para el ambiente de habilitación de DIAN. Para producción necesitas un certificado de una CA autorizada (Certicámara, GSE, Andes SCD).',
    }
  } finally {
    // Cleanup temp files
    try { unlinkSync(keyFile) } catch {}
    try { unlinkSync(certFile) } catch {}
    try { unlinkSync(p12File) } catch {}
    try { require('fs').rmdirSync(tmpDir) } catch {}
  }
}

/**
 * Extracts certificate and private key from a PKCS#12 buffer.
 * Returns PEM strings.
 */
export function extractFromP12(p12Base64: string, password: string): { cert: string; key: string } {
  const tmpDir = join('/tmp', `cert-extract-${randomUUID()}`)
  mkdirSync(tmpDir, { recursive: true })

  const p12File = join(tmpDir, 'cert.p12')
  const certFile = join(tmpDir, 'cert.pem')
  const keyFile = join(tmpDir, 'key.pem')

  try {
    writeFileSync(p12File, Buffer.from(p12Base64, 'base64'))

    // Extract certificate
    execSync(
      `openssl pkcs12 -in "${p12File}" -clcerts -nokeys -out "${certFile}" -passin pass:${password} 2>/dev/null`
    )

    // Extract private key
    execSync(
      `openssl pkcs12 -in "${p12File}" -nocerts -nodes -out "${keyFile}" -passin pass:${password} 2>/dev/null`
    )

    const cert = readFileSync(certFile, 'utf-8')
    const key = readFileSync(keyFile, 'utf-8')

    return { cert, key }
  } finally {
    try { unlinkSync(p12File) } catch {}
    try { unlinkSync(certFile) } catch {}
    try { unlinkSync(keyFile) } catch {}
    try { require('fs').rmdirSync(tmpDir) } catch {}
  }
}
