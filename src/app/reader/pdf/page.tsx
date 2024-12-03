"use client"

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useMemo, memo, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent } from "@/components/ui/card";

import { ReaderSidebar } from "@/components/reader-sidebar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ZoomOut, ZoomIn, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSwipeable } from "react-swipeable";
import { useText } from '@/lib/TextContext';
import { compressWithChromeAI as compressWithChromeAI } from '@/utils/chromeai';
import { translateText } from '@/utils/chromeai';
import CompressedView from "@/components/CompressedView";
import { updateReadProgress } from "@/lib/progress-tracker";
import { QuizPrompt } from "@/components/quiz-prompt";
import { Quiz } from "@/components/Quiz";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const maxWidth = 1100;

// Add interface for PDFPage props
interface PDFPageProps {
  file: File;
  currentPage: number;
  windowWidth: number;
  scale: number;
  onItemClick: ({ pageNumber }: { pageNumber: string | number }) => void;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onPageLoadSuccess: (dimensions: PageDimensions) => void;
  options: any;
}

// Add new interface for page dimensions
interface PageDimensions {
  width: number;
  height: number;
}

// Move options memoization outside the component
const documentOptions = {
  enableHWA: true,
} as const;

// Update CompressedView component
const PDFPage = memo<PDFPageProps>(({ 
  file, 
  currentPage, 
  windowWidth, 
  scale, 
  onItemClick, 
  onLoadSuccess,
  onPageLoadSuccess,
  options
}) => {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      className="max-w-full pdf-container relative"
      onItemClick={onItemClick}
      options={options}
    >
      <Page
        pageNumber={currentPage}
        width={windowWidth * scale}
        className="mb-4"
        onLoadSuccess={(page) => {
          onPageLoadSuccess({
            width: page.width,
            height: page.height
          });
        }}
      />
    </Document>
  );
});

// Add display name
PDFPage.displayName = 'PDFPage';

