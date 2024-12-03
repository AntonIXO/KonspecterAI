import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Book } from "@/lib/storage"

interface RenameDialogProps {
  book: Book | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onRename: (newName: string) => Promise<void>
}

export function RenameDialog({ book, isOpen, onOpenChange, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState(book?.name || '')
  const [isRenaming, setIsRenaming] = useState(false)

  const handleRename = async () => {
    if (!newName.trim() || !book) return
    
    setIsRenaming(true)
    try {
      await onRename(newName.trim())
      onOpenChange(false)
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Book</DialogTitle>
          <DialogDescription>
            Enter a new name for the book. The file extension cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new name..."
            disabled={isRenaming}
          />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleRename}
            disabled={!newName.trim() || isRenaming}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 