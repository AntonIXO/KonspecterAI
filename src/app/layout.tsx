import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FileProvider } from "@/lib/FileContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CompressionProvider } from "@/lib/CompressionContext";

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

export const metadata: Metadata = {
  title: "KonsperterAI",
  description: "Read smarter, not harder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CompressionProvider>
          <SidebarProvider>
            <FileProvider>
              {children}
            </FileProvider>
          </SidebarProvider>
        </CompressionProvider>
      </body>
    </html>
  );
}