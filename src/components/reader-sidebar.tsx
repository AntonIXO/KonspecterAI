"use client"

import * as React from "react"
import { Bot, ChevronRight, MessageSquare, Zap, LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"

const compressionModes = [
  { title: "Default (1:1)", value: "1:1", icon: Bot },
  { title: "Compression (1:2)", value: "1:2", icon: Zap },
  { title: "SuperCompression (1:3)", value: "1:3", icon: "⚡⚡" },
] as const

// Add proper type definitions
type MenuItem = {
  title: string;
  url: string;
  icon?: LucideIcon | string;
}

type FeatureSection = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const data: { aiFeatures: FeatureSection[] } = {
  aiFeatures: [
    {
      title: "Chats",
      icon: MessageSquare,
      items: [
        { title: "New Chat", url: "#" },
        { title: "Saved Chats", url: "#" },
      ],
    },
  ],
}

// Add type for props
interface ReaderSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSummarizePage?: () => void;
}

export function ReaderSidebar({ onSummarizePage, ...props }: ReaderSidebarProps) {
  const { compressionMode, setCompressionMode } = useSidebar()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
      <div className="px-4 py-2">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">
            KonspecterAI
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Big Summarize Button */}
        <SidebarGroup className="mb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                className="w-full justify-center bg-gradient-to-r from-blue-600 to-violet-500 text-white hover:from-blue-700 hover:to-violet-600"
                onClick={onSummarizePage}
              >
                <Zap className="ml-2" />
                <span>Summarize Page</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>AI Features</SidebarGroupLabel>
          <SidebarMenu>
            {data.aiFeatures.map((section) => (
              <Collapsible
                key={section.title}
                asChild
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={section.title}>
                      <section.icon />
                      <span>{section.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <a href={item.url} className="flex items-center">
                              {item.icon && typeof item.icon === 'string' ? (
                                <span className="mr-2">{item.icon}</span>
                              ) : item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                              ) : null}
                              <span>{item.title}</span>
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
          <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Bot className="mr-2" />
                  <span>Compression mode: {compressionMode}</span>
                  <ChevronRight className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                className="w-[--radix-popper-anchor-width]"
              >
                {compressionModes.map((item) => (
                  <DropdownMenuItem 
                    key={item.value}
                    onClick={() => setCompressionMode(item.value)}
                    className="flex items-center"
                  >
                    {typeof item.icon === 'string' ? (
                      <span className="mr-2">{item.icon}</span>
                    ) : (
                      <item.icon className="mr-2 h-4 w-4" />
                    )}
                    <span>{item.title}</span>
                    {compressionMode === item.value && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
