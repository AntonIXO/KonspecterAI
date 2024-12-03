"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Brain } from "lucide-react"

interface QuizPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartQuiz: () => void
}

export function QuizPrompt({ open, onOpenChange, onStartQuiz }: QuizPromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Time for a Quiz!
          </DialogTitle>
          <DialogDescription>
            You&apos;ve read 10 more pages! Would you like to test your knowledge with a quick quiz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={onStartQuiz}>
            Start Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 