export default function PDFReader() {
  const router = useRouter();
  const { file, currentPage, setCurrentPage, currentBookId } = useFile();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>(String(currentPage));
  const { state, compressionMode, language } = useSidebar();
  const [windowWidth, setWindowWidth] = useState<number>(maxWidth);
  const { pagesContent, setPageContent, clearContent, getPageRange } = useText();
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({ width: 0, height: 0 });
  const [compressedContent, setCompressedContent] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isPending, setIsPending] = useState(false);
  // const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const lastQuizPage = useRef(0);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!file) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [file, router]);

  // Setup reader
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  // Extract page navigation logic into a single function
  const calculatePageJump = useCallback((
    currentPage: number, 
    direction: 'next' | 'prev',
    numPages: number | null,
    compressionMode: string
  ) => {
    // Calculate jump size based on compression mode
    const jump = compressionMode === '1:3' ? 3 : 
                 compressionMode === '1:2' ? 2 : 1;

    if (direction === 'next') {
      if (currentPage >= (numPages || 1)) return currentPage;
      
      // Calculate next page based on jump size
      const nextPage = currentPage + jump;
      
      // Ensure we don't go past the last page
      return Math.min(nextPage, numPages || 1);
    } else {
      if (currentPage <= 1) return currentPage;
      
      // Calculate previous page based on jump size
      const prevPage = currentPage - jump;
      
      // Ensure we don't go below page 1
      return Math.max(prevPage, 1);
    }
  }, []);

  // Simplified navigation handlers using the shared logic
  const goToNextPage = useCallback(() => {
    setCompressedContent('');
    setStreamingContent('');
    setIsPending(true);
    const nextPage = calculatePageJump(currentPage, 'next', numPages, compressionMode);
    setCurrentPage(nextPage);
  }, [currentPage, numPages, compressionMode, calculatePageJump]);

  const goToPrevPage = useCallback(() => {
    setCompressedContent('');
    setStreamingContent('');
    setIsPending(true);
    const prevPage = calculatePageJump(currentPage, 'prev', numPages, compressionMode);
    setCurrentPage(prevPage);
  }, [currentPage, numPages, compressionMode, calculatePageJump]);

  // Update page input validation
  const validateAndSetPage = useCallback((newPage: number) => {
    if (isNaN(newPage) || newPage < 1 || newPage > (numPages || 1)) {
      setInputValue(String(currentPage));
      return;
    }

    // Clear content and show loading state before page change
    setCompressedContent('');
    setStreamingContent('');
    setIsPending(true);

    // Ensure the page aligns with compression mode
    if (compressionMode !== '1:1') {
      const jump = compressionMode === '1:3' ? 3 : 2;
      const alignedPage = Math.ceil(newPage / jump) * jump - (jump - 1);
      setCurrentPage(Math.min(alignedPage, numPages || 1));
      setInputValue(String(alignedPage));
    } else {
      setCurrentPage(newPage);
      setInputValue(String(newPage));
    }
  }, [currentPage, numPages, compressionMode]);

  // Keyboard navigation and zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
        e.preventDefault(); // Prevent default browser zoom in
        setScale((prev) => Math.min(prev + 0.1, 2.0)); // Zoom in
      } else if (e.ctrlKey && e.key === '-') {
        e.preventDefault(); // Prevent default browser zoom out
        setScale((prev) => Math.max(prev - 0.1, 0.5)); // Zoom out
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, numPages]);

  // Add this effect to update inputValue when currentPage changes
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  // To fix links in the PDF
  const handleItemClick = useCallback(({ pageNumber }: { pageNumber: string | number }) => {
    if (typeof pageNumber === 'number') {
      setCurrentPage(pageNumber);
    } else {
      const page = parseInt(pageNumber as string, 10);
      if (!isNaN(page)) {
        setCurrentPage(page);
      }
    }
  }, []);

  // Add useEffect to handle window width
  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(Math.min(maxWidth, window.innerWidth - 32));
    };

    updateWidth();

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Add swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < (numPages || 1)) {
        goToNextPage();
      }
    },
    onSwipedRight: () => {
      if (currentPage > 1) {
        goToPrevPage();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  // Clear content when file changes
  useEffect(() => {
    if (file) {
      clearContent();
    }
  }, [file, clearContent]);

  // Initialize PDF document once when file changes
  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      try {
        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument(arrayBuffer).promise;
        setPdfDocument(pdf);
        clearContent();
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPdf();
  }, [file, clearContent]);

  // Helper function to handle sentence boundaries
  const processSentenceBoundaries = useCallback((text: string) => {
    // Find the last sentence ending punctuation
    const regex = /[.!?](?=\s|$)/g;
    let match: RegExpExecArray | null;
    let lastMatch: RegExpExecArray | null = null;

    while ((match = regex.exec(text)) !== null) {
      lastMatch = match;
    }

    if (!lastMatch) {
      // No sentence ending found, entire text might be incomplete
      return { completeText: '', incompleteText: text };
    }

    const lastIndex = lastMatch.index + 1; // +1 to include the punctuation

    // Split at the last sentence ending
    const completeText = text.slice(0, lastIndex).trim();
    const incompleteText = text.slice(lastIndex).trim();

    return { completeText, incompleteText };
  }, []);

  // Extract text content when page changes
  const extractPageContent = useCallback(async (pageNum: number) => {
    if (!pdfDocument) return;

    // Skip if we already have this page's content
    if (pagesContent[pageNum]) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const rawPageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      // Get incomplete text from previous page if it exists
      const prevPageIncomplete = pagesContent[pageNum - 1]?.incompleteText || '';
      
      // Combine with current page text
      const combinedText = prevPageIncomplete
        ? `${prevPageIncomplete} ${rawPageText}`.trim()
        : rawPageText;
      
      // Process sentence boundaries
      const { completeText, incompleteText } = processSentenceBoundaries(combinedText);
      
      // Store only the complete part for the current page
      setPageContent(pageNum, {
        text: completeText,
        incompleteText: incompleteText
      });
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }, [pdfDocument, pagesContent, setPageContent, processSentenceBoundaries]);

  // Handle page changes
  useEffect(() => {
    if (!pdfDocument) return;

    // Extract content for current page and adjacent pages
    const pagesToExtract = [
      currentPage - 1, // Only need the previous page for incompleteText
      currentPage,
      currentPage + 1, // Next page will receive incompleteText
    ].filter(page => page > 0 && page <= (numPages || 0));

    Promise.all(pagesToExtract.map(pageNum => extractPageContent(pageNum)));
  }, [currentPage, numPages, pdfDocument, extractPageContent]);

  // Memoize the compression effect dependencies
  const compressionDeps = useMemo(() => ({
    pagesContent,
    currentPage,
    compressionMode,
    numPages
  }), [pagesContent, currentPage, compressionMode, numPages]);

  // Update the compression effect to handle multiple pages
  useEffect(() => {
    let isMounted = true;

    const processPage = async () => {
      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      setAbortController(controller);

      // Get text from current and next pages based on compression mode
      const pagesToInclude = compressionMode === '1:3' ? 3 : 
                            compressionMode === '1:2' ? 2 : 1;
      
      const combinedText = getPageRange(currentPage, currentPage + pagesToInclude - 1);

      if (!combinedText) {
        setCompressedContent('');
        setStreamingContent('');
        setTranslatedContent('');
        setIsPending(false);
        return;
      }

      try {
        // Handle compression if enabled
        if (compressionDeps.compressionMode !== '1:1') {
          setIsCompressing(true);
          const result = await compressWithChromeAI(combinedText);

          if (result?.stream) {
            let fullContent = '';
            for await (const chunk of result.stream()) {
              if (!isMounted) break;
              fullContent += chunk;
              setStreamingContent(fullContent);
            }
            if (isMounted) {
              setCompressedContent(fullContent);
            }
          }
        }

        // Handle translation if enabled
        if (language !== 'disabled') {
          setIsTranslating(true);
          const result = await translateText(
            combinedText,
            language,
          );

          if (isMounted && result?.stream) {
            let previousChunk = '';
            let fullContent = '';
            
            for await (const chunk of result.stream()) {
              if (!isMounted) break;
              const newChunk = chunk.startsWith(previousChunk)
                ? chunk.slice(previousChunk.length)
                : chunk;
              
              fullContent += newChunk;
              setStreamingContent(fullContent);
              previousChunk = chunk;
            }
            
            if (isMounted) {
              setTranslatedContent(fullContent);
            }
          }
        } else {
          setTranslatedContent('');
          setStreamingContent('');
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Processing aborted');
        } else {
          console.error('Processing error:', error);
        }
      } finally {
        if (isMounted) {
          setIsCompressing(false);
          setIsTranslating(false);
          setIsPending(false);
        }
      }
    };

    processPage();
    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [compressionDeps, language]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Update the render method to show translated content with streaming
  const displayContent = language !== 'disabled' ? 
                        (streamingContent || translatedContent) : 
                        compressionMode !== '1:1' ? 
                        compressedContent : 
                        null;

  // Update quiz prompt logic
  useEffect(() => {
    if (!currentBookId || currentPage <= 1) return;

    // Skip quiz prompt on initial file load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastQuizPage.current = currentPage; // Set initial page as last quiz page
      return;
    }

    const pagesSinceLastQuiz = currentPage - lastQuizPage.current;
    
    // Show quiz prompt every 10 pages
    if (pagesSinceLastQuiz >= 11) {
      setShowQuizPrompt(true);
      lastQuizPage.current = currentPage;
    }
  }, [currentPage, currentBookId]);

  // Reset initial load state when file changes
  useEffect(() => {
    if (file) {
      isInitialLoad.current = true;
    }
  }, [file]);

  // Handle starting the quiz from the prompt
  const handleStartQuiz = useCallback(() => {
    setShowQuizPrompt(false);
    setShowQuiz(true);
  }, []);

  if (!file) return null;

  return (
    <div className="relative min-h-screen pb-[120px] sm:pb-[72px]">
      <div className={cn(
        "min-h-screen p-4 flex flex-col items-center transition-[margin] duration-200 ease-linear",
        "md:ml-0 md:data-[sidebar-state=expanded]:ml-48"
      )} data-sidebar-state={state}>
        <div className="w-full max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <SidebarTrigger />
            <Button onClick={() => {router.push("/"); updateReadProgress(currentBookId || 0, currentPage)}} className="w-full md:w-auto">
              ← Back
            </Button>
          </div>

          <Card 
            className="w-full overflow-hidden bg-white dark:bg-gray-950"
            style={{
              height: compressionMode === '1:1' && pageDimensions.height > 0 
                ? `${pageDimensions.height * scale}px` 
                : 'auto',
              transition: 'height 0.2s ease-in-out'
            }}
          >
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="w-full flex flex-col items-center" {...swipeHandlers}>
                {/* Change this condition to check for both compression and translation */}
                {compressionMode === '1:1' && language === 'disabled' ? (
                  <PDFPage
                    file={file}
                    currentPage={currentPage}
                    windowWidth={windowWidth}
                    scale={scale}
                    onItemClick={handleItemClick}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onPageLoadSuccess={setPageDimensions}
                    options={documentOptions} // Pass memoized options
                  />
                ) : (
                  <CompressedView 
                    content={displayContent || ''}
                    isLoading={(isCompressing || isPending || isTranslating) && !displayContent}
                    streamingContent={streamingContent}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={cn(
        // Base styles
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm",
        "border-t dark:border-gray-800",
        "p-2 sm:p-4 shadow-lg",
        // Safe area padding for mobile devices
        "pb-[env(safe-area-inset-bottom,0.5rem)]",
        // Layout
        "flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4",
        // Ensure controls stay above content
        "sticky-controls"
      )}>
        <Button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          variant="outline"
          className="w-full sm:w-auto shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2 text-sm sm:text-base dark:text-gray-200">
          <span className="flex items-center gap-2 whitespace-nowrap">
            Page 
            <Input
              type="number"
              min={1}
              max={numPages || 1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newPage = parseInt(inputValue);
                  validateAndSetPage(newPage);
                }
              }}
              onBlur={() => {
                const newPage = parseInt(inputValue);
                validateAndSetPage(newPage);
              }}
              className="w-16 sm:w-20 text-center shadow-sm"
            />
            of {numPages}
          </span>
        </div>

        <Button
          onClick={goToNextPage}
          disabled={currentPage >= (numPages || 1)}
          variant="outline"
          className="w-full sm:w-auto shadow-sm"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        <div className="flex items-center gap-2 text-sm sm:text-base dark:text-gray-200">
          <span className="flex items-center gap-2 whitespace-nowrap">
            Scale: {Math.round(scale * 100)}%
          </span>
        </div>

        <Button
          onClick={() => setScale((prev) => Math.min(prev + 0.1, 2.0))} // Zoom in
          variant="outline"
          className="w-full sm:w-auto shadow-sm flex items-center gap-2"
        >
          <ZoomIn className="w-4 h-4" />
          Zoom In
        </Button>

        <Button
          onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))} // Zoom out
          variant="outline"
          className="w-full sm:w-auto shadow-sm flex items-center gap-2"
        >
          <ZoomOut className="w-4 h-4" />
          Zoom Out
        </Button>
      </div>
      <ReaderSidebar variant="floating" className="z-50"/>
      
      {/* Add quiz components at the end */}
      <QuizPrompt 
        open={showQuizPrompt}
        onOpenChange={setShowQuizPrompt}
        onStartQuiz={handleStartQuiz}
      />
      <Quiz 
        open={showQuiz}
        setOpen={setShowQuiz}
      />
    </div>
  );
}
