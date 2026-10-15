"use client"

import * as React from "react"
import { approveSenderIdRequest } from "@/app/actions/approve-sender-id"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestApprovePage() {
  const [requestId, setRequestId] = React.useState("")
  const [result, setResult] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const handleApprove = async () => {
    setLoading(true)
    const res = await approveSenderIdRequest(requestId)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className="p-10 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Test: Approve Sender ID</h1>

      <Input
        placeholder="Enter Request ID e.g. SID-2026-6814"
        value={requestId}
        onChange={(e) => setRequestId(e.target.value)}
      />

      <Button onClick={handleApprove} disabled={loading || !requestId}>
        {loading ? "Approving..." : "Approve"}
      </Button>

      {result && (
        <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}