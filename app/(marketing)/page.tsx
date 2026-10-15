import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Zap,
  MessageSquare,
  Wallet,
  Users,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Send,
  Clock,
  MapPin,
} from "lucide-react"

export default function LandingPage() {
  return (
    <>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 mb-6">
                <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  Built for Ghanaian businesses
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                SMS campaigns that{" "}
                <span className="text-blue-600 dark:text-blue-500">
                  actually deliver
                </span>
              </h1>

              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl">
                Send bulk SMS to your customers with your own approved sender
                ID. Real-time delivery reports, transparent pricing, and no
                hidden fees — built for how Ghana does business.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8"
                  >
                    Start sending
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-8 font-semibold"
                  >
                    See pricing
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-green-500" />
                  No setup fees
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-green-500" />
                  MTN, Vodafone, AirtelTigo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-green-500" />
                  Pay as you go
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 p-8 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center">
                        <MessageSquare className="size-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold">New campaign</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-semibold">
                      Sent
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 w-full" />
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 w-3/4" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivered</p>
                      <p className="text-xl font-bold text-green-600">1,247</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Failed</p>
                      <p className="text-xl font-bold text-red-500">3</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to reach your customers
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              One platform for SMS marketing, transactional messages, and
              customer engagement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Send className="size-6 text-white" />}
              color="bg-blue-500"
              title="Bulk SMS in seconds"
              body="Upload contacts, pick a template, hit send. Reach thousands of customers instantly."
            />
            <FeatureCard
              icon={<Shield className="size-6 text-white" />}
              color="bg-green-500"
              title="Your own sender ID"
              body="Register your brand name and send under it. Customers see your business, not a random number."
            />
            <FeatureCard
              icon={<BarChart3 className="size-6 text-white" />}
              color="bg-purple-500"
              title="Real-time delivery reports"
              body="Track every message — sent, delivered, failed — with live analytics on your dashboard."
            />
            <FeatureCard
              icon={<Wallet className="size-6 text-white" />}
              color="bg-orange-500"
              title="Transparent pricing"
              body="Top up your wallet once, spend on what you need. No monthly fees, no minimums."
            />
            <FeatureCard
              icon={<Users className="size-6 text-white" />}
              color="bg-pink-500"
              title="Contact management"
              body="Organize customers into groups. Import from CSV, send to segments in one click."
            />
            <FeatureCard
              icon={<Clock className="size-6 text-white" />}
              color="bg-cyan-500"
              title="Schedule ahead"
              body="Plan campaigns for the perfect time. Schedule sends for tomorrow, next week, or next month."
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Live in under 5 minutes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              From sign up to your first campaign in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Step
              n={1}
              icon={<MapPin className="size-6 text-blue-600" />}
              title="Create your account"
              body="Sign up with your email and company details. Verify your phone number for security."
            />
            <Step
              n={2}
              icon={<Wallet className="size-6 text-blue-600" />}
              title="Top up your wallet"
              body="Add funds via mobile money or card. Buy SMS bundles at bulk rates — the more you buy, the less you pay."
            />
            <Step
              n={3}
              icon={<Send className="size-6 text-blue-600" />}
              title="Send your first campaign"
              body="Pick a sender ID, write your message, choose recipients. Hit send and watch delivery reports roll in."
            />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 md:py-20 bg-blue-600 dark:bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">99.2%</p>
              <p className="text-blue-100 text-sm">Average delivery rate</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">&lt; 5s</p>
              <p className="text-blue-100 text-sm">Message delivery time</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">24/7</p>
              <p className="text-blue-100 text-sm">Platform availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6">
            <Zap className="size-7 fill-current" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to reach your customers?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Join businesses across Ghana using CignalPulse to send smarter,
            faster, and cheaper SMS.
          </p>
          <Link href="/login">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8"
            >
              Get started for free
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            No credit card required · Pay only when you send
          </p>
        </div>
      </section>
    </>
  )
}

// ─── Helpers ───

function FeatureCard({
  icon,
  color,
  title,
  body,
}: {
  icon: React.ReactNode
  color: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all">
      <div className={`flex size-12 items-center justify-center rounded-xl ${color} mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {body}
      </p>
    </div>
  )
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="relative">
      <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 mb-4">
        {icon}
      </div>
      <div className="absolute top-0 right-0 text-6xl font-bold text-gray-100 dark:text-gray-900 -z-10 select-none">
        {n}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {body}
      </p>
    </div>
  )
}