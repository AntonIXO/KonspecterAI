"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useFile } from "@/lib/FileContext";
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavUser } from "@/components/nav-user";
import { useDropzone } from 'react-dropzone';
import { FilePlus } from 'lucide-react';
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useTheme } from "next-themes";

export default function Home() {
  const router = useRouter();
  const { file, setFile } = useFile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const supabase = createClient()
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data?.user);
    }
    checkSession()
  }, [supabase.auth])

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const truncateFileName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    return `${name.substring(0, maxLength - (extension?.length || 0) - 3)}...${extension}`;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/epub+zip': ['.epub'], 'application/pdf': ['.pdf'] },
  });

  const handleLoad = () => {
    if (file?.type === "application/epub+zip") {
      router.push("/reader/epub");
    } else if (file?.type === "application/pdf") {
      router.push("/reader/pdf");
    }
  };

  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RainbowButton
          className="hover:scale-105 transition-transform"
          onClick={() => router.push('/login')}
        >
          Get started
        </RainbowButton>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-[400px] space-y-4">
          <Skeleton className="h-[40px] w-full" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by uploading your book.
          </li>
          <li>Highlight text to use AI.</li>
        </ol>
        <div className="w-full max-w-md flex flex-col gap-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? isDark 
                  ? 'border-blue-500 bg-blue-950/50 scale-95' 
                  : 'border-blue-500 bg-blue-50 scale-95'
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
            }`}
          >
            <input {...getInputProps()} />
            <FilePlus className="mx-auto mb-2 text-gray-500 dark:text-gray-400" size={32} />
            <p className="text-gray-500 dark:text-gray-400">
              {isDragActive 
                ? 'Drop the files here ...' 
                : (file 
                  ? `Selected file: ${truncateFileName(file.name, 20)}` 
                  : 'Drag & drop a file here, or click to select files'
                )
              }
            </p>
          </div>
          <Button
            onClick={handleLoad}
            disabled={!file}
            className="w-full"
          >
            Load File
          </Button>
        </div>
        <div className="fixed bottom-4 left-4 z-50">
          {isAuthenticated && <NavUser />}
        </div>
      </main>
    </div>
  );
}
