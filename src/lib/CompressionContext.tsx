"use client"

import { createContext, useContext, useState } from "react"

type CompressionMode = "1:1" | "1:2" | "1:3"

interface CompressionContextType {
  mode: CompressionMode
  setMode: (mode: CompressionMode) => void
}

const CompressionContext = createContext<CompressionContextType | undefined>(undefined)

export function CompressionProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<CompressionMode>("1:1")

  return (
    <CompressionContext.Provider value={{ mode, setMode }}>
      {children}
    </CompressionContext.Provider>
  )
}

export function useCompression() {
  const context = useContext(CompressionContext)
  if (!context) {
    throw new Error("useCompression must be used within a CompressionProvider")
  }
  return context
} 