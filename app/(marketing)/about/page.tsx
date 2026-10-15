import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Target, Heart, Users } from "lucide-react"

export const metadata = {
  title: "About · CignalPulse",
  description:
    "CignalPulse is an SMS platform built for Ghanaian businesses that move fast.",
}

export default function AboutPage() {
  return (
    <>
      <section className="pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 mb-6">
            <Heart className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Our story
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            SMS built for how Ghana does business
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            We started CignalPulse because every business we talked to had the
            same problem: SMS platforms were built for somewhere else, priced
            for somewhere else, and slow to deliver here.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Value
              icon={<Target className="size-6 text-white" />}
              color="bg-blue-500"
              title="Built here"
              body="We understand mobile money, local networks, and what your customers actually open. That shapes every feature."
            />
            <Value
              icon={<Zap className="size-6 text-white" />}
              color="bg-orange-500"
              title="Fast by default"
              body="Messages deliver in under 5 seconds on average. Campaigns launch in one click. No hidden queues."
            />
            <Value
              icon={<Users className="size-6 text-white" />}
              color="bg-purple-500"
              title="Fair pricing"
              body="No contracts, no monthly fees, no surprise charges. You pay for what you send — nothing else."
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-6">
            <Zap className="size-7 fill-current" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to work with us?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Reach out — we&apos;d love to hear what you&apos;re building.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="font-semibold h-12 px-8"
              >
                Contact us
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8"
              >
                Get started
                <ArrowRight className="size-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Value({
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
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
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