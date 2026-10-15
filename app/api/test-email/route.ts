import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { renderWelcomeEmail } from "@/lib/email-templates/welcome"

/**
 * Test endpoint for email sending.
 *
 * Usage:
 *   GET /api/test-email?to=you@example.com
 *
 * This sends a welcome email with fake credentials so you can
 * confirm the pipeline works before wiring it into production.
 */
export async function GET(req: Request) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoint disabled in production." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const to = searchParams.get("to")

  if (!to) {
    return NextResponse.json(
      { error: "Missing ?to= parameter. Example: /api/test-email?to=you@example.com" },
      { status: 400 }
    )
  }

  const email = renderWelcomeEmail({
    companyName: "Test Company Ltd.",
    username: "test-company",
    password: "Pulse-Ab12-Cd34",
    loginUrl: "http://localhost:3000/login",
  })

  const result = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })

  return NextResponse.json({
    success: result.success,
    emailId: result.id,
    error: result.error,
    note: result.success
      ? "Check your inbox (and spam folder) — you should receive a welcome email."
      : "Sending failed — check the terminal for details.",
  })
}