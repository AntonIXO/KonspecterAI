"use client"

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent } from "@/components/ui/card";

import { ReaderSidebar } from "@/components/reader-sidebar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const maxWidth = 1100;

export default function PDFReader() {
  const router = useRouter();
  const { file } = useFile();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>(String(currentPage));
  const { state } = useSidebar();
  const [windowWidth, setWindowWidth] = useState<number>(maxWidth);

  useEffect(() => {
    if (!file) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [file, router]);

  // Setup reader
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < (numPages || 1) ? prev + 1 : prev));
  }, [numPages]);
  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
      const page = parseInt(pageNumber, 10);
      if (!isNaN(page)) {
        setCurrentPage(page);
      }
    }
  }, []);

  // Add useEffect to handle window width
  useEffect(() => {
    setWindowWidth(Math.min(maxWidth, window.innerWidth - 32));
    
    const handleResize = () => {
      setWindowWidth(Math.min(maxWidth, window.innerWidth - 32));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

          <Card className="w-full overflow-hidden bg-white">
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="w-full flex flex-col items-center">
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="max-w-full pdf-container relative"
                  onItemClick={handleItemClick}
                >
                  <Page
                    pageNumber={currentPage}
                    width={windowWidth}
                    className="mb-4"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className={cn(
        // Base styles
        "fixed bottom-0 left-0 right-0 z-50",
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
                    setCurrentPage(newPage);
                  } else {
                    setInputValue(String(currentPage));
                  }
                }
              }}
              onBlur={() => {
                const newPage = parseInt(inputValue);
                if (!isNaN(newPage) && newPage >= 1 && newPage <= (numPages || 1)) {
                  setCurrentPage(newPage);
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
      </div>
      <ReaderSidebar variant="floating"/>
    </div>
  );
}
