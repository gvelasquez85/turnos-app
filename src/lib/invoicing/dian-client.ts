/**
 * DIAN Web Service Client
 * Handles SOAP communication with DIAN for electronic document transmission.
 *
 * Endpoints:
 * - Habilitación (testing): https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc
 * - Producción: https://vpfe.dian.gov.co/WcfDianCustomerServices.svc
 *
 * Operations:
 * - SendBillSync: Send and validate document synchronously
 * - GetStatus: Check document status by trackId
 * - GetStatusZip: Check status of a ZIP submission
 */

const DIAN_ENDPOINTS = {
  testing: 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc',
  production: 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc',
}

const SOAP_ACTION_BASE = 'http://wcf.dian.colombia/IWcfDianCustomerServices'

interface DianResponse {
  success: boolean
  statusCode: string
  statusDescription: string
  statusMessage: string
  trackId?: string
  xmlResponse?: string
  errors: string[]
  warnings: string[]
}

/**
 * Sends an electronic document to DIAN synchronously.
 * The XML must be signed (XAdES-EPES) and base64-encoded before calling.
 */
export async function sendBillSync(
  signedXmlBase64: string,
  fileName: string,
  environment: 'testing' | 'production'
): Promise<DianResponse> {
  const endpoint = DIAN_ENDPOINTS[environment]

  const soapEnvelope = `
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
  <soap:Header/>
  <soap:Body>
    <wcf:SendBillSync>
      <wcf:fileName>${fileName}</wcf:fileName>
      <wcf:contentFile>${signedXmlBase64}</wcf:contentFile>
    </wcf:SendBillSync>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml;charset=UTF-8',
        'SOAPAction': `${SOAP_ACTION_BASE}/SendBillSync`,
      },
      body: soapEnvelope,
    })

    const text = await response.text()
    return parseDianResponse(text, 'SendBillSyncResponse')
  } catch (error: any) {
    return {
      success: false,
      statusCode: 'CONNECTION_ERROR',
      statusDescription: 'Error de conexión con DIAN',
      statusMessage: error.message || 'No se pudo conectar con el servicio de DIAN',
      errors: [error.message || 'Connection failed'],
      warnings: [],
    }
  }
}

/**
 * Checks the status of a previously submitted document by trackId.
 */
export async function getStatus(
  trackId: string,
  environment: 'testing' | 'production'
): Promise<DianResponse> {
  const endpoint = DIAN_ENDPOINTS[environment]

  const soapEnvelope = `
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia">
  <soap:Header/>
  <soap:Body>
    <wcf:GetStatus>
      <wcf:trackId>${trackId}</wcf:trackId>
    </wcf:GetStatus>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml;charset=UTF-8',
        'SOAPAction': `${SOAP_ACTION_BASE}/GetStatus`,
      },
      body: soapEnvelope,
    })

    const text = await response.text()
    return parseDianResponse(text, 'GetStatusResponse')
  } catch (error: any) {
    return {
      success: false,
      statusCode: 'CONNECTION_ERROR',
      statusDescription: 'Error de conexión con DIAN',
      statusMessage: error.message || 'No se pudo conectar con el servicio de DIAN',
      errors: [error.message || 'Connection failed'],
      warnings: [],
    }
  }
}

/**
 * Parses DIAN SOAP response XML.
 */
function parseDianResponse(xml: string, responseTag: string): DianResponse {
  const result: DianResponse = {
    success: false,
    statusCode: '',
    statusDescription: '',
    statusMessage: '',
    errors: [],
    warnings: [],
  }

  try {
    // Extract StatusCode
    const statusCodeMatch = xml.match(/<b:StatusCode>([\s\S]*?)<\/b:StatusCode>/)
    result.statusCode = statusCodeMatch?.[1] ?? ''

    // Extract StatusDescription
    const statusDescMatch = xml.match(/<b:StatusDescription>([\s\S]*?)<\/b:StatusDescription>/)
    result.statusDescription = statusDescMatch?.[1] ?? ''

    // Extract StatusMessage
    const statusMsgMatch = xml.match(/<b:StatusMessage>([\s\S]*?)<\/b:StatusMessage>/)
    result.statusMessage = statusMsgMatch?.[1] ?? ''

    // Extract TrackId (XmlDocumentKey)
    const trackIdMatch = xml.match(/<b:XmlDocumentKey>([\s\S]*?)<\/b:XmlDocumentKey>/)
    result.trackId = trackIdMatch?.[1] ?? undefined

    // Extract errors
    const errorsMatch = xml.match(/<b:ErrorMessage>([\s\S]*?)<\/b:ErrorMessage>/g)
    if (errorsMatch) {
      for (const err of errorsMatch) {
        const msgMatch = err.match(/<b:ErrorMessage>([\s\S]*?)<\/b:ErrorMessage>/)
        if (msgMatch?.[1]) result.errors.push(msgMatch[1])
      }
    }

    // Check success (StatusCode "00" = accepted)
    result.success = result.statusCode === '00'
    result.xmlResponse = xml
  } catch (e: any) {
    result.errors.push(`Error parsing DIAN response: ${e.message}`)
  }

  return result
}

/**
 * Generates the software security code.
 * SHA-384(softwareId + pin + invoiceNumber)
 */
export function generateSoftwareSecurityCode(
  softwareId: string,
  pin: string,
  invoiceNumber: string
): string {
  const { createHash } = require('crypto')
  return createHash('sha384').update(`${softwareId}${pin}${invoiceNumber}`, 'utf8').digest('hex')
}
