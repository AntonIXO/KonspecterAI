"use client"
import { useRouter } from "next/navigation";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function Landing() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <RainbowButton
        className="hover:scale-105 transition-transform"
        onClick={() => router.push('/login')}
      >
        Get started
      </RainbowButton>
    </div>
  );
} 