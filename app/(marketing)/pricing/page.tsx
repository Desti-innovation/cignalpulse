import Link from "next/link"
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  Infinity as InfinityIcon,
  Clock,
  Sparkles,
} from "lucide-react"

export const metadata = {
  title: "Pricing · CignalPulse",
  description:
    "Transparent SMS pricing for Ghanaian businesses. Buy bundles from GH₵ 20 — pay only for what you send.",
}

export const dynamic = "force-dynamic"

type Bundle = {
  id: number
  name: string
  credits: number
  price_ghs: number
  bonus_credits: number
  description: string | null
  bundle_type: "non_expiry" | "expiry"
  validity_days: number | null
  sort_order: number
}

export default async function PricingPage() {
  const rows = await sql`
    SELECT
      id, name, credits, price_ghs, bonus_credits, description,
      bundle_type, validity_days, sort_order
    FROM sms_bundles
    WHERE is_active = true
    ORDER BY bundle_type ASC, sort_order ASC, price_ghs ASC
  `

  const bundles: Bundle[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    credits: b.credits,
    price_ghs: Number(b.price_ghs),
    bonus_credits: b.bonus_credits,
    description: b.description,
    bundle_type: (b.bundle_type ?? "non_expiry") as "non_expiry" | "expiry",
    validity_days: b.validity_days,
    sort_order: b.sort_order,
  }))

  const expiringBundles = bundles.filter((b) => b.bundle_type === "expiry")
  const permanentBundles = bundles.filter((b) => b.bundle_type === "non_expiry")

  return (
    <>
      {/* HERO */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 mb-6">
            <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Pay only for what you send
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            No monthly fees. No contracts. Buy a bundle, use it when you need it,
            and top up anytime. Prices drop as you buy more.
          </p>
        </div>
      </section>

      {/* EXPIRING BUNDLES */}
      {expiringBundles.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                <Clock className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Flash bundles</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cheaper per SMS — but credits expire. Perfect for one-off campaigns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {expiringBundles.map((b) => (
                <BundleCard key={b.id} bundle={b} variant="expiry" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NON-EXPIRING BUNDLES */}
      {permanentBundles.length > 0 && (
        <section className="py-8 md:py-12 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                <InfinityIcon className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Permanent bundles</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Credits never expire. Best value for steady senders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {permanentBundles.map((b) => (
                <BundleCard key={b.id} bundle={b} variant="permanent" />
              ))}
            </div>
          </div>
        </section>
      )}

      {bundles.length === 0 && (
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Pricing is being updated. Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* PRICING NOTES */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            What&apos;s included with every plan
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Your own approved sender ID",
              "Real-time delivery reports",
              "Unlimited contact storage",
              "Unlimited contact groups",
              "Scheduled campaigns",
              "CSV import & export",
              "Wallet balance tracking",
              "Email + SMS support",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800"
              >
                <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            <Faq
              q="Do credits expire?"
              a="Credits in permanent bundles never expire. Flash bundles come with a 30-day validity — perfect if you only send occasionally and want the lowest price."
            />
            <Faq
              q="What payment methods do you accept?"
              a="Mobile Money (MTN, Vodafone, AirtelTigo) and all major cards via Paystack. Top-ups are instant."
            />
            <Faq
              q="Are there hidden fees?"
              a="No. The price you see is what you pay. Network fees are already included in the per-SMS rate."
            />
            <Faq
              q="Can I get my own sender ID?"
              a="Yes. Register your brand name during sign-up or later from your dashboard. Approval typically takes 24–72 hours."
            />
            <Faq
              q="What if I need more than 50,000 SMS?"
              a="Contact us for custom enterprise pricing. We offer discounts for volumes above 100,000 SMS per month."
            />
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Still have questions?
            </p>
            <Link href="/contact">
              <Button variant="outline" className="font-medium">
                Contact our team
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6">
            <Zap className="size-7 fill-current" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Create your account and buy your first bundle in under 5 minutes.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8"
            >
              Start now
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}

// ─── Bundle Card ───

function BundleCard({
  bundle,
  variant,
}: {
  bundle: Bundle
  variant: "expiry" | "permanent"
}) {
  const totalCredits = bundle.credits + bundle.bonus_credits
  const perSms = bundle.price_ghs / totalCredits

  const isExpiry = variant === "expiry"

  return (
    <div
      className={`rounded-2xl border-2 p-5 transition-all hover:shadow-lg ${
        isExpiry
          ? "border-orange-100 dark:border-orange-900/50 bg-white dark:bg-gray-900 hover:border-orange-200"
          : "border-blue-100 dark:border-blue-900/50 bg-white dark:bg-gray-900 hover:border-blue-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-bold">{bundle.name}</h3>
        {bundle.validity_days ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
            <Clock className="size-2.5" />
            {bundle.validity_days}D
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <InfinityIcon className="size-2.5" />
            FOREVER
          </span>
        )}
      </div>

      {/* Price */}
      <p
        className={`text-3xl font-bold mb-1 ${
          isExpiry
            ? "text-orange-600 dark:text-orange-400"
            : "text-blue-600 dark:text-blue-400"
        }`}
      >
        GH₵ {bundle.price_ghs.toFixed(2)}
      </p>

      {/* Credits */}
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
        {totalCredits.toLocaleString()} SMS
        {bundle.bonus_credits > 0 && (
          <span className="ml-1 text-green-600 dark:text-green-400 text-xs">
            (+{bundle.bonus_credits.toLocaleString()} bonus)
          </span>
        )}
      </p>

      {/* Per SMS */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        GH₵ {perSms.toFixed(4)} per SMS
      </p>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-5 min-h-[2.5rem]">
        {bundle.description}
      </p>

      <Link href="/login">
        <Button
          className={`w-full font-semibold h-10 ${
            isExpiry
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Buy now
        </Button>
      </Link>
    </div>
  )
}

// ─── FAQ ───

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 open:shadow-sm transition-all">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <span className="font-semibold text-sm md:text-base pr-4">{q}</span>
        <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl leading-none">
          +
        </span>
      </summary>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
        {a}
      </p>
    </details>
  )
}