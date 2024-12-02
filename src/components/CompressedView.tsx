import { memo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

// Add interface for compressed content
interface CompressedViewProps {
  content: string;
  isLoading: boolean;
  streamingContent: string;
}

const CompressedView = memo<CompressedViewProps>(({ content, isLoading, streamingContent }) => {
  const displayContent = streamingContent || content;
  
  if (isLoading && !displayContent) {
    return (
      <div className="w-full space-y-4 p-8">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  return (
    <div className={cn(
      // Base styles
      "w-full max-w-[800px] mx-auto px-8 py-6",
      "bg-white dark:bg-gray-950",
      // Typography
      "prose prose-sm md:prose-base dark:prose-invert max-w-none",
      // PDF-like styles
      "font-serif leading-relaxed",
      // Custom styles for PDF-like appearance
      "[&>p]:mb-4 [&>p]:text-justify",
      "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-6",
      "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-4",
      "[&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-3",
      // List styles
      "[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4",
      "[&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4",
      // Quote styles
      "[&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:dark:border-gray-700",
      "[&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-4",
      // Table styles
      "[&_table]:border-collapse [&_table]:w-full",
      "[&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-700 [&_td]:p-2",
      "[&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-700 [&_th]:p-2",
      // Code block styles
      "[&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded",
      // Ensure proper contrast in dark mode
      "dark:text-gray-100"
    )}>
      <ReactMarkdown
        components={{
          // Customize markdown components
          p: ({ children }) => (
            <p className="text-base leading-7">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-6">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-3">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-base leading-7">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
});

CompressedView.displayName = 'CompressedView';

export default CompressedView; 