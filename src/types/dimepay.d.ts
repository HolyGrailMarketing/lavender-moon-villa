declare module '@dimepay/web-sdk' {
  export interface DimePayConfig {
    mountId: string
    client_id: string
    order_id: string
    total: number
    currency: string
    data: string
    test?: boolean
    styles?: {
      primaryColor?: string
      buttonColor?: string
      buttonTextColor?: string
      backgroundColor?: string
      noBorderRadius?: boolean
      width?: string
      height?: string
    }
    payment_methods?: {
      apple_pay?: boolean
      google_pay?: boolean
      samsung_pay?: boolean
    }
    onReady?: () => void
    onSuccess?: (data: any) => void
    onFailed?: (error: any) => void
    onError?: (error: any) => void
    onCancel?: () => void
  }

  export function initPayment(config: DimePayConfig): void
  export function initCard(config: DimePayConfig): void
}

