import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const blob = await put(
      `test/hello-${Date.now()}.txt`,
      "Hello from SignalPulse",
      { access: "public" }
    )

    return NextResponse.json({
      success: true,
      url: blob.url,
      message: "If you see a URL below, your Blob token works!",
    })
  } catch (error) {
    console.error("Blob test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}