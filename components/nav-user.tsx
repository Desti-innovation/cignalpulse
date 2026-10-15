"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { 
  ChevronsUpDownIcon, 
  SparklesIcon, 
  BadgeCheckIcon, 
  CreditCardIcon, 
  BellIcon, 
  LogOutIcon,
  MoonIcon,
  SunIcon,
  HelpCircleIcon,
  KeyboardIcon,
  UserCircleIcon
} from "lucide-react"
import { useTheme } from "next-themes"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton 
                size="lg" 
                className="aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-800 data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-800"
              />
            }
          >
            {/* Avatar with online status */}
            <div className="relative">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-blue-600 text-white font-semibold">
                  HD
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
            </div>

            {/* User Name & Email */}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>

            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            {/* Profile Header — WRAPPED IN GROUP TO FIX ERROR */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg mb-1">
                  <Avatar className="size-10 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg bg-blue-600 text-white font-semibold">
                      HD
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-gray-900 dark:text-gray-100">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>



          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}