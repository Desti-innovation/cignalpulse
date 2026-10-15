"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/notification-bell"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { logoutAction } from "@/app/actions/auth"
import { IdleTracker } from "@/components/idle-tracker"
import {
  ActivityChart,
  type ActivityPoint,
} from "@/components/analytics/activity-chart"
import {
  Send,
  CheckCircle2,
  Users,
  Download,
  MoreVertical,
  Smartphone,
  Wallet,
  MessageSquare,
  Plus,
  Moon,
  Sun,
  LogOut,
  UserCircleIcon,
  Settings,
  HelpCircle,
  ChevronDown,
  ShieldAlert,
  Mail,
} from "lucide-react"

// ============================================================
// Types — extra fields are OPTIONAL so sub-pages don't have to pass them
// ============================================================

export type DashboardUser = {
  username: string
  email: string
  companyName: string
  logoUrl: string | null
  role: "user" | "admin"
  sendingStatus?: "active" | "flagged" | "suspended"
  wallet?: {
    balanceGhs: number
    smsCredits: number
    lifetimeTopupGhs: number
  }
  stats?: {
    totalSent: number
    deliveryRate: number
    activeCampaigns: number
    newContacts: number
  }
  activity?: ActivityPoint[]
}

interface DashboardShellProps {
  user: DashboardUser
  userId: number
  children?: React.ReactNode
  breadcrumb?: string
}

// ============================================================
// Component
// ============================================================

