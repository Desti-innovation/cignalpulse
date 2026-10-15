"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, 
  FileText, 
  Globe, 
  Info,
  ShieldCheck,
  Upload,
  Mail,
  Phone
} from "lucide-react"
import { submitSenderIdRequest } from "@/app/actions/sender-id"

export function SenderIdForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [senderId, setSenderId] = React.useState("")
  const [useCase, setUseCase] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSenderIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11)
    setSenderId(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Call the server action → saves to Neon
    const result = await submitSenderIdRequest({
      senderId: senderId,
      companyName: formData.get("companyName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      useCase: useCase,
      website: formData.get("website") as string,
      notes: (formData.get("notes") as string) || undefined,
    })

    if (!result.success) {
      setError(result.error || "Submission failed. Please try again.")
      setIsSubmitting(false)
      return
    }

    // ✅ Redirect to the LOADING page (which then redirects to status)
    router.push(`/loading?requestId=${result.requestId}`)
  }

  return (
    <form 
      className={cn("flex flex-col gap-6", className)} 
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        {/* Header Section */}
        <div className="flex flex-col items-start gap-2 text-left mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <ShieldCheck className="size-3.5" />
            Sender ID Request
          </div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-500 leading-tight mt-2">
            Request Your Sender ID
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get a branded Sender ID so your customers instantly recognize your messages.
          </p>
        </div>

        {/* Sender ID Input */}
        <Field>
          <FieldLabel htmlFor="senderId" className="flex items-center justify-between">
            <span>Preferred Sender ID</span>
            <span className="text-xs text-muted-foreground font-normal">
              {senderId.length}/11 characters
            </span>
          </FieldLabel>
          <Input
            id="senderId"
            name="senderId"
            type="text"
            placeholder="e.g., CignalPULSE"
            value={senderId}
            onChange={handleSenderIdChange}
            className="h-12 border-gray-300 focus-visible:ring-blue-600 font-mono tracking-wider uppercase"
            required
          />
          <FieldDescription>
            Max 11 characters. Letters and numbers only. No spaces.
          </FieldDescription>
        </Field>

        {/* Company/Business Name */}
        <Field>
          <FieldLabel htmlFor="companyName" className="flex items-center gap-2">
            <Building2 className="size-4 text-gray-500" />
            Registered Business Name
          </FieldLabel>
          <Input
            id="companyName"
            name="companyName"
            type="text"
            placeholder="e.g., CignalPulse Technologies Ltd."
            className="h-12 border-gray-300 focus-visible:ring-blue-600"
            required
          />
        </Field>

        {/* Contact Email & Phone — Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-4 text-gray-500" />
              Contact Email
            </FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              className="h-12 border-gray-300 focus-visible:ring-blue-600"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone" className="flex items-center gap-2">
              <Phone className="size-4 text-gray-500" />
              Contact Number
            </FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+233 XX XXX XXXX"
              className="h-12 border-gray-300 focus-visible:ring-blue-600"
              required
            />
          </Field>
        </div>

        {/* Use Case */}
        <Field>
          <FieldLabel htmlFor="useCase" className="flex items-center gap-2">
            <FileText className="size-4 text-gray-500" />
            Primary Use Case
          </FieldLabel>
          <Select 
            value={useCase} 
            onValueChange={(value) => setUseCase(value ?? "")} 
            required
          >
            <SelectTrigger className="h-12 border-gray-300 focus:ring-blue-600">
              <SelectValue placeholder="Select how you'll use this Sender ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactional">Transactional Messages (OTP, Alerts)</SelectItem>
              <SelectItem value="marketing">Marketing & Promotions</SelectItem>
              <SelectItem value="notifications">Notifications & Reminders</SelectItem>
              <SelectItem value="customer-support">Customer Support</SelectItem>
              <SelectItem value="mixed">Mixed Use</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {/* Website */}
        <Field>
          <FieldLabel htmlFor="website" className="flex items-center gap-2">
            <Globe className="size-4 text-gray-500" />
            Website / Business Link
          </FieldLabel>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://yourbusiness.com"
            className="h-12 border-gray-300 focus-visible:ring-blue-600"
            required
          />
          <FieldDescription>
            Required for regulatory approval and verification.
          </FieldDescription>
        </Field>

        {/* Additional Notes */}
        <Field>
          <FieldLabel htmlFor="notes" className="flex items-center gap-2">
            <Info className="size-4 text-gray-500" />
            Additional Information <span className="text-muted-foreground font-normal">(optional)</span>
          </FieldLabel>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Tell us more about your business or why you need this Sender ID..."
            className="min-h-[100px] border-gray-300 focus-visible:ring-blue-600 resize-none"
          />
        </Field>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
            <Info className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
          <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            <p className="font-semibold mb-1">Approval usually takes 1-3 business days.</p>
            <p>You'll receive an email once your Sender ID is approved and ready to use in your campaigns.</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 mt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting Request...
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}