"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function TextSelection({ handleSummarize }: { handleSummarize: (text: string) => void }) {

  const [selection, setSelection] = useState<{
    text: string;
    position: { x: number; y: number } | null;
  }>({
    text: "",
    position: null,
  });

  useEffect(() => {
    const handleSelection = (event: MouseEvent | TouchEvent) => {
      const selectedText = window.getSelection();
      
      // Check if selection is within PDF container
      const pdfContainer = document.querySelector('.pdf-container');
      if (!pdfContainer?.contains(event.target as Node)) {
        setSelection({ text: "", position: null });
        return;
      }

      // Check if selection is within text layer
      const textLayer = document.querySelector('.react-pdf__Page__textContent');
      if (!textLayer?.contains(event.target as Node)) {
        setSelection({ text: "", position: null });
        return;
      }
      
      if (!selectedText || selectedText.isCollapsed) {
        setSelection({ text: "", position: null });
        return;
      }

      const text = selectedText.toString().trim();
      if (!text || text.length < 5) {
        setSelection({ text: "", position: null });
        return;
      }

      // Get selection range and its bounding rect
      const range = selectedText.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Add scroll offset to position for mobile
      const scrollY = window.scrollY || window.pageYOffset;
      
      setSelection({
        text,
        position: {
          x: rect.left + (rect.width / 2),
          y: rect.top + scrollY
        },
      });
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

  if (!selection.text || !selection.position) {
    return null;
  }

  const handleClick = async () => {
    // Store the text before clearing selection
    const text = selection.text;
    
    // Clear the selection
    window.getSelection()?.removeAllRanges();
    
    // Reset our selection state
    setSelection({ text: "", position: null });
    
    // Call handleSummarize with the selected text
    await handleSummarize(text);
  };

  return (
    <div
      className="fixed z-50 touch-none"
      style={{
        left: selection.position.x,
        top: selection.position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        size="sm"
        className="shadow-lg dark:shadow-gray-900/50 after:absolute after:top-full after:left-1/2 after:-translate-x-2 after:h-0 after:w-0 after:border-x-[6px] after:border-x-transparent after:border-b-[8px] after:border-b-black dark:after:border-b-gray-950"
        onClick={handleClick}
      >
        Summarize
      </Button>
    </div>
  );
} 