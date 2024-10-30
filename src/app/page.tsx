"use client"

import Image from "next/image";
import { useState } from "react";
import { ReactReader } from "react-reader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useFile } from "@/lib/FileContext";

export default function Home() {
  const router = useRouter();
  const { file, setFile } = useFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleLoad = () => {
    router.push("/reader");
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by uploading your book.
          </li>
          <li>Highlight text to use AI.</li>
        </ol>
        <div className="w-full max-w-md flex flex-col gap-4">
          <Input
            type="file"
            accept=".epub, .pdf"
            onChange={handleFileChange}
            className="border border-gray-300 dark:border-gray-700 p-2 rounded"
          />
          <Button
            onClick={handleLoad}
            disabled={!file}
          >
            Load File
          </Button>
        </div>
      </main>
    </div>
  );
}
