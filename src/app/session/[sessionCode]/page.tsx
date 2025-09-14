import SessionPage from '@/components/SessionPage'
import type { Metadata } from "next"

interface SessionPageProps {
  params: Promise<{
    sessionCode: string
  }>
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { sessionCode } = await params
  
  return {
    title: `Design Estimation Session ${sessionCode} - Golden Ratio`,
    description: `Join the design estimation session ${sessionCode}. Collaborate with your team to estimate design tasks and track effort in real-time.`,
    openGraph: {
      title: `Design Estimation Session ${sessionCode} - Golden Ratio`,
      description: `Join the design estimation session ${sessionCode}. Collaborate with your team to estimate design tasks and track effort in real-time.`,
    },
  }
}

export default async function SessionPageRoute({ params }: SessionPageProps) {
  const { sessionCode } = await params
  return <SessionPage sessionCode={sessionCode} />
}
