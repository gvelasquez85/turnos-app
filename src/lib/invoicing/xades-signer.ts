/**
 * XAdES-EPES Signer for Colombian Electronic Invoicing
 *
 * Signs UBL 2.1 XML documents according to DIAN requirements:
 * - XAdES-EPES (XML Advanced Electronic Signatures - Explicit Policy)
 * - Enveloped signature in the second UBLExtension
 * - SHA-256 for digests
 * - RSA-SHA256 for signature
 * - Canonicalization: http://www.w3.org/TR/2001/REC-xml-c14n-20010315
 *
 * NOTE: This is a simplified signer for habilitación. Production may
 * require additional policy references and timestamp validation.
 */

import { createSign, createHash, X509Certificate } from 'crypto'
import { extractFromP12 } from './test-certificate'

interface SigningParams {
  /** Unsigned XML string */
  xml: string
  /** Base64 encoded .p12 certificate */
  p12Base64: string
  /** Certificate password */
  password: string
}

interface SignedResult {
  /** Signed XML string */
  signedXml: string
  /** Digest of the signed document */
  documentDigest: string
}

// DIAN XAdES policy identifier
const POLICY_ID = 'https://facturaelectronica.dian.gov.co/politicadefirma/v2/politicadefirmav2.pdf'
const POLICY_HASH = 'dMoMvtcG5aIzgYo0tIsSQeVJBDnUnfSOfBpxXrmor0Y='
const POLICY_HASH_ALGO = 'http://www.w3.org/2001/04/xmlenc#sha256'

/**
 * Signs an XML document with XAdES-EPES envelope.
 */
