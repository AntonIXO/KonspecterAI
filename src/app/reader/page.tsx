"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactReader } from "react-reader";
import { Document, Page as PDFPage } from "react-pdf";
import { Button } from "@/components/ui/button";
import { pdfjs } from 'react-pdf';
import { useFile } from "@/lib/FileContext";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function Reader() {
  const router = useRouter();
  const { file } = useFile();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

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
    <div className="min-h-screen p-8 w-screen h-screen">
      <Button onClick={() => router.push("/")} className="absolute z-10">
        ← Back
      </Button>

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
        <div className="w-full h-full mt-4">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <PDFPage key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      )}
    </div>
  );
}
