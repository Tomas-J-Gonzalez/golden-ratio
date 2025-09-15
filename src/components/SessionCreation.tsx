'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { generateSessionCode } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function SessionCreation() {
  const [moderatorName, setModeratorName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createSession = async () => {
    if (!moderatorName.trim()) return

    setIsCreating(true)
    try {
      const sessionCode = generateSessionCode()
      
      // Create session in Supabase
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          code: sessionCode,
          moderator_id: crypto.randomUUID(),
          is_active: true
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create moderator participant
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: moderatorName,
          is_moderator: true
        })
        .select()
        .single()

      if (participantError) throw participantError

      // Store participant ID for this session
      localStorage.setItem(`participant_${sessionCode}`, participant.id)

      // Navigate to session
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Estimation Session
          </CardTitle>
          <CardDescription>
            Start a new design task estimation session for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moderator-name">Your Name</Label>
            <Input
              id="moderator-name"
              placeholder="Enter your name"
              value={moderatorName}
              onChange={(e) => setModeratorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>
          <Button 
            onClick={createSession} 
            disabled={!moderatorName.trim() || isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
