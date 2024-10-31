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
    const handleSelection = () => {
      const selectedText = window.getSelection();
      
      if (!selectedText || selectedText.isCollapsed) {
        setSelection({ text: "", position: null });
        return;
      }

      const text = selectedText.toString().trim();
      if (!text) {
        setSelection({ text: "", position: null });
        return;
      }

      const range = selectedText.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text,
        position: {
          x: rect.left + (rect.width / 2),
          y: rect.top - 10, // Position above the selection
        },
      });
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  if (!selection.text || !selection.position) {
    return null;
  }

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
        className="shadow-lg"
        onClick={() => onSummarize(selection.text)}
      >
        Summarize
      </Button>
    </div>
  );
} 