'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import SessionCreation from './SessionCreation'

export default function HomePage() {
  const [sessionCode, setSessionCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const joinSession = async () => {
    if (!sessionCode.trim() || !nickname.trim()) return

    setIsJoining(true)
    try {
      // Navigate to join page
      router.push(`/join/${sessionCode}?nickname=${encodeURIComponent(nickname)}`)
    } catch (error) {
      console.error('Error joining session:', error)
      alert('Failed to join session. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Design Estimation Tool
          </h1>
          <p className="text-lg text-gray-600">
            Collaborative estimation sessions for UX/UI design teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Session */}
          <Card className="w-full h-96 flex flex-col">
            <CardHeader className="text-center flex-shrink-0">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Create New Session
              </CardTitle>
              <CardDescription>
                Start a new estimation session as the moderator
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <SessionCreation />
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="w-full h-96 flex flex-col">
            <CardHeader className="text-center flex-shrink-0">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Join Existing Session
              </CardTitle>
              <CardDescription>
                Enter a session code to join an ongoing estimation
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-4">
              <div>
                <Label htmlFor="sessionCode">Session Code</Label>
                <Input
                  id="sessionCode"
                  placeholder="Enter 6-character code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono"
                />
              </div>
              <div>
                <Label htmlFor="nickname">Your Name</Label>
                <Input
                  id="nickname"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <Button
                onClick={joinSession}
                disabled={isJoining || !sessionCode.trim() || !nickname.trim()}
                className="w-full"
              >
                {isJoining ? 'Joining...' : 'Join Session'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
