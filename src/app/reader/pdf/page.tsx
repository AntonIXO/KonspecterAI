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
        renderTextLayer={true}
        renderAnnotationLayer={true}
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
  const { state } = useSidebar();
  const [windowWidth, setWindowWidth] = useState<number>(maxWidth);
  const { pagesContent, setPageContent, clearContent } = useText();
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensions>({ width: 0, height: 0 });

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

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < (numPages || 1) ? prev + 1 : prev));
  }, [numPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

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
              height: pageDimensions.height > 0 ? `${pageDimensions.height * scale}px` : 'auto',
              transition: 'height 0.2s ease-in-out'
            }}
          >
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="w-full flex flex-col items-center" {...swipeHandlers}>
                <PDFPage
                  file={file}
                  currentPage={currentPage}
                  windowWidth={windowWidth}
                  scale={scale}
                  onItemClick={handleItemClick}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onPageLoadSuccess={setPageDimensions}
                />
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
                  if (!isNaN(newPage) && newPage >= 1 && newPage <= (numPages || 1)) {
                    handlePageChange(newPage);
                  } else {
                    setInputValue(String(currentPage));
                  }
                }
              }}
              onBlur={() => {
                const newPage = parseInt(inputValue);
                if (!isNaN(newPage) && newPage >= 1 && newPage <= (numPages || 1)) {
                  handlePageChange(newPage);
                } else {
                  setInputValue(String(currentPage));
                }
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
    </div>
  );
}
