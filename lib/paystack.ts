import "server-only"

// ============================================================
// Paystack Configuration
// ============================================================

const PAYSTACK_BASE_URL = "https://api.paystack.co"
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY is not configured")
}

// Platform fee — charged on top of Paystack's own fee
export const PLATFORM_FEE_GHS = 0.50

// Approximate Paystack fee: 1.95% of the amount
// (Paystack's real fee varies slightly, but this is close enough for display)
export function estimatePaystackFee(amountGhs: number): number {
  return Math.round(amountGhs * 0.0195 * 100) / 100
}

// ============================================================
// Types
// ============================================================

export type PaystackInitResponse = {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export type PaystackVerifyResponse = {
  status: boolean
  message: string
  data?: {
    id: number
    domain: string
    status: "success" | "failed" | "abandoned" | "ongoing" | "pending"
    reference: string
    amount: number              // in pesewas
    gateway_response: string
    paid_at: string | null
    channel: string             // "card" | "mobile_money" | "bank_transfer"
    currency: string
    customer: {
      email: string
      phone?: string
    }
    fees: number | null         // in pesewas
  }
}

// ============================================================
// Internal Request Helper
// ============================================================

async function paystackRequest<T>(
  method: "GET" | "POST",
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  const json = (await res.json()) as T

  if (!res.ok) {
    throw new Error(
      `Paystack ${endpoint} failed (${res.status}): ${JSON.stringify(json)}`
    )
  }

  return json
}

// ============================================================
// Public API
// ============================================================

export const paystack = {
  /**
   * Initialize a transaction. Returns authorization_url for redirect.
   * Amount must be in pesewas (integer).
   */
  async initializeTransaction(params: {
    email: string
    amountPesewas: number
    reference: string
    callbackUrl: string
    metadata?: Record<string, unknown>
  }): Promise<PaystackInitResponse> {
    return paystackRequest<PaystackInitResponse>(
      "POST",
      "/transaction/initialize",
      {
        email: params.email,
        amount: params.amountPesewas,
        reference: params.reference,
        callback_url: params.callbackUrl,
        currency: "GHS",
        channels: ["card", "mobile_money", "bank_transfer"],
        metadata: params.metadata,
      }
    )
  },

  /**
   * Verify a transaction by reference.
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    return paystackRequest<PaystackVerifyResponse>(
      "GET",
      `/transaction/verify/${encodeURIComponent(reference)}`
    )
  },

  /**
   * List successful transactions since a given date.
   * Used by the reconciliation cron.
   */
  async listTransactions(params: {
    from: string  // ISO date
    to: string    // ISO date
    status?: "success" | "failed" | "abandoned"
    perPage?: number
  }): Promise<{
    status: boolean
    message: string
    data: Array<{
      id: number
      reference: string
      amount: number
      status: string
      paid_at: string | null
      currency: string
    }>
  }> {
    const query = new URLSearchParams({
      from: params.from,
      to: params.to,
      perPage: String(params.perPage ?? 100),
    })
    if (params.status) query.set("status", params.status)

    return paystackRequest<{
      status: boolean
      message: string
      data: Array<{
        id: number
        reference: string
        amount: number
        status: string
        paid_at: string | null
        currency: string
      }>
    }>("GET", `/transaction?${query.toString()}`)
  },
}