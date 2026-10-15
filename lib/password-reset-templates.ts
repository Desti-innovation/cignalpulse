/**
 * Templates for password reset OTP delivery.
 */

export function buildOtpSmsMessage(code: string): string {
  return `Your CignalPulse verification code is ${code}. It expires in 15 minutes. Never share this code.`
}

export type OtpEmailTemplate = {
  subject: string
  html: string
  text: string
}

export function buildOtpEmailTemplate(params: {
  displayName: string
  code: string
  channels: { email: boolean; sms: boolean }
}): OtpEmailTemplate {
  const { displayName, code, channels } = params
  const subject = `Your CignalPulse verification code: ${code}`

  const channelLine =
    channels.sms && channels.email
      ? "We sent this code to your email and your registered phone."
      : channels.email
      ? "We sent this code to your email."
      : channels.sms
      ? "We sent this code to your registered phone."
      : ""

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827;">Password reset</h1>
                <p style="margin:8px 0 0 0;font-size:14px;color:#6b7280;line-height:1.5;">
                  Hi ${escapeHtml(displayName)}, use the code below to reset your password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;">
                  <p style="margin:0 0 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#1d4ed8;font-weight:600;">Verification code</p>
                  <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:32px;font-weight:700;letter-spacing:0.2em;color:#111827;">${code}</p>
                </div>
                <p style="margin:16px 0 0 0;font-size:13px;color:#6b7280;line-height:1.5;">
                  This code expires in <strong>15 minutes</strong>. ${escapeHtml(channelLine)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                    If you didn't request a password reset, you can safely ignore this email — your password won't change.
                  </p>
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#9ca3af;">CignalPulse — SMS for modern businesses</p>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Password reset

Hi ${displayName}, use the code below to reset your password.

Verification code: ${code}

This code expires in 15 minutes. ${channelLine}

If you didn't request a password reset, you can safely ignore this email — your password won't change.

— CignalPulse`

  return { subject, html, text }
}

export function buildPasswordChangedEmail(params: {
  displayName: string
}): OtpEmailTemplate {
  const { displayName } = params
  const subject = "Your CignalPulse password was changed"

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;">Password changed</h1>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                  Hi ${escapeHtml(displayName)}, your CignalPulse password was just changed successfully.
                </p>
                <p style="margin:16px 0 0 0;font-size:14px;color:#374151;line-height:1.6;">
                  If this wasn't you, contact support immediately at
                  <a href="mailto:support@cignalpulse.com" style="color:#2563eb;text-decoration:none;">support@cignalpulse.com</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = `Password changed

Hi ${displayName}, your CignalPulse password was just changed successfully.

If this wasn't you, contact support immediately at support@cignalpulse.com.

— CignalPulse`

  return { subject, html, text }
}

export function buildPasswordChangedSms(): string {
  return `Your CignalPulse password was just changed. If this wasn't you, contact support immediately at support@cignalpulse.com`
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}