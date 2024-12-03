"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PageContent {
  text: string;
  incompleteText: string;
}

interface PagesContent {
  [pageNum: number]: PageContent;
}

interface TextContextType {
  pagesContent: PagesContent;
  setPageContent: (pageNum: number, content: PageContent) => void;
  clearContent: () => void;
  getPageRange: (startPage: number, endPage: number) => string;
}

const TextContext = createContext<TextContextType | undefined>(undefined);

export function TextProvider({ children }: { children: ReactNode }) {
  const [pagesContent, setPagesContent] = useState<PagesContent>({});

  const setPageContent = useCallback((pageNum: number, content: PageContent) => {
    setPagesContent(prev => {
      // If content already exists and is the same, don't update
      if (prev[pageNum] === content) {
        return prev;
      }

      const newContent = { ...prev, [pageNum]: content };
      
      // Get all page numbers and sort them by distance from current page
      const pageNumbers = Object.keys(newContent).map(Number);
      if (pageNumbers.length > 7) {
        const sortedPages = pageNumbers
          .sort((a, b) => Math.abs(pageNum - a) - Math.abs(pageNum - b))
          .slice(0, 7);
        
        // Create new object with only the pages we want to keep
        const filteredContent: PagesContent = {};
        sortedPages.forEach(p => {
          filteredContent[p] = newContent[p];
        });
        return filteredContent;
      }
      
      return newContent;
    });
  }, []);

  const clearContent = useCallback(() => {
    setPagesContent({});
  }, []);

  // Add new method to get content from a range of pages
  const getPageRange = useCallback((startPage: number, endPage: number): string => {
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      if (pagesContent[i]) {
        pages.push(pagesContent[i].text);
      }
    }
    return pages.join('\n\n');
  }, [pagesContent]);

  return (
    <TextContext.Provider value={{ 
      pagesContent, 
      setPageContent, 
      clearContent,
      getPageRange 
    }}>
      {children}
    </TextContext.Provider>
  );
}

export function useText() {
  const context = useContext(TextContext);
  if (context === undefined) {
    throw new Error('useText must be used within a TextProvider');
  }
  return context;
} 