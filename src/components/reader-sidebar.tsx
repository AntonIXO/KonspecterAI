"use client"

import * as React from "react"
import { Bot, ChevronRight, MessageSquare, Zap, LucideIcon, ScrollText } from "lucide-react"
import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client";

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
import { SummaryDialog } from "@/components/summary-dialog"

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
  content?: string;
}

type FeatureSection = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
}

// Keep the base data structure
const baseData: { aiFeatures: FeatureSection[] } = {
  aiFeatures: [
    {
      title: "Summaries",
      icon: ScrollText,
      items: [], // This will be populated dynamically
    },
  ],
}

// Add type for props
interface ReaderSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSummarizePage?: () => void;
}

export function ReaderSidebar({ onSummarizePage, ...props }: ReaderSidebarProps) {
  const { compressionMode, setCompressionMode } = useSidebar()
  const [summaries, setSummaries] = useState<MenuItem[]>([])
  const [selectedSummary, setSelectedSummary] = useState<MenuItem | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSummaries = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: summariesData, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error(error)
        return
      }

      const summaryItems = summariesData.map((summary) => ({
        title: summary.content.substring(0, 30) + '...',
        url: `/summaries/${summary.id}`,
        content: summary.content,
      }))
      
      setSummaries(summaryItems)
    }

    fetchSummaries()
    
    const channel = supabase
      .channel('summaries')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'summaries' 
      }, fetchSummaries)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Combine base data with dynamic summaries
  const data = {
    aiFeatures: baseData.aiFeatures.map(section => {
      if (section.title === "Summaries") {
        return {
          ...section,
          items: summaries
        }
      }
      return section
    })
  }

  // Add handler for summary click
  const handleSummaryClick = (summary: MenuItem) => {
    setSelectedSummary(summary)
  }

  return (
    <>
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
                            <SidebarMenuButton
                              onClick={() => handleSummaryClick(item)}
                              className="cursor-pointer"
                            >
                              {item.icon && typeof item.icon === 'string' ? (
                                <span className="mr-2">{item.icon}</span>
                              ) : item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                              ) : null}
                              <span>{item.title}</span>
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

      <SummaryDialog
        open={!!selectedSummary}
        onOpenChange={(open: any) => !open && setSelectedSummary(null)}
        title="Summary"
        content={selectedSummary?.content || ''}
      />
    </>
  )
}
