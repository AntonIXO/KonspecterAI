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
    const handleSelection = (event: MouseEvent) => {
      const selectedText = window.getSelection();
      
      if (!selectedText || selectedText.isCollapsed) {
        setSelection({ text: "", position: null });
        return;
      }

      const text = selectedText.toString().trim();
      if (!text || text.length < 5) {
        setSelection({ text: "", position: null });
        return;
      }

      setSelection({
        text,
        position: {
          x: event.clientX,
          y: event.clientY
        },
      });
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
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
      className="fixed z-50"
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