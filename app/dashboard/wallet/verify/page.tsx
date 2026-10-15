import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { verifyPaystackPayment } from "@/app/actions/wallet"

export const dynamic = "force-dynamic"

export default async function VerifyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { reference } = await searchParams

  if (!reference) {
    redirect("/dashboard/wallet?error=missing_reference")
  }

  const result = await verifyPaystackPayment(reference)

  if (result.success) {
    redirect(`/dashboard/wallet?topup=success&amount=${result.amountCredited}`)
  } else {
    redirect(
      `/dashboard/wallet?topup=failed&error=${encodeURIComponent(result.error || "unknown")}`
    )
  }
}