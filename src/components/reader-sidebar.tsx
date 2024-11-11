"use client"

import * as React from "react"
import { ChevronRight, Zap, LucideIcon, ScrollText, X } from "lucide-react"
import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client";
import Link from "next/link"

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
import { TextSelection } from "@/components/TextSelection"
import { Summary } from "./Summary";
import { toast } from "sonner";

// const compressionModes = [
//   { title: "Default (1:1)", value: "1:1", icon: Bot },
//   { title: "Compression (1:2)", value: "1:2", icon: Zap },
//   { title: "SuperCompression (1:3)", value: "1:3", icon: "⚡⚡" },
// ] as const

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
  { title: "Quick chat", type: "short" },
  { title: "Detailed chat", type: "full" },
]

export function ReaderSidebar({ ...props }: ReaderSidebarProps) {
  // const { compressionMode, setCompressionMode } = useSidebar()
  const [summaries, setSummaries] = useState<MenuItem[]>([])
  const [selectedSummary, setSelectedSummary] = useState<MenuItem | null>(null)
  const supabase = createClient()
  
  const [summary, setSummary] = useState("")
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryType, setSummaryType] = useState<'short' | 'full'>('short')

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
  }, [supabase])

  const handleSave = async (text: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Please login to save summaries")
            return
        }

        // Create new summary object
        const newSummary = {
            title: text.substring(0, 30) + '...',
            url: `/summaries/${Date.now()}`, // Temporary ID until we get real one
            content: text,
        }

        // Optimistically update UI
        setSummaries(prev => [newSummary, ...prev])
        setSummaryOpen(false)

        // Save to database
        const { error } = await supabase.from('summaries').insert({
            user_id: user.id,
            content: text,
            created_at: new Date().toISOString()
        })

        if (error) throw error
        toast.success("Summary saved successfully")
    } catch (error) {
        console.error(error)
        toast.error("Failed to save summary")
    }
  }

  const handleDeleteSummary = async (summaryUrl: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the summary click
    try {
      const summaryId = summaryUrl.split('/').pop()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please login to delete summaries")
        return
      }

      // Optimistically update UI
      setSummaries(prev => prev.filter(s => s.url !== summaryUrl))

      // Delete from database
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', summaryId)

      if (error) throw error
      toast.success("Summary deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete summary")
    }
  }

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

  const handlePageSummarize = (type: 'short' | 'full') => {
    setSummaryType(type)
    const page = document.querySelector('.react-pdf__Page');
    const textContent = page?.textContent;
    setSummary(textContent || '')
    setSummaryOpen(true)
  }

  const handleSummarize = (text: string) => {
    setSummary(text)
    setSummaryType('short')
    setSummaryOpen(true)
  }

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <Link href="/">
            <div className="h-[52px] px-4 py-2 cursor-pointer">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent group-data-[state=collapsed]:invisible">
                KonspecterAI
              </h1>
            </div>
          </Link>
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
                      <span className="group-data-[collapsible=icon]:hidden">Chat with PDF</span>
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
                        onClick={() => handlePageSummarize(option.type)}
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
                              className="cursor-pointer group relative"
                              tooltip={item.title}
                            >
                              {item.icon && typeof item.icon === 'string' ? (
                                <span className="mr-2">{item.icon}</span>
                              ) : item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                              ) : null}
                              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                              <X 
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                onClick={(e) => handleDeleteSummary(item.url, e)}
                              />
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
            {/* <SidebarMenuItem>
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
            </SidebarMenuItem> */}
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
      <Summary 
        text={summary} 
        open={summaryOpen} 
        setOpen={setSummaryOpen}
        handleSave={handleSave}
        type={summaryType}
      />
      <TextSelection handleSummarize={handleSummarize} />
    </>
  )
}
