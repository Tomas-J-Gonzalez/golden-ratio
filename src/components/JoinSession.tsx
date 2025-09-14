'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

interface JoinSessionProps {
  sessionCode: string
}

export default function JoinSession({ sessionCode }: JoinSessionProps) {
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get nickname from URL parameters
    const nicknameParam = searchParams.get('nickname')
    if (nicknameParam) {
      setNickname(decodeURIComponent(nicknameParam))
    }
  }, [searchParams])

  const joinSession = async () => {
    if (!nickname.trim()) return

    setIsJoining(true)
    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - check if session exists in localStorage
        const demoSessionData = localStorage.getItem(`demo_session_${sessionCode}`)
        if (!demoSessionData) {
          throw new Error('Session not found')
        }
        
        const demoSession = JSON.parse(demoSessionData)
        
        // Create new participant
        const newParticipant = {
          id: crypto.randomUUID(),
          session_id: demoSession.id,
          nickname: nickname,
          is_moderator: false,
          joined_at: new Date().toISOString()
        }
        
        // Add to existing participants
        const existingParticipants = JSON.parse(localStorage.getItem(`demo_participants_${sessionCode}`) || '[]')
        const updatedParticipants = [...existingParticipants, newParticipant]
        localStorage.setItem(`demo_participants_${sessionCode}`, JSON.stringify(updatedParticipants))
        
        // Store participant ID for this session
        localStorage.setItem(`participant_${sessionCode}`, newParticipant.id)
        
        // Navigate to session
        router.push(`/session/${sessionCode}`)
        return
      }
      
      // Production mode - use Supabase
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
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: nickname,
          is_moderator: false
        })
        .select()
        .single()

      if (participantError) throw participantError

      // Store participant ID for this session
      localStorage.setItem(`participant_${sessionCode}`, participant.id)

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
