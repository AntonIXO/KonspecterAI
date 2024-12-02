import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FileProvider } from "@/lib/FileContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { InstallPWA } from '@/components/InstallPWA';
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { TextProvider } from '@/lib/TextContext';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const summarizerToken = process.env.SUMMARIZER_TOKEN;
const translatorToken = process.env.TRANSLATOR_TOKEN;
const languageDetectionToken = process.env.LANGUAGE_DETECTION_TOKEN;
const genaiToken = process.env.GENAI_TOKEN;

export const metadata: Metadata = {
  title: "KonspecterAI",
  description: "Read smarter, not harder",
};

export const viewport: Viewport = {
  themeColor: [
      { media: "(prefers-color-scheme: dark)", color: "#000000" },
      { media: "(prefers-color-scheme: light)", color: "#ffffff" }
     ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="KonspecterAI" />
        <meta httpEquiv="origin-trial" content={summarizerToken}></meta>
        <meta httpEquiv="origin-trial" content={translatorToken}></meta>
        <meta httpEquiv="origin-trial" content={languageDetectionToken}></meta>
        <meta httpEquiv="origin-trial" content={genaiToken}></meta>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TextProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <FileProvider>
                <main className="flex-1">
                  <div className="container mx-auto">
                    {children}
                  </div>
                </main>
                <div className="fixed bottom-4 right-4 flex flex-col gap-2 sm:flex-row">
                  <ThemeToggle />
                  <InstallPWA />
                </div>
                <Toaster />
              </FileProvider>
            </SidebarProvider>
          </ThemeProvider>
        </TextProvider>
      </body>
    </html>
  );
}