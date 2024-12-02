import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { formatBytes } from "@/lib/utils"
import { Download } from "lucide-react"

export function ModelDownloadProgress() {
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    const handler = (e: CustomEvent<{ loaded: number, total: number }>) => {
      console.log('Download progress', e.detail);
      setProgress(e.detail);
    };

    window.addEventListener('downloadprogress', handler as EventListener);

    // Reset progress when unmounting
    return () => {
      window.removeEventListener('downloadprogress', handler as EventListener);
      setProgress({ loaded: 0, total: 0 });
    };
  }, []);

  // Don't render anything if total is 0
  if (progress.total === 0) return null;

  const progressPercentage = (progress.loaded / progress.total) * 100;

  return (
    <Card className="w-full bg-muted/50 border-none shadow-none">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Download className="h-4 w-4" />
          <span className="font-medium">Downloading AI Model</span>
        </div>
        <Progress value={progressPercentage} className="h-1.5" />
        <div className="flex justify-between text-xs text-muted-foreground/80">
          <span>{formatBytes(progress.loaded)} / {formatBytes(progress.total)}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </CardContent>
    </Card>
  );
} 