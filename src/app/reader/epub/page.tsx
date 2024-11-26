"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactReader } from "react-reader";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";
import { Card, CardContent } from "@/components/ui/card";
import { ReaderSidebar } from "@/components/reader-sidebar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function EpubReader() {
  const router = useRouter();
  const { file } = useFile();
  const [location, setLocation] = useState<string | number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const { state } = useSidebar();
  // const [currentPage, setCurrentPage] = useState<number>(1);
  // const [totalPages, setTotalPages] = useState<number>(0);
  // const { clearContent, setPageContent } = useText();
  // const [rendition, setRendition] = useState<any>(null);

  // File loading and validation
  useEffect(() => {
    if (!file) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBuffer(e.target?.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }, [file, router]);

  // Clear content when file changes
  // useEffect(() => {
  //   if (file) {
  //     clearContent();
  //   }
  // }, [file, clearContent]);

  // // Navigation handlers
  // const goToNextPage = useCallback(() => {
  //   if (rendition) {
  //     rendition.next();
  //     setCurrentPage(prev => Math.min(prev + 1, totalPages));
  //   }
  // }, [rendition, totalPages]);

  // const goToPrevPage = useCallback(() => {
  //   if (rendition) {
  //     rendition.prev();
  //     setCurrentPage(prev => Math.max(prev - 1, 1));
  //   }
  // }, [rendition]);

  // // Keyboard navigation
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
  //       goToNextPage();
  //     } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
  //       goToPrevPage();
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [goToNextPage, goToPrevPage]);

  // // Swipe handlers
  // const swipeHandlers = useSwipeable({
  //   onSwipedLeft: goToNextPage,
  //   onSwipedRight: goToPrevPage,
  //   preventScrollOnSwipe: true,
  //   trackMouse: false
  // });

  // // Extract text content when page changes
  // const handlePageChange = useCallback((cfi: string) => {
  //   if (rendition) {
  //     rendition.getContents().then((contents: any[]) => {
  //       const pageText = contents
  //         .map(content => content.content.textContent)
  //         .join(' ')
  //         .trim();
  //       setPageContent(currentPage, pageText);
  //     });
  //   }
  // }, [rendition, currentPage, setPageContent]);

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

          <Card className="w-full overflow-hidden bg-white dark:bg-gray-950">
            <CardContent className="p-2 sm:p-4 md:p-6">
              <div className="w-full h-[80vh]">
                {fileBuffer && (
                  <ReactReader
                    url={fileBuffer}
                    location={location}
                    locationChanged={(epubcfi: string) => {
                      setLocation(epubcfi);
                      // handlePageChange(epubcfi);
                    }}
                    getRendition={(rendition) => {
                      // setRendition(rendition);
                      rendition.on('rendered', () => {
                        const locations = rendition.book.locations;
                        if (locations) {
                          // setTotalPages(locations.length());
                        }
                      });
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ReaderSidebar variant="floating" className="z-50"/>
    </div>
  );
}
