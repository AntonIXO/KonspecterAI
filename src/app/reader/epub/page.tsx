"use client"

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactReader } from "react-reader";
import { Button } from "@/components/ui/button";
import { useFile } from "@/lib/FileContext";

export default function EpubReader() {
  const router = useRouter();
  const { file } = useFile();
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
    </div>
  );
}
