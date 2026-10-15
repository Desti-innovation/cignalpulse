"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import {
  Loader2,
  Info,
  CheckCircle2,
  Send,
} from "lucide-react"
import { sendContactMessageAction } from "@/app/actions/contact"

const TOPICS = [
  { value: "support", label: "General / Support" },
  { value: "billing", label: "Billing / Invoices" },
  { value: "sales", label: "Sales / Enterprise" },
  { value: "abuse", label: "Report abuse / spam" },
  { value: "other", label: "Other" },
] as const

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await sendContactMessageAction(formData)

    if (!result.success) {
      setError(result.error || "Something went wrong. Please try again.")
      setIsSubmitting(false)
      return
    }

    setSuccess(true)
    setIsSubmitting(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/40 mb-4">
          <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Message sent</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
          Thanks for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        <Button
          variant="outline"
          onClick={() => setSuccess(false)}
          className="font-medium"
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="name">Your name</FieldLabel>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Kofi Mensah"
              className="h-11 border-gray-300 focus-visible:ring-blue-600"
              required
              maxLength={100}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              className="h-11 border-gray-300 focus-visible:ring-blue-600"
              required
              maxLength={200}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="topic">What&apos;s this about?</FieldLabel>
          <select
            id="topic"
            name="topic"
            required
            defaultValue="support"
            className="h-11 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="subject">Subject</FieldLabel>
          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="Brief summary of your enquiry"
            className="h-11 border-gray-300 focus-visible:ring-blue-600"
            required
            maxLength={150}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="message">Message</FieldLabel>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            maxLength={5000}
            placeholder="Tell us how we can help..."
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
          <FieldDescription>
            Please don&apos;t include passwords or payment details in this form.
          </FieldDescription>
        </Field>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">
              {error}
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="size-4 mr-2" />
              Send message
            </>
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}