export function signXML(params: SigningParams): SignedResult {
  const { xml, p12Base64, password } = params

  // Extract cert and key from PKCS#12
  const { cert: certPem, key: keyPem } = extractFromP12(p12Base64, password)

  // Parse certificate info
  const x509 = new X509Certificate(certPem)
  const certDer = x509.raw
  const certBase64 = certDer.toString('base64')
  const certDigest = createHash('sha256').update(certDer).digest('base64')
  const serialNumber = x509.serialNumber
  const issuerDN = x509.issuer

  // Generate unique IDs
  const signatureId = `xmldsig-${generateId()}`
  const signedPropsId = `${signatureId}-signedprops`
  const keyInfoId = `${signatureId}-keyinfo`
  const referenceId = `${signatureId}-ref0`
  const signingTime = new Date().toISOString()

  // Step 1: Canonicalize and digest the document (without signature)
  // Remove the empty ExtensionContent placeholder and prepare for signing
  const documentToSign = xml.replace(
    '<ext:UBLExtension>\n      <ext:ExtensionContent/>\n    </ext:UBLExtension>',
    `<ext:UBLExtension>\n      <ext:ExtensionContent>%%SIGNATURE%%</ext:ExtensionContent>\n    </ext:UBLExtension>`
  )

  // Compute document digest (of the original content, excluding signature)
  const documentDigest = computeDigest(xml)

  // Step 2: Build SignedProperties
  const signedProperties = buildSignedProperties({
    signedPropsId,
    signingTime,
    certDigest,
    certBase64,
    serialNumber,
    issuerDN,
  })

  // Compute SignedProperties digest
  const signedPropsDigest = computeDigest(signedProperties)

  // Step 3: Build KeyInfo
  const keyInfo = buildKeyInfo(keyInfoId, certBase64, x509)

  // Compute KeyInfo digest
  const keyInfoDigest = computeDigest(keyInfo)

  // Step 4: Build SignedInfo (what actually gets signed)
  const signedInfo = buildSignedInfo({
    referenceId,
    documentDigest,
    signedPropsId,
    signedPropsDigest,
    keyInfoId,
    keyInfoDigest,
  })

  // Step 5: Compute signature value
  const signer = createSign('RSA-SHA256')
  signer.update(signedInfo)
  const signatureValue = signer.sign(keyPem, 'base64')

  // Step 6: Assemble complete Signature element
  const signatureXml = buildSignatureElement({
    signatureId,
    signedInfo,
    signatureValue,
    keyInfo,
    signedProperties,
    signedPropsId,
  })

  // Step 7: Insert signature into document
  const signedXml = documentToSign.replace('%%SIGNATURE%%', signatureXml)

  return {
    signedXml,
    documentDigest,
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

function computeDigest(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('base64')
}

function buildSignedProperties(params: {
  signedPropsId: string
  signingTime: string
  certDigest: string
  certBase64: string
  serialNumber: string
  issuerDN: string
}): string {
  return [
    `<xades:SignedProperties Id="${params.signedPropsId}">`,
    `  <xades:SignedSignatureProperties>`,
    `    <xades:SigningTime>${params.signingTime}</xades:SigningTime>`,
    `    <xades:SigningCertificate>`,
    `      <xades:Cert>`,
    `        <xades:CertDigest>`,
    `          <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
    `          <ds:DigestValue>${params.certDigest}</ds:DigestValue>`,
    `        </xades:CertDigest>`,
    `        <xades:IssuerSerial>`,
    `          <ds:X509IssuerName>${params.issuerDN}</ds:X509IssuerName>`,
    `          <ds:X509SerialNumber>${parseInt(params.serialNumber, 16)}</ds:X509SerialNumber>`,
    `        </xades:IssuerSerial>`,
    `      </xades:Cert>`,
    `    </xades:SigningCertificate>`,
    `    <xades:SignaturePolicyIdentifier>`,
    `      <xades:SignaturePolicy>`,
    `        <xades:SignaturePolicyId>`,
    `          <xades:SigPolicyId>`,
    `            <xades:Identifier>${POLICY_ID}</xades:Identifier>`,
    `            <xades:Description>Política de firma para facturas electrónicas de la República de Colombia</xades:Description>`,
    `          </xades:SigPolicyId>`,
    `          <xades:SigPolicyHash>`,
    `            <ds:DigestMethod Algorithm="${POLICY_HASH_ALGO}"/>`,
    `            <ds:DigestValue>${POLICY_HASH}</ds:DigestValue>`,
    `          </xades:SigPolicyHash>`,
    `        </xades:SignaturePolicyId>`,
    `      </xades:SignaturePolicy>`,
    `    </xades:SignaturePolicyIdentifier>`,
    `    <xades:SignerRole>`,
    `      <xades:ClaimedRoles>`,
    `        <xades:ClaimedRole>supplier</xades:ClaimedRole>`,
    `      </xades:ClaimedRoles>`,
    `    </xades:SignerRole>`,
    `  </xades:SignedSignatureProperties>`,
    `</xades:SignedProperties>`,
  ].join('\n')
}

function buildKeyInfo(keyInfoId: string, certBase64: string, x509: X509Certificate): string {
  return [
    `<ds:KeyInfo Id="${keyInfoId}">`,
    `  <ds:X509Data>`,
    `    <ds:X509Certificate>${certBase64}</ds:X509Certificate>`,
    `  </ds:X509Data>`,
    `</ds:KeyInfo>`,
  ].join('\n')
}

function buildSignedInfo(params: {
  referenceId: string
  documentDigest: string
  signedPropsId: string
  signedPropsDigest: string
  keyInfoId: string
  keyInfoDigest: string
}): string {
  return [
    `<ds:SignedInfo>`,
    `  <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>`,
    `  <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>`,
    // Reference to the document
    `  <ds:Reference Id="${params.referenceId}" URI="">`,
    `    <ds:Transforms>`,
    `      <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>`,
    `    </ds:Transforms>`,
    `    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
    `    <ds:DigestValue>${params.documentDigest}</ds:DigestValue>`,
    `  </ds:Reference>`,
    // Reference to KeyInfo
    `  <ds:Reference URI="#${params.keyInfoId}">`,
    `    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
    `    <ds:DigestValue>${params.keyInfoDigest}</ds:DigestValue>`,
    `  </ds:Reference>`,
    // Reference to SignedProperties
    `  <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${params.signedPropsId}">`,
    `    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>`,
    `    <ds:DigestValue>${params.signedPropsDigest}</ds:DigestValue>`,
    `  </ds:Reference>`,
    `</ds:SignedInfo>`,
  ].join('\n')
}

function buildSignatureElement(params: {
  signatureId: string
  signedInfo: string
  signatureValue: string
  keyInfo: string
  signedProperties: string
  signedPropsId: string
}): string {
  return [
    `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${params.signatureId}">`,
    params.signedInfo,
    `  <ds:SignatureValue>${params.signatureValue}</ds:SignatureValue>`,
    params.keyInfo,
    `  <ds:Object>`,
    `    <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${params.signatureId}">`,
    params.signedProperties,
    `    </xades:QualifyingProperties>`,
    `  </ds:Object>`,
    `</ds:Signature>`,
  ].join('\n')
}
