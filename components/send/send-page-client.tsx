"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ModeTabs, type SendMode } from "@/components/send/mode-tabs"
import { IndividualInput } from "@/components/send/individual-input"
import { BulkInput } from "@/components/send/bulk-input"
import { GroupSelector } from "@/components/send/group-selector"
import { SenderIdPicker } from "@/components/send/sender-id-picker"
import {
  MessageComposer,
  type MessageTemplate,
} from "@/components/send/message-composer"
import { SchedulePicker } from "@/components/send/schedule-picker"
import { CostSummary } from "@/components/send/cost-summary"
import { SendButtonBar } from "@/components/send/send-button-bar"
import { SaveDraftButton } from "@/components/send/save-draft-button"
import { ConfirmSheet } from "@/components/send/confirm-sheet"
import { Toast } from "@/components/send/toast"
import { SuccessCard } from "@/components/send/success-card"
import { RedirectSpinner } from "@/components/send/redirect-spinner"
import {
  sendSmsAction,
  saveDraftAction,
  resolveGroupRecipients,
  type SendGroupOption,
} from "@/app/actions/send-sms"
import { calculateSmsParts } from "@/lib/sms-parts"
import { normalizePhone } from "@/lib/phone"

// ============================================================
// Props
// ============================================================

interface PrefillData {
  mode: "individual" | "bulk" | "group"
  senderId: string
  message: string
  recipients: string[]
  scheduledAt: string | null
}

interface Props {
  sendingStatus: "active" | "flagged" | "suspended"
  smsCredits: number
  approvedSenderIds: string[]
  templates: MessageTemplate[]
  batches: Array<{
    id: number
    bundle_name: string | null
    credits_remaining: number
    expires_at: string | null
  }>
  prefill?: PrefillData | null
  groups: SendGroupOption[]
}

// ============================================================
// Component
// ============================================================

