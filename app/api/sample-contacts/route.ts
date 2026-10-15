import { NextResponse } from "next/server"

export async function GET() {
  const csv = [
    "phone,first_name,last_name",
    "233241234567,John,Doe",
    "233201234567,Jane,Smith",
    "233551234567,Kojo,Mensah",
  ].join("\n")

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="signalpulse-contacts-sample.csv"',
    },
  })
}