import { MarketingHeader } from "@/components/marketing-header"
import { MarketingFooter } from "@/components/marketing-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}