export function SendPageClient({
  sendingStatus,
  smsCredits,
  approvedSenderIds,
  templates,
  batches,
  prefill,
  groups,
}: Props) {
  const router = useRouter()

  void batches

  // -------- Form state --------
  const [mode, setMode] = React.useState<SendMode>(
    prefill?.mode === "group" ? "group" : prefill?.mode ?? "individual"
  )
  const [senderId, setSenderId] = React.useState(
    prefill?.senderId && approvedSenderIds.includes(prefill.senderId)
      ? prefill.senderId
      : approvedSenderIds[0] ?? ""
  )
  const [message, setMessage] = React.useState(prefill?.message ?? "")

  const [individualPhone, setIndividualPhone] = React.useState(
    prefill?.mode === "individual" && prefill.recipients.length === 1
      ? prefill.recipients[0]
      : ""
  )
  const [individualName, setIndividualName] = React.useState("")

  const [bulkRaw, setBulkRaw] = React.useState(
    prefill?.mode === "bulk" ? prefill.recipients.join("\n") : ""
  )
  const [bulkValid, setBulkValid] = React.useState<string[]>(
    prefill?.mode === "bulk" ? prefill.recipients : []
  )

  const [selectedGroupIds, setSelectedGroupIds] = React.useState<number[]>([])
  const [groupRecipients, setGroupRecipients] = React.useState<string[]>([])
  const [isLoadingGroupRecipients, setIsLoadingGroupRecipients] =
    React.useState(false)

  const [scheduleEnabled, setScheduleEnabled] = React.useState(
    !!prefill?.scheduledAt
  )
  const [scheduledAt, setScheduledAt] = React.useState(() => {
    if (!prefill?.scheduledAt) return ""
    const d = new Date(prefill.scheduledAt)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [currentCredits, setCurrentCredits] = React.useState(smsCredits)

  // -------- UI state --------
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showRedirectSpinner, setShowRedirectSpinner] = React.useState(false)
  const [successCard, setSuccessCard] = React.useState<{
    campaignDbId: number
    campaignId: string
    recipientCount: number
    totalSent: number
    totalRejected: number
    creditsUsed: number
    isScheduled: boolean
    senderId: string
    message: string
    scheduledAt: string | null
  } | null>(null)
  const [toast, setToast] = React.useState<{
    show: boolean
    type: "success" | "error"
    title: string
    description?: string
  }>({ show: false, type: "success", title: "" })

  // -------- Load group recipients when selection changes --------
  React.useEffect(() => {
    if (mode !== "group") return
    if (selectedGroupIds.length === 0) {
      setGroupRecipients([])
      return
    }

    let cancelled = false
    setIsLoadingGroupRecipients(true)

    resolveGroupRecipients(selectedGroupIds).then((phones) => {
      if (!cancelled) {
        setGroupRecipients(phones)
        setIsLoadingGroupRecipients(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [mode, selectedGroupIds])

  // -------- Derived values --------
  const partsInfo = calculateSmsParts(message)
  const isScheduled = scheduleEnabled && !!scheduledAt

  const recipients = React.useMemo(() => {
    if (mode === "individual") {
      const result = normalizePhone(individualPhone)
      return result.valid && result.normalized ? [result.normalized] : []
    }
    if (mode === "bulk") return bulkValid
    if (mode === "group") return groupRecipients
    return []
  }, [mode, individualPhone, bulkValid, groupRecipients])

  const recipientCount = recipients.length
  const totalCredits = recipientCount * partsInfo.parts

  // Does the form have anything worth saving as a draft?
  const hasDraftContent =
    (mode === "individual" && individualPhone.trim().length > 0) ||
    (mode === "bulk" && bulkRaw.trim().length > 0) ||
    (mode === "group" && selectedGroupIds.length > 0) ||
    message.trim().length > 0

  // -------- Validation --------
  const isBlocked = sendingStatus !== "active"
  const noSenderId = !senderId || approvedSenderIds.length === 0
  const noRecipients = recipientCount === 0
  const noMessage = !message.trim()
  const insufficientCredits = totalCredits > currentCredits
  const needsScheduleTime = scheduleEnabled && !scheduledAt

  const canSend =
    !isBlocked &&
    !noSenderId &&
    !noRecipients &&
    !noMessage &&
    !insufficientCredits &&
    !needsScheduleTime

  let disabledReason: string | undefined
  if (isBlocked) {
    disabledReason =
      sendingStatus === "flagged"
        ? "Your account is flagged. Contact support to resume sending."
        : "Your account is suspended."
  } else if (noSenderId) {
    disabledReason = "No approved Sender ID available."
  } else if (mode === "group" && selectedGroupIds.length === 0) {
    disabledReason = "Select at least one group."
  } else if (noRecipients) {
    disabledReason = "Add at least one recipient."
  } else if (noMessage) {
    disabledReason = "Write a message first."
  } else if (insufficientCredits) {
    disabledReason = `Not enough credits. Need ${totalCredits.toLocaleString()}, have ${currentCredits.toLocaleString()}.`
  } else if (needsScheduleTime) {
    disabledReason = "Pick a date and time for your scheduled SMS."
  }

  // -------- Handlers --------
  const handleSendClick = () => {
    if (!canSend) return
    setShowConfirm(true)
  }

  const handleConfirmSend = async () => {
    setIsProcessing(true)

    const result = await sendSmsAction({
      mode,
      senderId,
      message,
      recipients,
      scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : null,
    })

    setIsProcessing(false)

    if (!result.success) {
      setShowConfirm(false)
      setToast({
        show: true,
        type: "error",
        title: "Send failed",
        description: result.error || "Something went wrong.",
      })
      return
    }

    setShowConfirm(false)

    if (!result.isScheduled && result.creditsUsed) {
      setCurrentCredits((prev) => Math.max(0, prev - result.creditsUsed!))
    }

    setToast({
      show: true,
      type: "success",
      title: result.isScheduled
        ? "SMS scheduled"
        : `Sent to ${recipientCount.toLocaleString()} recipient${recipientCount === 1 ? "" : "s"}`,
      description: result.isScheduled
        ? `Will send at ${new Date(scheduledAt).toLocaleString("en-GB")}`
        : `${result.totalSent ?? 0} accepted by the network, ${result.totalRejected ?? 0} rejected.`,
    })

    setSuccessCard({
      campaignDbId: result.campaignDbId!,
      campaignId: result.campaignId!,
      recipientCount,
      totalSent: result.totalSent ?? 0,
      totalRejected: result.totalRejected ?? 0,
      creditsUsed: result.creditsUsed ?? totalCredits,
      isScheduled: !!result.isScheduled,
      senderId,
      message,
      scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : null,
    })

    setMessage("")
    setIndividualPhone("")
    setIndividualName("")
    setBulkRaw("")
    setBulkValid([])
    setSelectedGroupIds([])
    setGroupRecipients([])
    setScheduleEnabled(false)
    setScheduledAt("")

    router.refresh()
  }

  const handleSaveDraft = async (): Promise<boolean> => {
    const result = await saveDraftAction({
      mode,
      senderId,
      message,
      recipients,
    })

    if (!result.success) {
      setToast({
        show: true,
        type: "error",
        title: "Could not save draft",
        description: result.error || "Something went wrong.",
      })
      return false
    }

    setToast({
      show: true,
      type: "success",
      title: "Draft saved",
      description: "Find it under Campaigns → Drafts.",
    })

    router.refresh()
    return true
  }

  const handleViewCampaignNow = () => {
    if (!successCard) return
    setShowRedirectSpinner(true)
    setTimeout(() => {
      router.push(`/dashboard/campaigns/${successCard.campaignDbId}`)
    }, 400)
  }

  const isGroupMode = mode === "group"

  // -------- Render --------
  return (
    <>
      {showRedirectSpinner && <RedirectSpinner />}

      <Toast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        description={toast.description}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />

      {/* <div className="flex flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full pb-40 md:gap-6 md:p-6 md:pb-6"> */}
            <div className="flex flex-1 flex-col gap-4 p-4 max-w-4xl mx-auto w-full pb-44 md:gap-6 md:p-6 md:pb-6">
        {/* Page title — desktop only */}
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Send SMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send to one person, a list, or a group.
          </p>
        </div>

        {/* Success card */}
        {successCard && (
          <SuccessCard
            data={successCard}
            onViewNow={handleViewCampaignNow}
            onDismiss={() => setSuccessCard(null)}
          />
        )}

        {/* Mode tabs */}
        <ModeTabs value={mode} onChange={setMode} />

        {/* ============================================================ */}
        {/* MOBILE: one continuous card (all modes) */}
        {/* ============================================================ */}
        <div className="md:hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {/* Recipients — depends on mode */}
          <div className="p-4">
            {mode === "individual" && (
              <IndividualInput
                phone={individualPhone}
                onPhoneChange={setIndividualPhone}
                name={individualName}
                onNameChange={setIndividualName}
              />
            )}
            {mode === "bulk" && (
              <BulkInput
                raw={bulkRaw}
                onChange={setBulkRaw}
                onValidCountChange={(_, valid) => setBulkValid(valid)}
              />
            )}
            {mode === "group" && (
              <GroupSelector
                groups={groups}
                selectedIds={selectedGroupIds}
                onSelectionChange={setSelectedGroupIds}
                uniqueRecipientCount={
                  isLoadingGroupRecipients ? 0 : groupRecipients.length
                }
              />
            )}
          </div>

          {/* Sender ID */}
          <div className="p-4">
            <SenderIdPicker
              senderIds={approvedSenderIds}
              value={senderId}
              onChange={setSenderId}
            />
          </div>

          {/* Message */}
          <div className="p-4">
            <MessageComposer
              value={message}
              onChange={setMessage}
              templates={templates}
              showPlaceholders={mode === "individual"}
            />
          </div>

          {/* Schedule */}
          <div className="p-4">
            <SchedulePicker
              enabled={scheduleEnabled}
              onEnabledChange={setScheduleEnabled}
              value={scheduledAt}
              onChange={setScheduledAt}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* DESKTOP: separate cards */}
        {/* ============================================================ */}
        <div className="hidden md:flex md:flex-col md:gap-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            {mode === "individual" && (
              <IndividualInput
                phone={individualPhone}
                onPhoneChange={setIndividualPhone}
                name={individualName}
                onNameChange={setIndividualName}
              />
            )}
            {mode === "bulk" && (
              <BulkInput
                raw={bulkRaw}
                onChange={setBulkRaw}
                onValidCountChange={(_, valid) => setBulkValid(valid)}
              />
            )}
            {mode === "group" && (
              <GroupSelector
                groups={groups}
                selectedIds={selectedGroupIds}
                onSelectionChange={setSelectedGroupIds}
                uniqueRecipientCount={
                  isLoadingGroupRecipients ? 0 : groupRecipients.length
                }
              />
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <SenderIdPicker
              senderIds={approvedSenderIds}
              value={senderId}
              onChange={setSenderId}
            />
          </div>

          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6">
            <MessageComposer
              value={message}
              onChange={setMessage}
              templates={templates}
              showPlaceholders={mode === "individual"}
            />
          </div>

          <SchedulePicker
            enabled={scheduleEnabled}
            onEnabledChange={setScheduleEnabled}
            value={scheduledAt}
            onChange={setScheduledAt}
          />
        </div>

        {/* Cost summary */}
        <CostSummary
          recipientCount={recipientCount}
          smsParts={partsInfo.parts}
          creditsPerRecipient={partsInfo.parts}
          currentBalance={currentCredits}
          isScheduled={isScheduled}
        />

        {/* Desktop action buttons: Save Draft + Send */}
                {/* Desktop action bar */}
        <div className="hidden md:block">
          <SendButtonBar
            disabled={!canSend}
            disabledReason={disabledReason}
            isProcessing={isProcessing}
            isScheduled={isScheduled}
            totalCredits={totalCredits}
            recipientCount={recipientCount}
            onSend={handleSendClick}
            showDisabledReason={hasDraftContent}
            secondaryAction={
              <SaveDraftButton
                onSave={handleSaveDraft}
                hasChanges={hasDraftContent}
                disabled={isProcessing}
              />
            }
          />
        </div>
      </div>
      

      {/* Mobile sticky action bar: Save Draft + Send */}
            {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="max-w-4xl mx-auto">
          <SendButtonBar
            disabled={!canSend}
            disabledReason={disabledReason}
            isProcessing={isProcessing}
            isScheduled={isScheduled}
            totalCredits={totalCredits}
            recipientCount={recipientCount}
            onSend={handleSendClick}
            showDisabledReason={hasDraftContent}
            secondaryAction={
              <SaveDraftButton
                onSave={handleSaveDraft}
                hasChanges={hasDraftContent}
                disabled={isProcessing}
              />
            }
          />
        </div>
      </div>

      {/* Confirmation sheet */}
      <ConfirmSheet
        open={showConfirm}
        onOpenChange={setShowConfirm}
        senderId={senderId}
        message={message}
        recipientCount={recipientCount}
        smsParts={partsInfo.parts}
        totalCredits={totalCredits}
        isScheduled={isScheduled}
        scheduledAt={isScheduled ? scheduledAt : null}
        isProcessing={isProcessing}
        onConfirm={handleConfirmSend}
      />
    </>
  )
}