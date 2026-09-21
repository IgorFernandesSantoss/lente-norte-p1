import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ensureStorage } from "@/lib/storage";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lente Norte",
  description: "Locadora web com Azure Blob e Table Storage",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  try {
    await ensureStorage();
  } catch {
    // Storage may be offline before docker compose starts; routes retry later.
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
