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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const maxWidth = 1100;

export default function PDFReader() {
  const router = useRouter();
  const { file } = useFile();
  // const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  // const [containerWidth, setContainerWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>(String(currentPage));
  const [summary, setSummary] = useState<string>("");
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);
  
  // const onResize = useCallback<ResizeObserverCallback>((entries) => {
  //   const [entry] = entries;
  //   if (entry) {
  //     setContainerWidth(entry.contentRect.width);
  //   }
  // }, []);

  // This causes infinite re-renders
  // useResizeObserver(containerRef, {}, onResize);

  useEffect(() => {
    if (!file) {
      router.push("/");
      return;
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
    console.log("Summarizing PDF text:", t);
    const resp = await generateText({
      model: ollama("lakomoor/vikhr-llama-3.2-1b-instruct:1b"),
      prompt: "Напиши о чем этот текст на русском языке: " + t,
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

  if (!file) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      <TextSelection onSummarize={handleSummarize} />
      <Summary text={summary} open={summaryOpen} setOpen={setSummaryOpen} />
      <div className="min-h-screen p-8 flex flex-col items-center">
        <div className="w-full max-w-6xl">
          <Button onClick={() => router.push("/")} className="mb-4">
            ← Back
          </Button>

          <Card className="w-full overflow-hidden bg-white">
            <CardContent className="p-6">
                <div className="w-full flex flex-col items-center">
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="max-w-full"
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
                          setInputValue(String(currentPage));
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
    </div>
  );
}
