"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { updateReadProgress, getReadProgress } from './progress-tracker';

interface FileContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  filename: string | null;
  currentBookId: number | null;
  setCurrentBookId: (id: number | null) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const FileContext = createContext<FileContextType>({
  file: null,
  setFile: () => {},
  filename: null,
  currentBookId: null,
  setCurrentBookId: () => {},
  currentPage: 1,
  setCurrentPage: () => {},
});

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [currentBookId, setCurrentBookId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Ref to track if we need to save progress
  const hasUnsavedProgress = useRef(false);

  // Load from localStorage
  useEffect(() => {
    const savedFile = localStorage.getItem('lastOpenedFile');
    const savedBookId = localStorage.getItem('currentBookId');
    const savedPage = localStorage.getItem('currentPage');
    
    if (savedFile) {
      const { name, type, data } = JSON.parse(savedFile);
      const bytes = atob(data);
      const buffer = new ArrayBuffer(bytes.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) {
        view[i] = bytes.charCodeAt(i);
      }
      const recoveredFile = new File([buffer], name, { type });
      setFile(recoveredFile);
      setFilename(name);
    }

    if (savedBookId) {
      setCurrentBookId(Number(savedBookId));
    }
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  // Save progress handler
  const saveProgress = useCallback(async () => {
    if (!currentBookId || !hasUnsavedProgress.current || currentPage > 1) return;

    const success = await updateReadProgress(currentBookId, currentPage);
    if (success) {
      hasUnsavedProgress.current = false;
    }
  }, [currentBookId, currentPage]);

  // Auto-save progress every minute
  useEffect(() => {
    const interval = setInterval(saveProgress, 60000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // Save progress on unmount or book change
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress();
    };
  }, [saveProgress]);

  const handleSetFile = (newFile: File | null) => {
    setFile(newFile);
    setFilename(newFile?.name || null);
    if (!newFile) {
      setCurrentBookId(null);
      setCurrentPage(1);
      localStorage.removeItem('lastOpenedFile');
      localStorage.removeItem('currentBookId');
      localStorage.removeItem('currentPage');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const estimatedSize = base64.length * 0.75;
        const maxSize = 5 * 1024 * 1024;
        
        if (estimatedSize > maxSize) {
          console.warn('File too large to save in localStorage');
          return;
        }

        const fileData = {
          name: newFile.name,
          type: newFile.type,
          data: base64
        };
        localStorage.setItem('lastOpenedFile', JSON.stringify(fileData));
      } catch (error) {
        console.warn('Failed to save file to localStorage:', error);
        try {
          localStorage.removeItem('lastOpenedFile');
        } catch (e) {
          console.error('Failed to clear localStorage:', e);
        }
      }
    };
    reader.readAsDataURL(newFile);
  };

  const handleSetCurrentBookId = async (id: number | null) => {
    setCurrentBookId(id);
    if (id) {
      localStorage.setItem('currentBookId', id.toString());
      const lastPage = await getReadProgress(id);
      if (lastPage > 0) {
        setCurrentPage(lastPage);
      } else {
        setCurrentPage(1);
      }
    } else {
      localStorage.removeItem('currentBookId');
      setCurrentPage(1);
    }
  };

  // Add this effect to track page changes
  useEffect(() => {
    if (currentBookId && currentPage > 0) {
      hasUnsavedProgress.current = true;
      localStorage.setItem('currentPage', currentPage.toString());
    }
  }, [currentPage, currentBookId]);

  return (
    <FileContext.Provider value={{ 
      file, 
      setFile: handleSetFile, 
      filename,
      currentBookId,
      setCurrentBookId: handleSetCurrentBookId,
      currentPage,
      setCurrentPage,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFile = () => useContext(FileContext); 