"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Zap, Menu, X } from "lucide-react"

const links = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function MarketingHeader() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  // Close mobile menu on route change
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-blue-700 dark:text-blue-500"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Zap className="size-5 fill-current" />
          </div>
          CignalPulse
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-blue-600 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="font-medium">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden inline-flex items-center justify-center size-9 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}