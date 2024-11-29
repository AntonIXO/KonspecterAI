"use client"

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useMemo, memo } from "react";
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
import { summarizeWithChromeAI } from '@/utils/chromeai';
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

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
}

// Add new interface for page dimensions
interface PageDimensions {
  width: number;
  height: number;
}

// Add new interface for compressed content
interface CompressedViewProps {
  content: string;
  isLoading: boolean;
  streamingContent: string;
}

// Update CompressedView component
const CompressedView = memo<CompressedViewProps>(({ content, isLoading, streamingContent }) => {
  const displayContent = streamingContent || content;
  
  if (isLoading && !displayContent) {
    return (
      <div className="w-full space-y-4 p-8">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className={cn(
      // Base styles
      "w-full max-w-[800px] mx-auto px-8 py-6",
      "bg-white dark:bg-gray-950",
      // Typography
      "prose prose-sm md:prose-base dark:prose-invert max-w-none",
      // PDF-like styles
      "font-serif leading-relaxed",
      // Custom styles for PDF-like appearance
      "[&>p]:mb-4 [&>p]:text-justify",
      "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-6",
      "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-4",
      "[&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-3",
      // List styles
      "[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4",
      "[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4",
      // Quote styles
      "[&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:dark:border-gray-700",
      "[&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4",
      // Table styles
      "[&_table]:border-collapse [&_table]:w-full",
      "[&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-700 [&_td]:p-2",
      "[&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-700 [&_th]:p-2",
      // Code block styles
      "[&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded",
      // Ensure proper contrast in dark mode
      "dark:text-gray-100"
    )}>
      {/* <div className="w-full p-4 prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown> */}
      <ReactMarkdown
        components={{
          // Customize markdown components
          p: ({ children }) => (
            <p className="text-base leading-7">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-3">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-7">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
});

CompressedView.displayName = 'CompressedView';

// Update the PDFPage component with proper typing and display name
const PDFPage = memo<PDFPageProps>(({ 
  file, 
  currentPage, 
  windowWidth, 
  scale, 
  onItemClick, 
  onLoadSuccess,
  onPageLoadSuccess 
}) => {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      className="max-w-full pdf-container relative"
      onItemClick={onItemClick}
      options={useMemo(() => ({
        enableHWA: true,
      }), [])}
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
  const { file } = useFile();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>(String(currentPage));
  const { state, compressionMode } = useSidebar();
  const [windowWidth, setWindowWidth] = useState<number>(maxWidth);
  const { pagesContent, setPageContent, clearContent } = useText();
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({ width: 0, height: 0 });
  const [compressedContent, setCompressedContent] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');

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
    const jump = compressionMode === '1:3' ? 3 : 
                 compressionMode === '1:2' ? 2 : 1;

    if (direction === 'next') {
      if (currentPage >= (numPages || 1)) return currentPage;
      return Math.min(currentPage + jump, numPages || 1);
    } else {
      if (currentPage <= 1) return currentPage;
      return Math.max(currentPage - jump, 1);
    }
  }, []);

  // Simplified navigation handlers using the shared logic
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => calculatePageJump(prev, 'next', numPages, compressionMode));
  }, [numPages, compressionMode, calculatePageJump]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => calculatePageJump(prev, 'prev', numPages, compressionMode));
  }, [numPages, compressionMode, calculatePageJump]);

  // Update page input validation
  const validateAndSetPage = useCallback((newPage: number) => {
    if (isNaN(newPage) || newPage < 1 || newPage > (numPages || 1)) {
      setInputValue(String(currentPage));
      return;
    }

    // Ensure the page aligns with compression mode
    if (compressionMode !== '1:1') {
      const jump = compressionMode === '1:3' ? 3 : 2;
      // Round to nearest valid page number based on jump size
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

  // Extract text content when page changes
  const extractPageContent = useCallback(async (pageNum: number) => {
    if (!pdfDocument) return;

    // Skip if we already have this page's content
    if (pagesContent[pageNum]) return;

    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      setPageContent(pageNum, pageText);
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }, [pdfDocument, pagesContent, setPageContent]);

  // Handle page changes
  useEffect(() => {
    if (!pdfDocument) return;

    // Extract content for current page and adjacent pages
    const pagesToExtract = [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2
    ].filter(page => page > 0 && page <= (numPages || 0));

    Promise.all(pagesToExtract.map(pageNum => extractPageContent(pageNum)));
  }, [currentPage, numPages, pdfDocument, extractPageContent]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  // Add effect to handle compression
  useEffect(() => {
    let isMounted = true;

    const compressCurrentPage = async () => {
      if (!pagesContent[currentPage] || compressionMode === '1:1') {
        setCompressedContent('');
        setStreamingContent('');
        return;
      }

      setIsCompressing(true);
      setStreamingContent(''); // Reset streaming content
      
      try {
        const result = await summarizeWithChromeAI(
          compressionMode === '1:2' 
            ? pagesContent[currentPage] + pagesContent[currentPage + 1]
            : pagesContent[currentPage] + pagesContent[currentPage + 2],
          compressionMode
        );

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
      } catch (error) {
        console.error('Compression error:', error);
      } finally {
        if (isMounted) {
          setIsCompressing(false);
        }
      }
    };

    compressCurrentPage();
    return () => {
      isMounted = false;
    };
  }, [pagesContent, currentPage, compressionMode]);

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
            <Button onClick={() => router.push("/")} className="w-full md:w-auto">
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
                {compressionMode === '1:1' ? (
                  <PDFPage
                    file={file}
                    currentPage={currentPage}
                    windowWidth={windowWidth}
                    scale={scale}
                    onItemClick={handleItemClick}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onPageLoadSuccess={setPageDimensions}
                  />
                ) : (
                  <CompressedView 
                    content={compressedContent}
                    isLoading={isCompressing}
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
          onClick={() => handlePageChange(currentPage + 1)}
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
    </div>
  );
}