export default function DashboardShell({
  user,
  userId,
  children,
  breadcrumb,
}: DashboardShellProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  // ---- Defaults for optional fields ----
  const sendingStatus = user.sendingStatus ?? "active"
  const wallet = user.wallet ?? {
    balanceGhs: 0,
    smsCredits: 0,
    lifetimeTopupGhs: 0,
  }
  const stats = user.stats ?? {
    totalSent: 0,
    deliveryRate: 0,
    activeCampaigns: 0,
    newContacts: 0,
  }
  const activity = user.activity ?? []

  const initials = user.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const formatGhs = (amount: number) =>
    `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <SidebarProvider>
      <IdleTracker role="user" timeoutMinutes={5} />

      <AppSidebar
        user={{
          name: user.companyName,
          email: user.email,
          avatar: user.logoUrl || "",
        }}
      />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-gray-950">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4">

          {/* LEFT */}
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />

            <span className="md:hidden font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {breadcrumb || "Overview"}
            </span>

            <div className="hidden md:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="/dashboard"
                      className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Dashboard
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-900 dark:text-gray-100 font-medium">
                      {breadcrumb || "Overview"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell userId={userId} />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="hidden sm:flex text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              title="Toggle theme"
            >
              <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Separator
              orientation="vertical"
              className="mx-1 hidden sm:block data-vertical:h-6 data-vertical:self-auto"
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none" />
                }
              >
                <div className="relative">
                  <Avatar className="size-8">
                    {user.logoUrl ? (
                      <AvatarImage src={user.logoUrl} alt={user.companyName} />
                    ) : null}
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-gray-900 ${
                      sendingStatus === "active" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                </div>
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
                    {user.companyName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="hidden md:block size-4 text-gray-400" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-64 rounded-xl"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg">
                      <Avatar className="size-10 rounded-lg">
                        {user.logoUrl ? (
                          <AvatarImage src={user.logoUrl} alt={user.companyName} />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-blue-600 text-white font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                        <span className="truncate font-semibold text-gray-900 dark:text-gray-100">
                          {user.companyName}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      router.push("/dashboard/settings/organization")
                    }
                  >
                    <UserCircleIcon className="text-gray-500" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                      router.push("/dashboard/settings/organization")
                    }
                  >
                    <Settings className="text-gray-500" />
                    Organization Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <HelpCircle className="text-gray-500" />
                    Help & Support
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex items-center gap-2">
                      {isDark ? (
                        <Moon className="size-4 text-blue-500" />
                      ) : (
                        <Sun className="size-4 text-yellow-500" />
                      )}
                      <span>Dark Mode</span>
                    </div>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) =>
                        setTheme(checked ? "dark" : "light")
                      }
                    />
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-950/50"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* RED FLAG BANNER */}
        {sendingStatus !== "active" && (
          <div className="border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3 md:gap-4 p-4 px-4 md:px-6">
              <div className="flex size-9 md:size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <ShieldAlert className="size-4 md:size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm md:text-base text-amber-900 dark:text-amber-100">
                    {sendingStatus === "suspended"
                      ? "Account Suspended"
                      : "Account Under Review"}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                    Sending Paused
                  </span>
                </div>
                <p className="text-xs md:text-sm text-amber-800 dark:text-amber-200 mt-1">
                  We detected unusual activity on your account. Sending new SMS
                  campaigns is temporarily paused while our team reviews your
                  account.
                </p>
                <div className="flex items-center gap-4 mt-2 md:mt-3">
                  <a
                    href="mailto:support@cignalpulse.com"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 hover:underline"
                  >
                    <Mail className="size-3.5" />
                    <span className="hidden sm:inline">
                      Contact support@cignalpulse.com
                    </span>
                    <span className="sm:hidden">Contact support</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {children ? (
          <div className="flex flex-1 flex-col">{children}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Today&apos;s SMS Activity
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user.companyName}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2 text-gray-600 dark:text-gray-400 dark:border-gray-700 w-full sm:w-auto"
              >
                <Download className="size-4" />
                Export Report
              </Button>
            </div>

            {/* Wallet & SMS Balance */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-blue-100 text-sm font-medium mb-1">
                    Wallet Balance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {formatGhs(wallet.balanceGhs)}
                    </span>
                    <span className="text-blue-200 text-xs">GHS</span>
                  </div>
                  <p className="text-blue-200 text-xs mt-2">
                    Lifetime top-up: {formatGhs(wallet.lifetimeTopupGhs)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  <Button
                    size="sm"
                    onClick={() => router.push("/dashboard/wallet")}
                    className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
                  >
                    <Plus className="size-4 mr-1" /> Top Up
                  </Button>
                </div>
                <Wallet className="absolute -bottom-4 -right-4 size-32 text-blue-500 opacity-20" />
              </div>

              <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-purple-100 text-sm font-medium mb-1">
                    SMS Credits
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {formatNumber(wallet.smsCredits)}
                    </span>
                    <span className="text-purple-200 text-xs">
                      Credits Left
                    </span>
                  </div>
                  {wallet.smsCredits > 0 ? (
                    <>
                      <div className="w-48 h-1.5 bg-purple-900/50 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (wallet.smsCredits / 20000) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-purple-200 text-xs mt-1">
                        Based on your recent usage
                      </p>
                    </>
                  ) : (
                    <p className="text-purple-200 text-xs mt-2">
                      No credits yet. Top up to start sending.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                  <Button
                    size="sm"
                    onClick={() => router.push("/dashboard/wallet")}
                    className="bg-white text-purple-700 hover:bg-purple-50 font-semibold"
                  >
                    <Plus className="size-4 mr-1" /> Buy Credits
                  </Button>
                </div>
                <MessageSquare className="absolute -bottom-4 -right-4 size-32 text-purple-500 opacity-20" />
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 p-4 md:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex size-9 md:size-10 items-center justify-center rounded-lg bg-red-500 text-white shrink-0">
                    <Send className="size-4 md:size-5" />
                  </div>
                  <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {formatNumber(stats.totalSent)}
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total SMS Sent
                  </p>
                  <p className="text-xs text-red-500 font-medium mt-1">
                    All-time
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 p-4 md:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex size-9 md:size-10 items-center justify-center rounded-lg bg-orange-500 text-white shrink-0">
                    <CheckCircle2 className="size-4 md:size-5" />
                  </div>
                  <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {stats.deliveryRate}%
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Delivery Rate
                  </p>
                  <p className="text-xs text-orange-500 font-medium mt-1">
                    Average
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/50 p-4 md:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex size-9 md:size-10 items-center justify-center rounded-lg bg-green-500 text-white shrink-0">
                    <Smartphone className="size-4 md:size-5" />
                  </div>
                  <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {formatNumber(stats.activeCampaigns)}
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Campaigns
                  </p>
                  <p className="text-xs text-green-500 font-medium mt-1">
                    This month
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-4 md:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex size-9 md:size-10 items-center justify-center rounded-lg bg-purple-500 text-white shrink-0">
                    <Users className="size-4 md:size-5" />
                  </div>
                  <span className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {formatNumber(stats.newContacts)}
                  </span>
                </div>
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Contacts
                  </p>
                  <p className="text-xs text-purple-500 font-medium mt-1">
                    In your groups
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 rounded-xl bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                    Delivery Performance
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Last 14 days
                  </span>
                </div>
                <ActivityChart data={activity} />
              </div>

              <div className="rounded-xl bg-white dark:bg-gray-900 border dark:border-gray-800 p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                    Quick Actions
                  </h2>
                  <MoreVertical className="size-4 text-gray-400" />
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => router.push("/dashboard/send")}
                    className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="size-4" />
                    Send SMS
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/wallet")}
                    className="w-full justify-start gap-3"
                  >
                    <Wallet className="size-4" />
                    Top Up Wallet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard/contacts")}
                    className="w-full justify-start gap-3"
                  >
                    <Users className="size-4" />
                    Manage Contacts
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}