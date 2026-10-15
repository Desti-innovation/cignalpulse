/**
 * Base email layout — wraps content in a branded HTML shell.
 * Uses tables + inline styles for maximum email client support
 * (Gmail, Outlook, Apple Mail, etc.).
 */

export type BaseLayoutOptions = {
  /** Email preview text (shown in inbox preview, hidden in body) */
  previewText?: string
  /** Main content as HTML string */
  content: string
}

export function baseLayout({
  previewText,
  content,
}: BaseLayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>CignalPulse</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${
    previewText
      ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f4f5f7;opacity:0;">${previewText}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          ${content}
        </table>
        <p style="margin:24px 0 0 0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">
          CignalPulse · Accra, Ghana<br>
          You're receiving this email because you have an account with CignalPulse.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================
// Reusable building blocks
// ============================================================

export function header(): string {
  return `
    <tr>
      <td style="padding:32px 40px 24px 40px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <div style="display:inline-block;width:32px;height:32px;background-color:#2563eb;border-radius:8px;text-align:center;line-height:32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">⚡</span>
              </div>
            </td>
            <td style="vertical-align:middle;padding-left:10px;">
              <span style="font-size:17px;font-weight:700;color:#111827;letter-spacing:-0.01em;">CignalPulse</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function contentWrapper(inner: string): string {
  return `
    <tr>
      <td style="padding:0 40px 32px 40px;">
        ${inner}
      </td>
    </tr>
  `
}

export function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#2563eb;">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function credentialsBox(items: Array<{ label: string; value: string }>): string {
  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:${i === 0 ? "16px 20px 8px 20px" : "8px 20px"};font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">
          ${item.label}
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px ${i === items.length - 1 ? "16px" : "12px"} 20px;">
          <code style="display:inline-block;font-family:'SF Mono',Monaco,Menlo,monospace;font-size:15px;font-weight:600;color:#111827;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;word-break:break-all;">
            ${item.value}
          </code>
        </td>
      </tr>
    `
    )
    .join("")

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin:20px 0;">
      ${rows}
    </table>
  `
}

export function infoBanner(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:14px 16px;font-size:13px;color:#1e40af;line-height:1.5;">
          ${text}
        </td>
      </tr>
    </table>
  `
}

export function bulletList(items: string[]): string {
  return `
    <ul style="margin:12px 0;padding-left:20px;font-size:14px;color:#374151;line-height:1.7;">
      ${items.map((item) => `<li style="margin:4px 0;">${item}</li>`).join("")}
    </ul>
  `
}

export function heading(text: string): string {
  return `
    <h1 style="margin:0 0 16px 0;font-size:24px;line-height:1.3;font-weight:700;color:#111827;letter-spacing:-0.02em;">
      ${text}
    </h1>
  `
}

export function paragraph(text: string): string {
  return `
    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">
      ${text}
    </p>
  `
}

export function divider(): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="border-top:1px solid #e5e7eb;"></td>
      </tr>
    </table>
  `
}