"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useFile } from "@/lib/FileContext";
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from "react";
import { Auth } from "@/components/Auth";
import { Skeleton } from "@/components/ui/skeleton";
import { NavUser } from "@/components/nav-user";

export default function Home() {
  const router = useRouter();
  const { file, setFile } = useFile();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const supabase = createClient()
  
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(!!data?.user);
    }
    checkSession()
  }, [supabase.auth])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

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
        <Auth />
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
        <div className="fixed bottom-4 left-4 z-50">
          {isAuthenticated && <NavUser />}
        </div>
      </main>
    </div>
  );
}
