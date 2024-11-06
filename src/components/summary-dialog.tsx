import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface SummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  content: string
}

export function SummaryDialog({ open, onOpenChange, title, content }: SummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="pr-8">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 