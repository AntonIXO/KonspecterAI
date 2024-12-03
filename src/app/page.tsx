"use client"
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useFile } from "@/lib/FileContext";
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavUser } from "@/components/nav-user";
import { useDropzone } from 'react-dropzone';
import { FilePlus, FileText, Loader2, X, Pencil } from 'lucide-react';
import { useTheme } from "next-themes";
import { getBooks, uploadFile, getBookUrl, deleteBook, renameBook } from "@/lib/storage";
import { User } from "@supabase/supabase-js";
import { toast } from 'sonner';
import { pdfjs } from "react-pdf";
import { Progress } from "@/components/ui/progress";
import { Book } from "@/lib/storage";
import { RenameDialog } from "@/components/rename-dialog";
import { CircularProgress } from "@/components/ui/circular-progress";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Add these helper functions near the top of the file
const sanitizeFilename = (filename: string): string => {
  // Split filename into name and extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot !== -1 ? filename.slice(0, lastDot) : filename;
  const extension = lastDot !== -1 ? filename.slice(lastDot) : '';

  // Replace non-English characters with closest English equivalents
  // Add more mappings as needed
  const charMap: { [key: string]: string } = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ý': 'y', 'ñ': 'n',
    'ß': 'ss',
    // Add more mappings for other characters as needed
  };

  // Replace special characters and spaces
  const sanitized = name
    .split('')
    .map(char => charMap[char.toLowerCase()] || char)
    .join('')
    .replace(/[^a-zA-Z0-9-_.]/g, '_') // Replace any remaining non-English chars with underscore
    .replace(/_{2,}/g, '_'); // Replace multiple consecutive underscores with single underscore

  return sanitized + extension;
};

export default function Home() {
  const router = useRouter();
  const { file, setFile, setCurrentBookId } = useFile();
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
      const file = acceptedFiles[0];
      const sanitizedName = sanitizeFilename(file.name);
      
      if (sanitizedName !== file.name) {
        // Create new file with sanitized name
        const newFile = new File([file], sanitizedName, { type: file.type });
        toast.success(`File renamed to: ${sanitizedName}`);
        setFile(newFile);
      } else {
        setFile(file);
      }
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
    if (!file || !user) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setIndexingProgress({ current: 0, total: 0 });
    
    try {
      const pdfjs = await import('pdfjs-dist');
      const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
      // Upload file and create book record
      const updatedBooks = await uploadFile(file, user.id, pdf.numPages);
      if (!updatedBooks) {
        setIsUploading(false);
        return;
      }
      setUploadProgress(30);
      
      // Get the newly created book's ID (it should be the first one since we order by id desc)
      const newBook = updatedBooks[0];
      
      // Generate embeddings for text content
      if (file.type === 'application/pdf') {
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

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        const BATCH_SIZE = 9;
        const DELAY_MS = 40;

        const processParagraphsBatch = async (paragraphs: string[], bookId: number) => {
          for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
            const batch = paragraphs.slice(i, i + BATCH_SIZE);
            
            await Promise.all(batch.map(async (paragraph) => {
              try {
                const { error } = await supabase.functions.invoke('embed', {
                  body: { 
                    text: paragraph, 
                    bookId: bookId // Pass book ID instead of path
                  }
                });
                
                if (error) throw error;
                
                setIndexingProgress(prev => ({ ...prev, current: prev.current + 1 }));
                setUploadProgress(50 + Math.floor(((i + batch.length) / paragraphs.length) * 50));
              } catch (error) {
                console.error('Error processing paragraph:', error);
              }
            }));
            
            await delay(DELAY_MS);
          }
        };

        await processParagraphsBatch(paragraphs, newBook.id);
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
  const [books, setBooks] = useState<Book[]>([]);
  useEffect(() => {
    if (!user) return
    getBooks(user.id)
      .then((data) => setBooks(data || []))
      .finally(() => setIsLoading(false));
  }, [user]);

  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  const [deletingBook, setDeletingBook] = useState<string | null>(null);

  const handleDeleteBook = async (e: React.MouseEvent, book: Book) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      setDeletingBook(book.name);
      const success = await deleteBook(book.id, user.id, book.name);
      if (success) {
        setBooks(books.filter(b => b.id !== book.id));
      }
    } catch (error) {
      toast.error("Error deleting book");
      console.error(error);
    } finally {
      setDeletingBook(null);
    }
  };

  async function openBook(book: Book) {
    if (!user) return;
    
    try {
      setLoadingBook(book.name);
      
      const blob = await getBookUrl(book.id, user.id, book.name);
      if (!blob) {
        toast.error("Could not download book");
        return;
      }

      const file = new File([blob], book.name, { type: blob.type });
      setFile(file);
      setCurrentBookId(book.id);

      if (book.name.toLowerCase().endsWith('.pdf')) {
        router.push('/reader/pdf');
      } else if (book.name.toLowerCase().endsWith('.epub')) {
        router.push('/reader/epub');
      }
    } catch (error) {
      toast.error("Error opening book");
      console.error(error);
    } finally {
      setLoadingBook(null);
    }
  }

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [bookToRename, setBookToRename] = useState<Book | null>(null);

  const handleRenameClick = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation(); // Prevent opening the book
    setBookToRename(book);
    setRenameDialogOpen(true);
  };

  const handleRename = async (newName: string) => {
    if (!user || !bookToRename) return;
    
    const updatedBooks = await renameBook(bookToRename, newName, user.id);
    if (updatedBooks) {
      setBooks(updatedBooks);
      toast.success('Book renamed successfully');
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">
        KonspecterAI
      </h1>
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
          ) : books?.map((book: Book) => (
            <div
              key={book.id}
              className="h-[200px] border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 relative group"
              onClick={() => {
                setFile(new File([], book.name));
                openBook(book);
              }}
            >
              <div className="absolute top-2 left-2">
                <CircularProgress 
                  value={book.pages_read} 
                  max={book.pages} 
                  size={28}
                  className="bg-white dark:bg-gray-950 rounded-full"
                  gaugePrimaryColor={isDark ? "#3b82f6" : "#2563eb"}
                  gaugeSecondaryColor={isDark ? "#374151" : "#e5e7eb"}
                />
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={(e) => handleRenameClick(e, book)}
                  className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900"
                  aria-label="Rename book"
                >
                  <Pencil className="h-4 w-4 text-blue-500" />
                </button>
                <button
                  onClick={(e) => handleDeleteBook(e, book)}
                  className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900"
                  aria-label="Delete book"
                >
                  {deletingBook === book.name ? (
                    <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </button>
              </div>
              {loadingBook === book.name ? (
                <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
              ) : (
                <FileText size={32} className="text-gray-500 dark:text-gray-400" />
              )}
              <p className="text-sm text-center font-medium">
                {truncateFileName(book.name, 20)}
              </p>
              <p className="text-xs text-gray-500">
                {book.pages_read} of {book.pages} pages read
              </p>
            </div>
          ))}
        </div>

        <div className="fixed bottom-4 left-4 z-50">
          <NavUser />
        </div>
      </main>

      <RenameDialog
        book={bookToRename}
        isOpen={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRename}
      />
    </div>
  );
}
