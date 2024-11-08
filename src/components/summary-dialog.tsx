import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import ReactMarkdown from 'react-markdown'

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
          <DialogDescription className="sr-only">
            Summary content
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  )
} 