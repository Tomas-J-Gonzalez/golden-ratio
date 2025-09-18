import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "🌀",
  description: "Generate interactive sitemap visualisations from any website URL.",
  keywords: ["sitemap", "crawler", "website analysis", "visualization", "web tools"],
  authors: [{ name: "Sitemap Generator" }],
  creator: "Sitemap Generator",
  publisher: "Sitemap Generator",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sitemap-gen.netlify.app",
    title: "🌀",
    description: "Generate interactive sitemap visualisations from any website URL.",
    siteName: "Sitemap Generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "🌀",
    description: "Generate interactive sitemap visualisations from any website URL.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
