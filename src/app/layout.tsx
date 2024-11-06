import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { FileProvider } from "@/lib/FileContext";
import { SidebarProvider } from "@/components/ui/sidebar";

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
          <SidebarProvider >
            <FileProvider>
            <main className="flex-1">
              <div className="container mx-auto">
                {children}
              </div>
            </main>
          </FileProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}