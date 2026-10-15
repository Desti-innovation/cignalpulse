"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { adminLogoutAction } from "@/app/actions/admin-auth"
import { IdleTracker } from "@/components/idle-tracker"
import {
  Zap,
  ShieldAlert,
  LayoutDashboard,
  Inbox,
  Users,
  Send,
  BarChart3,
  Settings,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  Bell,
  HelpCircle,
  ScrollText,
  Wallet,
  Receipt,
  Package,
  TicketPercent,
  Flag,
  MessageSquare,
  TrendingUp,
  Activity,
  Calendar,
  Download,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// ---------- Types ----------

export type AdminUser = {
  fullName: string
  email: string
  username: string
}

export type BreadcrumbEntry = {
  label: string
  href?: string
}

interface AdminContentProps {
  admin: AdminUser
  breadcrumbs: BreadcrumbEntry[]
  children: React.ReactNode
}

// ---------- Nav Groups ----------

const navGroups = [
  {
    label: "Management",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Sender ID Requests", url: "/admin/sender-ids", icon: Inbox },
      { title: "All Users", url: "/admin/users", icon: Users },
      { title: "Campaigns", url: "/admin/campaigns", icon: Send },
      { title: "Scheduled", url: "/admin/scheduled", icon: Calendar },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Templates", url: "/admin/templates", icon: MessageSquare },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Money Overview", url: "/admin/revenue", icon: Wallet, exact: true },
      { title: "Transactions", url: "/admin/transactions", icon: Receipt },
      { title: "SMS Bundles", url: "/admin/bundles", icon: Package },
      { title: "Promo Codes", url: "/admin/promos", icon: TicketPercent },
      { title: "Profit Margin", url: "/admin/margin", icon: TrendingUp },
    ],
  },
  {
    label: "Safety & Compliance",
    items: [
      { title: "Red Flags", url: "/admin/red-flags", icon: Flag },
      { title: "Audit Logs", url: "/admin/audit", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Cron Health", url: "/admin/crons", icon: Activity },
      { title: "Data Export", url: "/admin/export", icon: Download },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
]

// ---------- Component ----------

export default function AdminContent({
  admin,
  breadcrumbs,
  children,
}: AdminContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const initials = admin.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    await adminLogoutAction()
  }

  return (
    <SidebarProvider>
      {/* Idle tracker for admin sessions — auto logout after 5 min */}
      <IdleTracker role="admin" timeoutMinutes={5} />

      <Sidebar collapsible="icon" className="border-r border-gray-800">
        <SidebarHeader className="border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
              <Zap className="size-4 fill-current" />
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-bold text-white truncate">
                CignalPulse
              </span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-gray-900">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-gray-500 uppercase text-[10px] tracking-wider">
                {group.label}
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.url
                    : pathname.startsWith(item.url)
                  const Icon = item.icon

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        tooltip={item.title}
                        className={`
                          transition-colors
                          ${
                            isActive
                              ? "bg-blue-600 text-white hover:bg-blue-600"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          }
                        `}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-800 bg-gray-900">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="text-gray-200 hover:bg-gray-800 aria-expanded:bg-gray-800"
                    />
                  }
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-amber-500 text-white font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-white">
                      {admin.fullName}
                    </span>
                    <span className="truncate text-xs text-gray-400">
                      {admin.email}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4 text-gray-500 group-data-[collapsible=icon]:hidden" />
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="w-64 rounded-xl"
                  side="right"
                  align="end"
                  sideOffset={8}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-lg">
                        <Avatar className="size-10 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-amber-500 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                          <span className="truncate font-semibold">
                            {admin.fullName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {admin.email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => router.push("/admin/settings")}
                    >
                      <ShieldAlert className="text-amber-500" />
                      Admin Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <HelpCircle className="text-gray-500" />
                      Support
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
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-[#F8F9FA] dark:bg-gray-950">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, i) => {
                  const isLast = i === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={`${crumb.label}-${i}`}>
                      <BreadcrumbItem
                        className={i === 0 ? "hidden md:block" : ""}
                      >
                        {isLast || !crumb.href ? (
                          <BreadcrumbPage className="text-gray-900 dark:text-gray-100 font-medium">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink
                            href={crumb.href}
                            className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                ADMIN MODE
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-900" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              title="Toggle theme"
            >
              <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}