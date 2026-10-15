"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Send,
  Wallet,
  Users,
  FileText,
  BarChart3,
  Settings2,
  MessageSquare,
  Zap,
} from "lucide-react"

type SidebarUser = {
  name: string       // company_name
  email: string
  avatar: string     // logo_url or ""
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: SidebarUser }) {
  // Compute initials from company name (used when no logo is uploaded)
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  // Teams array is now dynamic — always shows the current user's organization
  const teams = [
    {
      name: user.name,
      logo: user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="size-4 rounded object-cover"
        />
      ) : (
        <div className="flex size-4 items-center justify-center rounded bg-blue-600 text-white text-[9px] font-bold">
          {initials}
        </div>
      ),
      plan: "Enterprise",
    },
  ]

  const navMain = [
    {
      title: "Dashboard",
      url: "#",
      icon: <LayoutDashboard className="text-blue-600" />,
      isActive: true,
      items: [
        { title: "Overview", url: "/dashboard" },
        { title: "Send SMS", url: "/dashboard/send" },
        { title: "Wallet", url: "/dashboard/wallet" },
      ],
    },
    {
      title: "Contacts",
      url: "#",
      icon: <Users className="text-teal-600" />,
      items: [
        { title: "All Contacts", url: "/dashboard/contacts" },
        { title: "Groups", url: "/dashboard/contacts/groups" },
        { title: "Import CSV", url: "/dashboard/contacts/import" },
      ],
    },
    {
      title: "Campaigns",
      url: "#",
      icon: <Send className="text-purple-600" />,
      items: [
        { title: "All Campaigns", url: "/dashboard/campaigns" },
        { title: "Scheduled", url: "/dashboard/campaigns/scheduled" },
        { title: "Drafts", url: "/dashboard/campaigns/drafts" },
      ],
    },
    {
      title: "Templates",
      url: "#",
      icon: <FileText className="text-orange-500" />,
      items: [
        { title: "My Templates", url: "/dashboard/templates" },
        // { title: "Create New", url: "/dashboard/templates/new" },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: <BarChart3 className="text-indigo-600" />,
      items: [
        { title: "Overview", url: "/dashboard/analytics" },
        { title: "Delivery Rates", url: "/dashboard/analytics/delivery" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2 className="text-gray-500" />,
      items: [
        { title: "Organization", url: "/dashboard/settings/organization" },
        // { title: "Team Members", url: "/dashboard/settings/team" },
      ],
    },
  ]

  // Project shortcuts — placed for quick access to frequent actions
  const projects = [
    {
      name: "Quick Send",
      url: "/dashboard/send",
      icon: <Zap className="text-amber-500" />,
    },
    {
      name: "Top Up Wallet",
      url: "/dashboard/wallet",
      icon: <Wallet className="text-emerald-500" />,
    },
    {
      name: "Add Contacts",
      url: "/dashboard/contacts/import",
      icon: <Users className="text-teal-500" />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}