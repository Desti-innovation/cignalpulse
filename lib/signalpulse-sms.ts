import "server-only"

/**
 * CignalPulse SMS Gateway
 *
 * Internal abstraction layer for all outbound SMS operations.
 *
 * Design note: this file encapsulates ALL provider-specific logic.
 * If we ever switch SMS providers, only this file needs to change —
 * no other file in the codebase is aware of the underlying gateway.
 */

// Provider-agnostic base URL (kept in a private constant, not exported)
const GATEWAY_BASE_URL = "https://api.mnotify.com/api"

// ---------- Key handling (defensive) ----------
//
// Strip surrounding quotes and whitespace so a config like:
//   SIGNALPULSE_SMS_KEY=""
// or
//   SIGNALPULSE_SMS_KEY="abc123"
// or a Windows CRLF-corrupted file
// all behave predictably.

const RAW_KEY = process.env.SIGNALPULSE_SMS_KEY ?? ""
const GATEWAY_KEY = RAW_KEY.replace(/^["']|["']$/g, "").trim()

// Debug — remove after verifying the key loads correctly
console.log(
  "[SMS] GATEWAY_KEY length:",
  GATEWAY_KEY.length,
  "preview:",
  GATEWAY_KEY
    ? `${GATEWAY_KEY.slice(0, 6)}...${GATEWAY_KEY.slice(-4)}`
    : "(empty)"
)

if (!GATEWAY_KEY) {
  throw new Error(
    "SIGNALPULSE_SMS_KEY is not configured (or is empty/quoted). Set it in .env.local without quotes."
  )
}

// ---------- Public Types (CignalPulse-branded) ----------

export type SendSmsRecipient = string

export type SendSmsParams = {
  recipients: SendSmsRecipient[]
  senderId: string
  message: string
  scheduledAt?: string
  isOtp?: boolean
}

export type SendSmsResult = {
  success: boolean
  campaignId?: string
  totalSent?: number
  totalRejected?: number
  creditsUsed?: number
  creditsLeft?: number
  error?: string
}

export type SmsBalance = {
  credits: number
  bonus: number
}

export type SenderIdStatus = "Pending" | "Approved" | "Rejected" | "Unknown"

export type DeliveryStatus =
  | "PENDING"
  | "SUBMITTED"
  | "DELIVERED"
  | "FAILED"
  | "REJECTED"
  | "UNKNOWN"

// ---------- Internal Gateway Helper ----------

type GatewayResponse<T> = T & {
  status: "success" | "error"
  code?: string
  message?: string
}

async function gatewayRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: Record<string, unknown>,
  searchParams?: Record<string, string>
): Promise<GatewayResponse<T>> {
  const params = new URLSearchParams()

  params.set("key", GATEWAY_KEY)

  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      params.set(k, v)
    }
  }

  const url = `${GATEWAY_BASE_URL}${endpoint}?${params.toString()}`

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  // ---- Read the body FIRST so we can log it on failure ----
  const text = await res.text()

  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    // Non-JSON response — keep the raw text for diagnostics
  }

  if (!res.ok) {
    // Debug log the raw response so we can see WHY the gateway rejected us
    console.error(
      `[SMS gateway] ${method} ${endpoint} → HTTP ${res.status} ${res.statusText}`
    )
    console.error("[SMS gateway] response body:", text.slice(0, 500))
    throw new Error(
      `SMS gateway request failed (${res.status}): ${text.slice(0, 200) || res.statusText}`
    )
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(
      `SMS gateway returned non-JSON response: ${text.slice(0, 200)}`
    )
  }

  return parsed as GatewayResponse<T>
}

// ---------- Public API (CignalPulse-branded) ----------

