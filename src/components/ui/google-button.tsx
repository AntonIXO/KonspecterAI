import { Button } from "@/components/ui/button"
import Image from "next/image"

export function GoogleButton({ 
  onClick,
  disabled 
}: { 
  onClick: () => Promise<void>
  disabled?: boolean 
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2"
    >
      <Image
        src="/google.svg"
        alt="Google"
        width={20}
        height={20}
        className="w-5 h-5"
      />
      Continue with Google
    </Button>
  )
} 