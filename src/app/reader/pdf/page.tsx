"use client"

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent } from "@/components/ui/card";
import { TextSelection } from "@/components/TextSelection";

import { createOllama } from "ollama-ai-provider";
import { generateText } from "ai";
import { Summary } from "@/components/Summary";
import { ReaderSidebar } from "@/components/reader-sidebar";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
  const [summary, setSummary] = useState<string>("");
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  const { state } = useSidebar();

  useEffect(() => {
    if (!file) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [file, router]);

  const ollama = createOllama();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < (numPages || 1) ? prev + 1 : prev));
  }, [numPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  }, []);

  const handleSummarize = async (t: string) => {
    // Handle PDF text summarization
    console.log("Summarizing text:", t);
    const resp = await generateText({
      model: ollama(process.env.OLLAMA_MODEL || "llama3.2:1b"),
      prompt: "Summarize given text. Output summarize only. Follow original text language. Text: " + t,
    });
    setSummary(resp.text);
    setSummaryOpen(true);
  };

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

  // Add wheel event handler
  // const handleWheel = useCallback((e: WheelEvent) => {
  //   if (e.deltaY > 0) {
  //     goToNextPage();
  //   } else if (e.deltaY < 0) {
  //     goToPrevPage();
  //   }
  // }, [goToNextPage, goToPrevPage]);

  // // Add wheel event listener
  // useEffect(() => {
  //   const documentElement = document.querySelector('.pdf-container');
  //   if (documentElement) {
  //     const wheelHandler = (e: Event) => handleWheel(e as WheelEvent);
  //     documentElement.addEventListener('wheel', wheelHandler);
  //     return () => documentElement.removeEventListener('wheel', wheelHandler);
  //   }
  // }, [handleWheel]);

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

  if (!file) {
    return null;
  }

  // Add this function to extract text from the current page
  const handlePageSummarize = async () => {
    try {
      // May be better. Not sure
      const page = document.querySelector('.react-pdf__Page')
      if (page) {
        const textContent = page.textContent
        if (textContent) {
          await handleSummarize(textContent);
        }
      }
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Summary text={summary} open={summaryOpen} setOpen={setSummaryOpen} />
      <div className={cn(
        "min-h-screen p-4 flex flex-col items-center transition-[margin] duration-200 ease-linear",
        // Add margin when sidebar is expanded
        "md:ml-0 md:data-[sidebar-state=expanded]:ml-48"
      )} data-sidebar-state={state}>
        <div className="w-full max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <Button onClick={() => router.push("/")} className="">
              ← Back
            </Button>
          </div>

          <Card className="w-full overflow-hidden bg-white">
            <CardContent className="p-6">
                <div className="w-full flex flex-col items-center">
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="max-w-full pdf-container"
                    onItemClick={handleItemClick}
                  >
                    <Page
                      pageNumber={currentPage}
                      width={maxWidth}
                      className="mb-4"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>

                  <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center justify-center gap-4">
                    <Button
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span>Page <input
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
                        className="w-16 px-2 py-1 border rounded"
                      /> of {numPages}</span>
                      
                    </div>

                    <Button
                      onClick={goToNextPage}
                      disabled={currentPage >= (numPages || 1)}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ReaderSidebar onSummarizePage={handlePageSummarize} variant="floating"/>
      <SidebarTrigger />
      <TextSelection onSummarize={handleSummarize} />
    </div>
  );
}
