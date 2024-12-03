"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  min?: number
  size?: number
  gaugePrimaryColor?: string
  gaugeSecondaryColor?: string
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ 
    value, 
    max = 100, 
    min = 0, 
    className,
    size = 32,
    gaugePrimaryColor = "rgb(37, 99, 235)",
    gaugeSecondaryColor = "rgb(229, 231, 235)",
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value - min) / (max - min) * 100, 0), 100)
    const circumference = size * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        style={{ width: size, height: size }}
        {...props}
      >
        {/* Background circle */}
        <svg className="w-full h-full rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            stroke={gaugeSecondaryColor}
            strokeWidth="2"
            fill="none"
          />
          {/* Animated progress circle */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            stroke={gaugePrimaryColor}
            strokeWidth="2"
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
          {Math.round(percentage)}%
        </div>
      </div>
    )
  }
)

CircularProgress.displayName = "CircularProgress"

export { CircularProgress } 