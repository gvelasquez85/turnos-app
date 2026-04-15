export type Currency = 'USD' | 'COP'

export interface MoneyAmount {
  amount: number
  currency: Currency
}

export interface CreateOrderParams {
  moduleKey: string
  amount: number
  currency: Currency
}

export interface CaptureOrderParams {
  orderId: string
  moduleKey: string
}

export interface CaptureResult {
  success: boolean
  expiresAt: string
}

export interface CreateSubscriptionParams {
  amount: number
  currency: Currency
  returnUrl: string
  cancelUrl: string
  description?: string
}

export interface SubscriptionResult {
  subscriptionId: string
  planId?: string
  approvalUrl: string
}

export interface PaymentProviderConfig {
  name: string
  displayName: string
  supportedCurrencies: Currency[]
  logoUrl?: string
}

export interface PaymentProvider {
  config: PaymentProviderConfig
}
