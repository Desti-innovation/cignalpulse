"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      {/* Group Label with subtle color and uppercase tracking */}
      <SidebarGroupLabel className="text-blue-600 dark:text-blue-400 font-semibold uppercase text-[11px] tracking-wider">
        Platform
      </SidebarGroupLabel>
      
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen={item.isActive}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={
                <SidebarMenuButton 
                  tooltip={item.title} 
                  className={`
                    transition-all duration-200 ease-in-out rounded-lg
                    ${item.isActive 
                      ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/50 dark:text-blue-300" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/60"}
                  `}
                />
              }
            >
              {/* Icon inherits color from parent button */}
              <span className="flex items-center justify-center size-5">
                {item.icon}
              </span>
              <span className="ml-1">{item.title}</span>
              <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-open/collapsible:rotate-90 opacity-60" />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="overflow-hidden">
              <SidebarMenuSub className="border-l-2 border-blue-100 dark:border-blue-900/50 ml-3 pl-3 my-1 gap-0.5">
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton 
                      render={<a href={subItem.url} />}
                      className="
                        rounded-md text-sm text-gray-600 dark:text-gray-400
                        hover:bg-blue-50 hover:text-blue-700 
                        dark:hover:bg-blue-950/50 dark:hover:text-blue-300
                        transition-colors duration-150
                      "
                    >
                      <span>{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}