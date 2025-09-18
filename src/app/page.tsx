import HomePage from '@/components/HomePage'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "🌀",
  description: "Generate interactive sitemap visualisations from any website URL.",
  openGraph: {
    title: "🌀",
    description: "Generate interactive sitemap visualisations from any website URL.",
  },
}

export default function Home() {
  return <HomePage />
}