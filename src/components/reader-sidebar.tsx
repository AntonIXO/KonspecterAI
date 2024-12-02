"use client"

import * as React from "react"
import { ChevronRight, Zap, LucideIcon, ScrollText, X, Brain, ChevronDown, Bot, ZapOff, PlugZap, Globe2, StopCircle } from "lucide-react"
import { useEffect, useState, useMemo } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isPromptAPIAvailable, cleanupSession, isTranslationAPIAvailable } from '@/utils/chromeai';
import { ModelDownloadProgress } from "@/components/ModelDownloadProgress"
import { cn } from "@/lib/utils"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/components/ui/sidebar"

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

// Modify the props interface to be more explicit
interface ReaderSidebarProps {
  className?: string;
  variant?: "sidebar" | "floating" | "inset"
}

// Memoize the entire component
export const ReaderSidebar = React.memo(function ReaderSidebar({ 
  className, 
  variant = "sidebar",
  ...props 
}: ReaderSidebarProps) {
  const [data, setData] = useState(baseData); // Initialize state with baseData
  const { state, compressionMode, setCompressionMode, setLanguage, language } = useSidebar();
  const { filename } = useFile();

  const supabase = createClient()

  const [chatOpen, setChatOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)

  // Add state to track open sections
  const [openSections, setOpenSections] = useState<string[]>([]);

  // Add selectedSummary state
  const [selectedSummary, setSelectedSummary] = useState<MenuItem | null>(null);

  // Add selectedText state
  const [selectedText, setSelectedText] = useState<string>("");

  // Add effect to close sections when sidebar collapses
  useEffect(() => {
    if (state === 'collapsed') {
      setOpenSections([]);
    }
  }, [state]);

  // Memoize data transformations
  const transformedSummaryItems = useMemo(() => (summariesData: any[]) => 
    summariesData.map((summary: any) => ({
      title: summary.content.substring(0, 30) + '...',
      url: `/summaries/${summary.id}`,
      content: summary.content,
    }))
  , []);

  const transformedQuizItems = useMemo(() => (quizzes: any[]) => 
    quizzes.map((quiz: any) => ({
      title: quiz.title,
      url: `/quiz/${quiz.public_id}`,
    }))
  , []);

  // Update the fetch effects to use memoized transformations
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

      const summaryItems = transformedSummaryItems(summariesData);
      
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
  }, [supabase, filename, transformedSummaryItems])

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

      const quizItems = transformedQuizItems(quizzes);

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
  }, [supabase, filename, transformedQuizItems]);

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
    setChatOpen(true)
  }

  const handleTextSelection = (text: string) => {
    setSelectedText(text);
    setChatOpen(true);
  };

  const handleStartQuiz = () => {
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'x') {
        if (chatOpen) {
          setChatOpen(false)
        } else {
          setChatOpen(true);
        }
      }
      if (event.ctrlKey && event.key === 'q') {
        if (quizOpen) {
          setQuizOpen(false)
        } else {
          setQuizOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array to set up once

  // Memoize the menu buttons
  const menuButtons = useMemo(() => ({
    chat: (
      <SidebarMenuButton 
        onClick={handleStartChat}
        className="w-full justify-center bg-gradient-to-r from-blue-600 to-violet-500 text-white hover:from-blue-700 hover:to-violet-600"
        tooltip="Chat with PDF"
      >
        <Zap />
        <span className="group-data-[collapsible=icon]:hidden">Chat with PDF</span>
      </SidebarMenuButton>
    ),
    quiz: (
      <SidebarMenuButton 
        onClick={handleStartQuiz}
        className="w-full justify-center bg-gradient-to-r from-green-600 to-teal-500 text-white hover:from-green-700 hover:to-teal-600"
        tooltip="Generate Quiz"
      >
        <Brain />
        <span className="group-data-[collapsible=icon]:hidden">Generate Quiz</span>
      </SidebarMenuButton>
    )
  }), []) // Empty dependency array since handlers are stable

  // Add this memoized compression menu component
  const [isSummarizerEnabled, setIsSummarizerEnabled] = useState(false);

  useEffect(() => {
    setIsSummarizerEnabled(isPromptAPIAvailable());
  }, []);

  const compressionMenu = useMemo(() => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton 
            className="w-full justify-between group relative"
            tooltip={isSummarizerEnabled ? "Text Compression" : "Your browser doesn't support local AI compression"}
            isActive={isSummarizerEnabled}
            disabled={!isSummarizerEnabled}
          >
            <div className="flex items-center">
              <Bot className="h-4 w-4" />
              <span className="ml-2 group-data-[state=collapsed]:hidden">Compression: {compressionMode}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[160px]">
          <DropdownMenuItem onClick={() => setCompressionMode("1:1")} className="flex items-center">
            <ZapOff className="h-4 w-4 mr-2" />
            <span>Normal (1:1)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompressionMode("1:2")} className="flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            <span>Medium (1:2)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCompressionMode("1:3")} className="flex items-center">
            <PlugZap className="h-4 w-4 mr-2" />
            <span>High (1:3)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  ), [compressionMode, setCompressionMode, isSummarizerEnabled])

  const [downloadProgress, setDownloadProgress] = useState<{loaded: number, total: number} | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent<{loaded: number, total: number}>) => {
      setDownloadProgress(e.detail);
    };
    
    window.addEventListener('modelDownloadProgress', handler as EventListener);
    
    // Reset progress when unmounting
    return () => {
      window.removeEventListener('modelDownloadProgress', handler as EventListener);
      setDownloadProgress(null);
    };
  }, []);

  // Add translation menu component
  const translationMenu = useMemo(() => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton 
          className="w-full justify-between group relative"
          tooltip="Translate text"
          disabled={!isTranslationAPIAvailable()}
        >
          <div className="flex items-center">
            <Globe2 className="h-4 w-4" />
            <span className="ml-2 group-data-[state=collapsed]:hidden">
              {language === "disabled" ? (
                "Translation: Disabled"
              ) : (
                `Translate to: ${SUPPORTED_LANGUAGES[language].name} ${SUPPORTED_LANGUAGES[language].flag}`
              )}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[160px] max-h-[300px] overflow-y-auto">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
          <DropdownMenuItem 
            key={code}
            onClick={() => setLanguage(code as SupportedLanguage)}
            className={cn(
              "flex items-center gap-2",
              code === "disabled" && "border-b border-border"
            )}
          >
            <span className="text-base">{flag}</span>
            <span className={cn(
              "flex-1",
              language === code && "font-medium"
            )}>
              {name}
            </span>
            {language === code && (
              <ChevronRight className="h-4 w-4 ml-2 opacity-50" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ), [language]);

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const handleGenerationStart = () => {
      setIsGenerating(true);
    };
    const handleGenerationEnd = () => {
      setIsGenerating(false);
    };

    // Use 'as EventListener' to properly type the event handlers
    window.addEventListener('generationStart', handleGenerationStart as EventListener);
    window.addEventListener('generationEnd', handleGenerationEnd as EventListener);

    return () => {
      window.removeEventListener('generationStart', handleGenerationStart as EventListener);
      window.removeEventListener('generationEnd', handleGenerationEnd as EventListener);
    };
  }, []);

  const handleInterrupt = () => {
    cleanupSession();
    setIsGenerating(false);
  };

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className={className}
        variant={variant}
        {...props}
      >
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
          <SidebarGroup className="mb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                {menuButtons.chat}
              </SidebarMenuItem>
              <SidebarMenuItem>
                {menuButtons.quiz}
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
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Offline AI</SidebarGroupLabel>
            <SidebarMenu>
              {downloadProgress && (
              <SidebarMenuItem>
                  <div className="px-2 py-1 w-full">
                    <ModelDownloadProgress 
                      loaded={downloadProgress.loaded} 
                      total={downloadProgress.total}
                    />
                  </div>
                </SidebarMenuItem>
              )}
              {compressionMenu}
              {translationMenu}
              {isGenerating && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={handleInterrupt}
                    className="w-full justify-between text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950"
                    tooltip="Stop Generation"
                  >
                    <div className="flex items-center">
                      <StopCircle className="h-4 w-4" />
                      <span className="ml-2 group-data-[state=collapsed]:hidden">Stop Generation</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
        open={chatOpen} 
        setOpen={setChatOpen}
        handleSave={handleSaveSummary}
        selectedText={selectedText}
      />
      <TextSelection handleSummarize={handleTextSelection} />
      <Quiz 
        open={quizOpen}
        setOpen={setQuizOpen}
      />
    </>
  )
})
