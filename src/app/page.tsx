"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useFile } from "@/lib/FileContext";
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavUser } from "@/components/nav-user";
import { useDropzone } from 'react-dropzone';
import { FilePlus, FileText, Loader2, X } from 'lucide-react';
import { useTheme } from "next-themes";
import { getBooks, uploadFile, getBookUrl, deleteBook } from "@/lib/storage";
import { User } from "@supabase/supabase-js";
import { toast } from 'sonner';
import { pdfjs } from "react-pdf";
import { FileObject } from "@supabase/storage-js";
import { Progress } from "@/components/ui/progress";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function Home() {
  const router = useRouter();
  const { file, setFile } = useFile();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Get user
  const [user, setUser] = useState<User>()
  const supabase = createClient()
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/landing');
        return
      }
      setUser(user)
    }
    getUser()
  }, [supabase, router])
  // if (!user) return

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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState({ 
    current: 0, 
    total: 0 
  });

  const handleUpload = async () => {
    if (!file || !user) return
    
    setIsUploading(true);
    setUploadProgress(0);
    setIndexingProgress({ current: 0, total: 0 });
    
    try {
      // Upload file to storage
      const updatedBooks = await uploadFile(file, user.id)
      setUploadProgress(30);
      
      // Generate embeddings for text content
      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
        const paragraphs: string[] = [];
        
        // Extract paragraphs from PDF
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageText = textContent.items.map((item: any) => item.str).join(' '); 
          
          const pageParagraphs = pageText
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
          
          paragraphs.push(...pageParagraphs);
        }

        setUploadProgress(50);
        setIndexingProgress({ current: 0, total: paragraphs.length });

        // Process paragraphs in batches with a delay between calls
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        const BATCH_SIZE = 10; // Process 5 paragraphs concurrently
        const DELAY_MS = 20;  // Delay between batches

        // Helper function to process paragraphs in batches
        const processParagraphsBatch = async (paragraphs: string[], file: File) => {
          for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
            const batch = paragraphs.slice(i, i + BATCH_SIZE);
            
            // Process batch concurrently
            await Promise.all(batch.map(async (paragraph) => {
              try {
                const { error } = await supabase.functions.invoke('embed', {
                  body: { text: paragraph, path: file.name }
                });
                
                if (error) throw error;
                
                // Update progress
                setIndexingProgress(prev => ({ ...prev, current: prev.current + 1 }));
                setUploadProgress(50 + Math.floor(((i + batch.length) / paragraphs.length) * 50));
              } catch (error) {
                console.error('Error processing paragraph:', error);
              }
            }));
            
            // Add delay between batches to prevent rate limiting
            await delay(DELAY_MS);
          }
        };

        // Replace the existing for loop with this call
        await processParagraphsBatch(paragraphs, file);
      }

      if (updatedBooks) {
        setBooks(updatedBooks)
        setFile(null)
        setUploadProgress(100);
        toast.success('File uploaded and indexed successfully')
      }
    } catch (error) {
      console.error('Error uploading and processing file:', error)
      toast.error('Error uploading file')
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setIndexingProgress({ current: 0, total: 0 });
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<FileObject[]>([]);
  useEffect(() => {
    if (!user) return
    getBooks(user.id)
      .then((data) => setBooks(data || []))
      .finally(() => setIsLoading(false));
  }, [user]);

  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  const [deletingBook, setDeletingBook] = useState<string | null>(null);

  const handleDeleteBook = async (e: React.MouseEvent, name: string) => {
    e.stopPropagation(); // Prevent opening the book when clicking delete
    if (!user) return;
    
    try {
      setDeletingBook(name);
      const success = await deleteBook(user.id, name);
      if (success) {
        setBooks(books.filter(book => book.name !== name));
      }
    } catch (error) {
      toast.error("Error deleting book");
      console.error(error);
    } finally {
      setDeletingBook(null);
    }
  };

  async function openBook(name: string) {
    if (!user) return;
    
    try {
      setLoadingBook(name); // Start loading state for this specific book
      
      const blob = await getBookUrl(user.id, name);
      if (!blob) {
        toast.error("Could not download book");
        return;
      }

      // Create a File object directly from the blob
      const file = new File([blob], name, { type: blob.type });
      setFile(file);

      // Route based on file type
      if (name.toLowerCase().endsWith('.pdf')) {
        router.push('/reader/pdf');
      } else if (name.toLowerCase().endsWith('.epub')) {
        router.push('/reader/epub');
      }
    } catch (error) {
      toast.error("Error opening book");
      console.error(error);
    } finally {
      setLoadingBook(null); // Clear loading state
    }
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
          {/* Upload Card */}
          <div className="h-[200px] flex flex-col gap-4">
            <div
              {...getRootProps()}
              className={`h-full border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? isDark 
                    ? 'border-blue-500 bg-blue-950/50 scale-95' 
                    : 'border-blue-500 bg-blue-50 scale-95'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <Loader2 className="mx-auto mb-2 text-gray-500 dark:text-gray-400 animate-spin" size={32} />
              ) : (
                <FilePlus className="mx-auto mb-2 text-gray-500 dark:text-gray-400" size={32} />
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isDragActive 
                  ? 'Drop the files here ...' 
                  : (file 
                    ? `Selected file: ${truncateFileName(file.name, 20)}` 
                    : 'Drag & drop a file here, or click to select files'
                  )
                }
              </p>
              {isUploading && (
                <div className="mt-4">
                  <Progress value={uploadProgress} className="h-1" />
                  <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadProgress < 30 ? 'Uploading file...' :
                       uploadProgress < 50 ? 'Parsing PDF...' :
                       uploadProgress < 100 ? 'Indexing content...' : 'Complete!'}
                    </p>
                    {indexingProgress.total > 0 && uploadProgress >= 50 && uploadProgress < 100 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Indexed {indexingProgress.current} of {indexingProgress.total} paragraphs
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>

          {/* Books Grid */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[200px]">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ))
          ) : books?.map((book: FileObject) => (
            <div
              key={book.name}
              className="h-[200px] border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 relative group"
              onClick={() => {
                setFile(new File([], book.name));
                openBook(book.name);
              }}
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDeleteBook(e, book.name)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900"
                aria-label="Delete book"
              >
                {deletingBook === book.name ? (
                  <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </button>

              {/* Book icon and name */}
              {loadingBook === book.name ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
              ) : (
                <FileText size={32} className="text-gray-500 dark:text-gray-400" />
              )}
              <p className="text-sm text-center font-medium">
                {truncateFileName(book.name, 20)}
              </p>
            </div>
          ))}
        </div>

        <div className="fixed bottom-4 left-4 z-50">
          <NavUser />
        </div>
      </main>
    </div>
  );
}
