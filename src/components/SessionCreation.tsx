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
      
      // Check if we're in demo mode (placeholder Supabase URL)
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - simulate session creation
        console.log('Demo mode: Creating session with code:', sessionCode)
        
        // Store demo session data in localStorage
        const demoSession = {
          id: crypto.randomUUID(),
          code: sessionCode,
          moderator_id: crypto.randomUUID(),
          is_active: true,
          created_at: new Date().toISOString()
        }
        
        const demoParticipant = {
          id: crypto.randomUUID(),
          session_id: demoSession.id,
          nickname: moderatorName,
          is_moderator: true,
          joined_at: new Date().toISOString()
        }
        
        localStorage.setItem(`demo_session_${sessionCode}`, JSON.stringify(demoSession))
        localStorage.setItem(`demo_participant_${sessionCode}`, JSON.stringify(demoParticipant))
        localStorage.setItem(`participant_${sessionCode}`, demoParticipant.id)
        
        // Navigate to session
        router.push(`/session/${sessionCode}`)
        return
      }
      
      // Production mode - use Supabase
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
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: moderatorName,
          is_moderator: true
        })

      if (participantError) throw participantError

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
            {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && (
              <div className="mt-2 text-sm text-amber-600 font-medium">
                🚀 Demo Mode - Using local storage
              </div>
            )}
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
