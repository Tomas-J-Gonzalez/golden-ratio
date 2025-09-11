'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface JoinSessionProps {
  sessionCode: string
}

export default function JoinSession({ sessionCode }: JoinSessionProps) {
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const joinSession = async () => {
    if (!nickname.trim()) return

    setIsJoining(true)
    try {
      // Check if session exists
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('code', sessionCode)
        .eq('is_active', true)
        .single()

      if (sessionError || !session) {
        throw new Error('Session not found or inactive')
      }

      // Add participant to session
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: nickname,
          is_moderator: false
        })

      if (participantError) throw participantError

      // Navigate to session
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error joining session:', error)
      alert('Failed to join session. Please check the session code.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join Session
          </CardTitle>
          <CardDescription>
            Enter your name to join session: <span className="font-mono font-bold">{sessionCode}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Your Name</Label>
            <Input
              id="nickname"
              placeholder="Enter your name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinSession()}
            />
          </div>
          <Button 
            onClick={joinSession} 
            disabled={!nickname.trim() || isJoining}
            className="w-full"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
