"use client";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";
import { isChromeAIAvailable } from "@/lib/ai/chrome-ai";

export function ChromeAINotice() {
  const isCompatible = isChromeAIAvailable();

  if (isCompatible) return null;

  return (
    <Alert variant="default" className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Using Cloud AI</AlertTitle>
      <AlertDescription>
        For local AI processing, use Chrome version 127 or higher. 
        Current responses are processed in the cloud.
      </AlertDescription>
    </Alert>
  );
} 