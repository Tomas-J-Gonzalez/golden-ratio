import SessionPage from '@/components/SessionPage'

interface SessionPageProps {
  params: Promise<{
    sessionCode: string
  }>
}

export default async function SessionPageRoute({ params }: SessionPageProps) {
  const { sessionCode } = await params
  return <SessionPage sessionCode={sessionCode} />
}
