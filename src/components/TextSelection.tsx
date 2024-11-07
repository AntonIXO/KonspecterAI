"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";

interface TextSelectionProps {
  onSummarize: (text: string) => void;
}

export function TextSelection({ onSummarize }: TextSelectionProps) {
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
      
      // Position the button at the top-center of the selection
      setSelection({
        text,
        position: {
          x: rect.left + (rect.width / 2),
          y: rect.top + scrollY // Add scroll offset
        },
      });
    };

    // Listen for both mouse and touch events
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

  const handleClick = () => {
    // Store the text before clearing selection
    const text = selection.text;
    
    // Clear the selection
    window.getSelection()?.removeAllRanges();
    
    // Reset our selection state
    setSelection({ text: "", position: null });
    
    // Call the summarize callback with the stored text
    onSummarize(text);
  };

  return (
    <div
      className="fixed z-50 touch-none" // Add touch-none to prevent touch interference
      style={{
        left: selection.position.x,
        top: selection.position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <Button
        size="sm"
        className="shadow-lg after:absolute after:top-full after:left-1/2 after:-translate-x-2 after:h-0 after:w-0 after:border-x-[6px] after:border-x-transparent after:border-b-[8px] after:border-b-black after:rotate-180"
        onClick={handleClick}
      >
        Summarize
      </Button>
    </div>
  );
} 