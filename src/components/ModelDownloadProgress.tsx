import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"
import { Download } from "lucide-react"

interface ModelDownloadProgressProps {
  loaded: number
  total: number
}

export function ModelDownloadProgress({ loaded, total }: ModelDownloadProgressProps) {
  const progress = (loaded / total) * 100

  return (
    <Card className="w-full bg-muted/50 border-none shadow-none">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Download className="h-4 w-4" />
          <span className="font-medium">Downloading AI Model</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground/80">
          <span>{formatBytes(loaded)} / {formatBytes(total)}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </CardContent>
    </Card>
  )
} 