import SessionCreation from '@/components/SessionCreation'
import EnvTest from '@/components/EnvTest'

export default function Home() {
  return (
    <div>
      <div className="p-4">
        <EnvTest />
      </div>
      <SessionCreation />
    </div>
  )
}