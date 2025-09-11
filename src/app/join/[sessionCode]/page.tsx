import JoinSession from '@/components/JoinSession'

interface JoinPageProps {
  params: Promise<{
    sessionCode: string
  }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { sessionCode } = await params
  return <JoinSession sessionCode={sessionCode} />
}
