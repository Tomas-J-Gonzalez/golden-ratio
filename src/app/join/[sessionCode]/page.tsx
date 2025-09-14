import JoinSession from '@/components/JoinSession'
import type { Metadata } from "next"

interface JoinPageProps {
  params: Promise<{
    sessionCode: string
  }>
}

export async function generateMetadata({ params }: JoinPageProps): Promise<Metadata> {
  const { sessionCode } = await params
  
  return {
    title: `Join Design Estimation Session ${sessionCode} - Golden Ratio`,
    description: `Join the design estimation session ${sessionCode}. Enter your name to participate in collaborative design task estimation with your team.`,
    openGraph: {
      title: `Join Design Estimation Session ${sessionCode} - Golden Ratio`,
      description: `Join the design estimation session ${sessionCode}. Enter your name to participate in collaborative design task estimation with your team.`,
    },
  }
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { sessionCode } = await params
  return <JoinSession sessionCode={sessionCode} />
}
