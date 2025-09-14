import HomePage from '@/components/HomePage'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Golden Ratio - Design Estimation Tool",
  description: "Create collaborative design estimation sessions for your UX/UI team. Estimate tasks, track effort, and improve design planning with real-time voting.",
  openGraph: {
    title: "Golden Ratio - Design Estimation Tool",
    description: "Create collaborative design estimation sessions for your UX/UI team. Estimate tasks, track effort, and improve design planning with real-time voting.",
  },
}

export default function Home() {
  return <HomePage />
}