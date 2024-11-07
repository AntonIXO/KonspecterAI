"use client"

import * as React from "react"
import { Bot, ChevronRight, Zap, LucideIcon, ScrollText } from "lucide-react"
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
  onSummarizePage?: (type: 'short' | 'full') => void;
}

// Add type for summary options
type SummaryOption = {
  title: string;
  type: 'short' | 'full';
}

// Add summary options
const summaryOptions: SummaryOption[] = [
  { title: "Quick Summary", type: "short" },
  { title: "Detailed Summary", type: "full" },
]

export function ReaderSidebar({ onSummarizePage, ...props }: ReaderSidebarProps) {
  const { compressionMode, setCompressionMode } = useSidebar()
  const [summaries, setSummaries] = useState<MenuItem[]>([])
  const [selectedSummary, setSelectedSummary] = useState<MenuItem | null>(null)
  const supabase = createClient()

  // Add state to track open sections
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Add effect to close sections when sidebar collapses
  const { state } = useSidebar()
  useEffect(() => {
    if (state === 'collapsed') {
      setOpenSections([]);
    }
  }, [state]);

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
  }, [supabase])

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
          <div className="h-[52px] px-4 py-2">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent group-data-[state=collapsed]:invisible">
              KonspecterAI
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Big Summarize Button */}
          <SidebarGroup className="mb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton 
                      className="w-full justify-center bg-gradient-to-r from-blue-600 to-violet-500 text-white hover:from-blue-700 hover:to-violet-600"
                      tooltip="Summarize Page"
                    >
                      <Zap />
                      <span className="group-data-[collapsible=icon]:hidden">Summarize Page</span>
                      <ChevronRight className="ml-auto group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="right"
                    className="w-[--radix-popper-anchor-width]"
                  >
                    {summaryOptions.map((option) => (
                      <DropdownMenuItem 
                        key={option.type}
                        onClick={() => onSummarizePage?.(option.type)}
                        className="flex items-center"
                      >
                        <span>{option.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  open={openSections.includes(section.title)}
                  onOpenChange={(isOpen) => {
                    setOpenSections(prev => 
                      isOpen 
                        ? [...prev, section.title]
                        : prev.filter(title => title !== section.title)
                    );
                  }}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={section.title}>
                        <section.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{section.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenu>
                        {section.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              onClick={() => handleSummaryClick(item)}
                              className="cursor-pointer"
                              tooltip={item.title}
                            >
                              {item.icon && typeof item.icon === 'string' ? (
                                <span className="mr-2">{item.icon}</span>
                              ) : item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                              ) : null}
                              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
                  <SidebarMenuButton tooltip="Compression Mode">
                    <Bot className="mr-2" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Compression mode: {compressionMode}
                    </span>
                    <ChevronRight className="ml-auto group-data-[collapsible=icon]:hidden" />
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
        onOpenChange={(open: boolean) => !open && setSelectedSummary(null)}
        title="Summary"
        content={selectedSummary?.content || ''}
      />
    </>
  )
}
