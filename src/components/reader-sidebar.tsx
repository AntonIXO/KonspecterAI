"use client"

import * as React from "react"
import { ChevronRight, Zap, LucideIcon, ScrollText, X, Brain } from "lucide-react"
import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client";
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { Quiz } from "@/components/Quiz"
import { useFile } from "@/lib/FileContext";

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
    {
      title: "Quiz",
      icon: Brain,
      items: [], // Will be populated with saved quizzes
    }
  ],
}

// Add type for props
interface ReaderSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onSummarizePage?: (type: 'short' | 'full') => void;
}

export function ReaderSidebar({ ...props }: ReaderSidebarProps) {
  const [data, setData] = useState(baseData); // Initialize state with baseData
  const { state } = useSidebar();
  const { filename } = useFile();

  const supabase = createClient()

  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState("")

  const [quizOpen, setQuizOpen] = useState(false)
  const [quizText, setQuizText] = useState("")

  // Add state to track open sections
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Add selectedSummary state
  const [selectedSummary, setSelectedSummary] = useState<MenuItem | null>(null);

  // Add effect to close sections when sidebar collapses
  useEffect(() => {
    if (state === 'collapsed') {
      setOpenSections([]);
    }
  }, [state]);

  // Fetch summaries and update 'Summaries' section
  useEffect(() => {
    const fetchSummaries = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: summariesData, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('path', filename)
        .limit(5)

      if (error) {
        console.error(error)
        return
      }

      const summaryItems = summariesData.map((summary: any) => ({
        title: summary.content.substring(0, 30) + '...',
        url: `/summaries/${summary.id}`,
        content: summary.content,
      }))
      
      // Update the Summaries section in data
      setData(prev => ({
        aiFeatures: prev.aiFeatures.map(section => 
          section.title === "Summaries" 
            ? { ...section, items: summaryItems }
            : section
        )
      }));
    }
    fetchSummaries()
  }, [supabase, filename])

  // Fetch quizzes and update 'Quiz' section
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('public_id, title, path, created_at')
        .eq('path', filename)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error(error);
        return;
      }

      const quizItems = quizzes.map((quiz: any) => ({
        title: quiz.title,
        url: `/quiz/${quiz.public_id}`,
      }));

      // Update the Quiz section in data
      setData(prev => ({
        aiFeatures: prev.aiFeatures.map(section => 
          section.title === "Quiz" 
            ? { ...section, items: quizItems }
            : section
        )
      }));
    };

    fetchQuizzes();
  }, [supabase, filename]);

  const handleSaveSummary = async (text: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to save summaries");
        return;
      }

      // Create new summary object
      const newSummary = {
        title: text.substring(0, 30) + '...',
        url: `/summaries/${Date.now()}`, // Temporary ID until we get real one
        content: text,
      }

      // Optimistically update UI
      setData(prev => ({
        aiFeatures: prev.aiFeatures.map(section => 
          section.title === "Summaries" 
            ? { ...section, items: [newSummary, ...section.items] }
            : section
        )
      }));
      setChatOpen(false)

      // Save to database
      const { error } = await supabase.from('summaries').insert({
        user_id: user.id,
        content: text,
        path: filename,
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

      // Optimistically update UI
      setData(prev => ({
        aiFeatures: prev.aiFeatures.map(section => 
          section.title === "Summaries" 
            ? { ...section, items: section.items.filter(s => s.url !== summaryUrl) }
            : section
        )
      }));

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

  const handleSummaryClick = (summary: MenuItem) => {
    setSelectedSummary(summary);
  };

  const handleStartChat = () => {
    const page = document.querySelector('.react-pdf__Page');
    const textContent = page?.textContent;
    setChatText(textContent || '')
    setChatOpen(true)
  }

  const handleTextSelection = (text: string) => {
    setChatText(text)
    setChatOpen(true)
  }

  const handleStartQuiz = () => {
    const page = document.querySelector('.react-pdf__Page')
    const textContent = page?.textContent
    setQuizText(textContent || '')
    setQuizOpen(true)
  }

  const handleDeleteQuiz = async (quizUrl: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const quizId = quizUrl.split('/').pop()

      // Optimistically update UI
      setData(prev => ({
        aiFeatures: prev.aiFeatures.map(section => 
          section.title === "Quiz" 
            ? { ...section, items: section.items.filter(q => q.url !== quizUrl) }
            : section
        )
      }));

      // Delete from database
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('public_id', quizId)

      if (error) throw error
      toast.success("Quiz deleted successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete quiz")
    }
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
                <SidebarMenuButton 
                  onClick={handleStartChat}
                  className="w-full justify-center bg-gradient-to-r from-blue-600 to-violet-500 text-white hover:from-blue-700 hover:to-violet-600"
                  tooltip="Chat with PDF"
                >
                  <Zap />
                  <span className="group-data-[collapsible=icon]:hidden">Chat with PDF</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleStartQuiz}
                  className="w-full justify-center bg-gradient-to-r from-green-600 to-teal-500 text-white hover:from-green-700 hover:to-teal-600"
                  tooltip="Generate Quiz"
                >
                  <Brain />
                  <span className="group-data-[collapsible=icon]:hidden">Generate Quiz</span>
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
                              onClick={() => {
                                if (section.title === "Summaries") {
                                  handleSummaryClick(item);
                                }
                                if (section.title === "Quiz") {
                                  window.location.href = item.url;
                                }
                              }}
                              className="cursor-pointer group relative"
                              tooltip={item.title}
                            >
                              {item.icon && typeof item.icon === 'string' ? (
                                <span className="mr-2">{item.icon}</span>
                              ) : item.icon ? (
                                <item.icon className="mr-2 h-4 w-4" />
                              ) : null}
                              <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                              {(section.title === "Summaries" || section.title === "Quiz") && (
                                <X 
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                  onClick={(e) => 
                                    section.title === "Summaries" 
                                      ? handleDeleteSummary(item.url, e)
                                      : handleDeleteQuiz(item.url, e)
                                  }
                                />
                              )}
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
              {/* You can add more menu items or features here */}
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
        text={chatText} 
        open={chatOpen} 
        setOpen={setChatOpen}
        handleSave={handleSaveSummary}
      />
      <TextSelection handleSummarize={handleTextSelection} />
      <Quiz 
        text={quizText}
        open={quizOpen}
        setOpen={setQuizOpen}
      />
    </>
  )
}
