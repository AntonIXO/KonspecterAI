"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ReactReader } from "react-reader";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Card, CardContent } from "@/components/ui/card";
import { useResizeObserver } from "@wojtekmaj/react-hooks";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const maxWidth = 800;

export default function Reader() {
  const router = useRouter();
  const { file } = useFile();
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, {}, onResize);

  useEffect(() => {
    if (!file) {
      router.push("/");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBuffer(e.target?.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }, [file, router]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (!file) {
    return null;
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <Button onClick={() => router.push("/")} className="mb-4">
          ← Back
        </Button>

        <Card className="w-full overflow-hidden bg-white">
          <CardContent className="p-6" ref={setContainerRef}>
            {file.type === "application/epub+zip" && fileBuffer && (
              <div className="w-full h-full mt-4">
                <ReactReader
                  url={fileBuffer}
                  location={location}
                  locationChanged={(epubcfi: string) => setLocation(epubcfi)}
                />
              </div>
            )}

            {file.type === "application/pdf" && (
              <div className="w-full flex flex-col items-center">
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="max-w-full"
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      width={containerWidth ? Math.min(containerWidth - 48, maxWidth) : maxWidth}
                      className="mb-4"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  ))}
                </Document>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
