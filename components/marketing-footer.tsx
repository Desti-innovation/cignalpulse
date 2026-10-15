import Link from "next/link"
import { Zap, Mail } from "lucide-react"

const ALIASES = {
  hello: "hello@cignalpulse.com",
  support: "support@cignalpulse.com",
  billing: "billing@cignalpulse.com",
  legal: "legal@cignalpulse.com",
  privacy: "privacy@cignalpulse.com",
} as const

export function MarketingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-blue-700 dark:text-blue-500 mb-4"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap className="size-5 fill-current" />
              </div>
              CignalPulse
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4 leading-relaxed">
              SMS for modern businesses. Send bulk messages, track delivery,
              and engage your customers — all from one dashboard.
            </p>
            <a
              href={`mailto:${ALIASES.hello}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="size-3.5" />
              {ALIASES.hello}
            </a>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Product
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/#features" className="hover:text-blue-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-600 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#how" className="hover:text-blue-600 transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Log in
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${ALIASES.support}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  Support
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${ALIASES.billing}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  Billing
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Legal
            </h3>
            <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href={`mailto:${ALIASES.privacy}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${ALIASES.legal}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <p>© {year} CignalPulse. All rights reserved.</p>
          <p className="text-center md:text-right">
            Built in Ghana 🇬🇭 for businesses that move fast.
          </p>
        </div>
      </div>
    </footer>
  )
}