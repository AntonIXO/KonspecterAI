"use client";

import { createContext, useContext, useEffect, useState } from 'react';

interface FileContextType {
  file: File | null;
  setFile: (file: File | null) => void;
}

const FileContext = createContext<FileContextType>({
  file: null,
  setFile: () => {},
});

export function FileProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);

  // Load file from localStorage on mount
  useEffect(() => {
    const savedFile = localStorage.getItem('lastOpenedFile');
    if (savedFile) {
      // Convert base64 back to File object
      const { name, type, data } = JSON.parse(savedFile);
      const bytes = atob(data);
      const buffer = new ArrayBuffer(bytes.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) {
        view[i] = bytes.charCodeAt(i);
      }
      const recoveredFile = new File([buffer], name, { type });
      setFile(recoveredFile);
    }
  }, []);

  // Save file to localStorage when it changes
  const handleSetFile = (newFile: File | null) => {
    setFile(newFile);
    if (newFile) {
      // Convert File to base64 and save
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          // Check file size before attempting to save
          const estimatedSize = base64.length * 0.75; // base64 encoding increases size by ~33%
          const maxSize = 5 * 1024 * 1024; // 5MB limit (adjust as needed)
          
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
          // Optionally clear localStorage if it's full
          try {
            localStorage.removeItem('lastOpenedFile');
          } catch (e) {
            console.error('Failed to clear localStorage:', e);
          }
        }
      };
      reader.readAsDataURL(newFile);
    } else {
      localStorage.removeItem('lastOpenedFile');
    }
  };

  return (
    <FileContext.Provider value={{ file, setFile: handleSetFile }}>
      {children}
    </FileContext.Provider>
  );
}

export const useFile = () => useContext(FileContext); 