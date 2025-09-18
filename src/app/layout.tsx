import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
