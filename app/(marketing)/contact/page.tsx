import { ContactForm } from "@/components/contact-form"
import {
  Mail,
  MessageSquare,
  Receipt,
  Shield,
  Building2,
  Zap,
  Clock,
  MapPin,
} from "lucide-react"

export const metadata = {
  title: "Contact · CignalPulse",
  description:
    "Get in touch with the CignalPulse team. Support, billing, partnerships, and press.",
}

const CONTACTS = [
  {
    icon: <MessageSquare className="size-5 text-white" />,
    color: "bg-blue-500",
    label: "General & Support",
    email: "support@cignalpulse.com",
    description: "Technical help, account issues, sender ID requests.",
    responseTime: "Within 4 hours",
  },
  {
    icon: <Receipt className="size-5 text-white" />,
    color: "bg-orange-500",
    label: "Billing",
    email: "billing@cignalpulse.com",
    description: "Invoices, refunds, payment issues, top-up problems.",
    responseTime: "Within 8 hours",
  },
  {
    icon: <Building2 className="size-5 text-white" />,
    color: "bg-purple-500",
    label: "Sales & Enterprise",
    email: "hello@cignalpulse.com",
    description: "Custom volumes, partnerships, reseller enquiries.",
    responseTime: "Within 24 hours",
  },
  {
    icon: <Shield className="size-5 text-white" />,
    color: "bg-green-500",
    label: "Security & Abuse",
    email: "abuse@cignalpulse.com",
    description: "Report spam, fraudulent messages, or security issues.",
    responseTime: "Within 2 hours",
  },
]

export default function ContactPage() {
  return (
    <>
      {/* HERO */}
      <section className="pt-16 md:pt-24 pb-12 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 mb-6">
            <Mail className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              We reply fast
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Get in touch
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Questions about pricing, features, or your account? We&apos;re here
            to help. Pick a topic below or send us a message.
          </p>
        </div>
      </section>

      {/* CONTACT CARDS */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONTACTS.map((c) => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900 transition-all"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${c.color} mb-4`}
                >
                  {c.icon}
                </div>
                <h3 className="font-semibold mb-1">{c.label}</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mb-3 truncate">
                  {c.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                  {c.description}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Clock className="size-3" />
                  {c.responseTime}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="py-12 md:py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Left — info */}
            <div className="lg:col-span-2">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white mb-5">
                <Zap className="size-6 fill-current" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Send us a message
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Fill in the form and we&apos;ll route your message to the right
                team. We usually reply within a few hours during business days.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shrink-0">
                    <Clock className="size-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5">Business hours</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mon–Fri, 8am–6pm GMT
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shrink-0">
                    <MapPin className="size-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5">Based in</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Accra, Ghana
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}