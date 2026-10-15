import {
  baseLayout,
  header,
  contentWrapper,
  ctaButton,
  credentialsBox,
  infoBanner,
  bulletList,
  heading,
  paragraph,
  divider,
} from "./base"

// ============================================================
// Types
// ============================================================

export type WelcomeEmailParams = {
  companyName: string
  username: string
  password: string
  loginUrl: string
  supportEmail?: string
}

// ============================================================
// Render
// ============================================================

export function renderWelcomeEmail(params: WelcomeEmailParams): {
  subject: string
  html: string
  text: string
} {
  const {
    companyName,
    username,
    password,
    loginUrl,
    supportEmail = "support@cignalpulse.com",
  } = params

  const subject = `Welcome to CignalPulse — Your account is ready`

  // -------- HTML --------
  const inner = `
    ${heading(`Welcome, ${companyName}!`)}
    ${paragraph(
      "Your CignalPulse account is ready to go. We've set up your login credentials below — keep this email safe, you'll need it to sign in."
    )}

    ${credentialsBox([
      { label: "Username", value: username },
      { label: "Password", value: password },
    ])}

    ${ctaButton("Login to Your Account", loginUrl)}

    ${infoBanner(
      `<strong>⚠ For your security:</strong> You'll be asked to change this password the first time you log in. Choose something strong that you haven't used elsewhere.`
    )}

    ${divider()}

    <p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#111827;font-weight:600;">
      Getting started
    </p>
    ${bulletList([
      "<strong>Top up your wallet</strong> — add funds securely via Paystack",
      "<strong>Buy SMS credits</strong> — pick a bundle that fits your volume",
      "<strong>Import your contacts</strong> — CSV upload or add them manually",
      "<strong>Send your first campaign</strong> — to individuals, lists, or groups",
    ])}

    <p style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#6b7280;">
      Questions? Reply to this email or reach us at
      <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:underline;">${supportEmail}</a>.
    </p>
  `

  const html = baseLayout({
    previewText: `Your CignalPulse account is ready. Username: ${username}`,
    content: header() + contentWrapper(inner),
  })

  // -------- Plain text fallback --------
  const text = `Welcome to CignalPulse, ${companyName}!

Your account is ready. Here are your login credentials:

  Username: ${username}
  Password: ${password}

Login here: ${loginUrl}

⚠ For your security, you'll be asked to change this password on first login.

Getting started:
  • Top up your wallet
  • Buy SMS credits
  • Import your contacts
  • Send your first campaign

Need help? Reply to this email or contact ${supportEmail}.

— The CignalPulse Team
`

  return { subject, html, text }
}