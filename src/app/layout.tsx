import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import DemoModeBanner from "@/components/DemoModeBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golden Ratio - Design Estimation Tool",
  description: "Collaborative design task estimation tool for UX/UI teams. Create sessions, estimate tasks, and track design effort with real-time voting.",
  keywords: ["design estimation", "UX", "UI", "design tools", "agile", "estimation", "collaboration", "design teams"],
  authors: [{ name: "Golden Ratio Team" }],
  creator: "Golden Ratio",
  publisher: "Golden Ratio",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://golden-ratio-design.vercel.app",
    title: "Golden Ratio - Design Estimation Tool",
    description: "Collaborative design task estimation tool for UX/UI teams. Create sessions, estimate tasks, and track design effort with real-time voting.",
    siteName: "Golden Ratio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Golden Ratio - Design Estimation Tool",
    description: "Collaborative design task estimation tool for UX/UI teams. Create sessions, estimate tasks, and track design effort with real-time voting.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
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
        <DemoModeBanner />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