export const sms = {
  /**
   * Send a bulk SMS to a list of recipients.
   */
  async send(params: SendSmsParams): Promise<SendSmsResult> {
    try {
      const payload: Record<string, unknown> = {
        recipient: params.recipients,
        sender: params.senderId,
        message: params.message,
        is_schedule: Boolean(params.scheduledAt),
        schedule_date: params.scheduledAt ?? "",
      }

      if (params.isOtp) {
        payload.sms_type = "otp"
      }

      const response = await gatewayRequest<{
        summary: {
          _id: string
          total_sent: number
          total_rejected: number
          credit_used: number
          credit_left: number
        }
      }>("POST", "/sms/quick", payload)

      if (response.status !== "success") {
        return { success: false, error: response.message || "Send failed" }
      }

      return {
        success: true,
        campaignId: response.summary._id,
        totalSent: response.summary.total_sent,
        totalRejected: response.summary.total_rejected,
        creditsUsed: response.summary.credit_used,
        creditsLeft: response.summary.credit_left,
      }
    } catch (error) {
      console.error("[CignalPulse SMS] Send failed:", error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send SMS. Please try again.",
      }
    }
  },

  /**
   * Get the current CignalPulse SMS credit balance.
   */
  async getBalance(): Promise<SmsBalance> {
    try {
      const response = await gatewayRequest<{
        balance: number
        bonus: number
      }>("GET", "/balance/sms")

      return {
        credits: response.balance ?? 0,
        bonus: response.bonus ?? 0,
      }
    } catch (error) {
      console.error("[CignalPulse SMS] Balance check failed:", error)
      return { credits: 0, bonus: 0 }
    }
  },

  /**
   * Register a new Sender ID with the underlying network.
   */
  async registerSenderId(
    senderId: string,
    purpose: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await gatewayRequest<{
        summary: { sender_name: string; status: string }
      }>("POST", "/senderid/register", {
        sender_name: senderId,
        purpose,
      })

      if (response.status !== "success") {
        return {
          success: false,
          error: response.message || "Registration failed",
        }
      }

      return { success: true }
    } catch (error) {
      console.error(
        "[CignalPulse SMS] Sender ID registration failed:",
        error
      )
      return { success: false, error: "Unable to register Sender ID." }
    }
  },

  /**
   * Raw sender ID registration — returns the full gateway response so the
   * admin layer can log it for audit purposes. Prefer `registerSenderId`
   * for user-facing logic.
   */
  async registerSenderIdRaw(
    senderId: string,
    purpose: string
  ): Promise<{
    status: "success" | "error"
    gatewayStatus: SenderIdStatus
    raw: unknown
    error?: string
  }> {
    try {
      const response = await gatewayRequest<{
        summary: { sender_name: string; status: string }
      }>("POST", "/senderid/register", {
        sender_name: senderId,
        purpose,
      })

      const gatewayStatusRaw = response.summary?.status
      const gatewayStatus: SenderIdStatus =
        gatewayStatusRaw === "Pending" ||
        gatewayStatusRaw === "Approved" ||
        gatewayStatusRaw === "Rejected"
          ? gatewayStatusRaw
          : "Unknown"

      return {
        status: response.status,
        gatewayStatus,
        raw: response,
        error: response.status !== "success" ? response.message : undefined,
      }
    } catch (error) {
      console.error(
        "[CignalPulse SMS] Sender ID registration failed:",
        error
      )
      return {
        status: "error",
        gatewayStatus: "Unknown",
        raw: { error: error instanceof Error ? error.message : "unknown" },
        error: "Unable to register Sender ID.",
      }
    }
  },

  /**
   * Check the status of a Sender ID.
   */
  async getSenderIdStatus(senderId: string): Promise<SenderIdStatus> {
    try {
      const response = await gatewayRequest<{
        summary: { "sender name": string; status: string }
      }>("POST", "/senderid/status", { sender_name: senderId })

      const status = response.summary?.status
      if (
        status === "Pending" ||
        status === "Approved" ||
        status === "Rejected"
      ) {
        return status
      }
      return "Unknown"
    } catch (error) {
      console.error(
        "[CignalPulse SMS] Sender ID status check failed:",
        error
      )
      return "Unknown"
    }
  },

  /**
   * Raw sender ID status check — returns the full gateway response so the
   * admin layer can log it for audit purposes. Prefer `getSenderIdStatus`
   * for user-facing logic.
   */
  async getSenderIdStatusRaw(senderId: string): Promise<{
    status: "success" | "error"
    gatewayStatus: SenderIdStatus
    raw: unknown
  }> {
    try {
      const response = await gatewayRequest<{
        summary: { "sender name": string; status: string }
      }>("POST", "/senderid/status", { sender_name: senderId })

      const status = response.summary?.status
      const gatewayStatus: SenderIdStatus =
        status === "Pending" ||
        status === "Approved" ||
        status === "Rejected"
          ? status
          : "Unknown"

      return {
        status: response.status,
        gatewayStatus,
        raw: response,
      }
    } catch (error) {
      console.error(
        "[CignalPulse SMS] Sender ID status check failed:",
        error
      )
      return {
        status: "error",
        gatewayStatus: "Unknown",
        raw: { error: error instanceof Error ? error.message : "unknown" },
      }
    }
  },

  /**
   * Get the delivery report for a campaign.
   */
  async getCampaignReport(
    campaignId: string,
    status?: DeliveryStatus
  ): Promise<
    Array<{
      messageId: string
      recipient: string
      message: string
      sender: string
      status: DeliveryStatus
      dateSent: string
      retries: number
    }>
  > {
    try {
      const endpoint = status
        ? `/campaign/${campaignId}/${status.toLowerCase()}`
        : `/campaign/${campaignId}`

      const response = await gatewayRequest<{
        report: Array<{
          _id: number
          recipient: string
          message: string
          sender: string
          status: string
          date_sent: string
          retries: number
        }>
      }>("GET", endpoint)

      return (response.report ?? []).map((r) => ({
        messageId: String(r._id),
        recipient: r.recipient,
        message: r.message,
        sender: r.sender,
        status: r.status as DeliveryStatus,
        dateSent: r.date_sent,
        retries: r.retries,
      }))
    } catch (error) {
      console.error("[CignalPulse SMS] Campaign report failed:", error)
      return []
    }
  },
}