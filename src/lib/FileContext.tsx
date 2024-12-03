"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface FileContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  filename: string | null;
  currentBookId: number | null;
  setCurrentBookId: (id: number | null) => void;
}

const FileContext = createContext<FileContextType>({
  file: null,
  setFile: () => {},
  filename: null,
  currentBookId: null,
  setCurrentBookId: () => {},
});

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [currentBookId, setCurrentBookId] = useState<number | null>(null);

  // Load file and book ID from localStorage on mount
  useEffect(() => {
    const savedFile = localStorage.getItem('lastOpenedFile');
    const savedBookId = localStorage.getItem('currentBookId');
    
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
  }, []);

  // Save file to localStorage when it changes
  const handleSetFile = (newFile: File | null) => {
    setFile(newFile);
    setFilename(newFile?.name || null);
    if (!newFile) {
      setCurrentBookId(null);
      localStorage.removeItem('lastOpenedFile');
      localStorage.removeItem('currentBookId');
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

  const handleSetCurrentBookId = (id: number | null) => {
    setCurrentBookId(id);
    if (id) {
      localStorage.setItem('currentBookId', id.toString());
    } else {
      localStorage.removeItem('currentBookId');
    }
  };

  return (
    <FileContext.Provider value={{ 
      file, 
      setFile: handleSetFile, 
      filename,
      currentBookId,
      setCurrentBookId: handleSetCurrentBookId,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFile = () => useContext(FileContext); 