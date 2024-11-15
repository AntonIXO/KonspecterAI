import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { FileText, Sparkles, Brain } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export default function Landing() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 p-4">
      {/* Hero Section */}
      <div className="relative text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">
            KonspecterAI
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Read smarter, not harder with AI-powered book analysis
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
        {[
          {
            icon: FileText,
            title: "Multi-Format Support",
            description: "Read PDFs and EPUBs with ease"
          },
          {
            icon: Sparkles,
            title: "Smart Summaries",
            description: "Get AI-powered insights and summaries"
          },
          {
            icon: Brain,
            title: "Context Aware",
            description: "Ask questions about any part of the text"
          }
        ].map((feature, i) => (
          <div 
            key={feature.title}
            className="relative group p-6 rounded-xl border bg-card text-card-foreground"
          >
            <BorderBeam delay={i * 2} />
            <feature.icon className="w-10 h-10 mb-4 text-primary" />
            <h3 className="font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Link href="/login">
        <RainbowButton
          className="hover:scale-105 transition-transform text-lg px-8 py-6"
        >
          Get started
        </RainbowButton>
      </Link>
    </div>
  );
} 