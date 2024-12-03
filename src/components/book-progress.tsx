"use client"

import { memo } from "react"
import AnimatedCircularProgressBar from "../components/ui/animated-circular-progress-bar"
import { cn } from "@/lib/utils"

interface BookProgressProps {
  currentPage: number
  totalPages: number | null
  className?: string
}

export const BookProgress = memo(function BookProgress({ 
  currentPage, 
  totalPages, 
  className 
}: BookProgressProps) {
  if (!totalPages) return null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <AnimatedCircularProgressBar
        value={currentPage}
        min={0}
        max={totalPages}
        gaugePrimaryColor="#5760f1"
        gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
      />
    </div>
  )
}) 