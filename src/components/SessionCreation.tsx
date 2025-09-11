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
      console.log('Creating session with code:', sessionCode)
      console.log('Supabase client:', supabase)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          code: sessionCode,
          moderator_id: crypto.randomUUID(),
          is_active: true
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Session creation error:', sessionError)
        console.error('Session error details:', JSON.stringify(sessionError, null, 2))
        throw sessionError
      }
      
      console.log('Session created successfully:', session)

      // Create moderator participant
      console.log('Creating participant for session:', session.id)
      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: moderatorName,
          is_moderator: true
        })

      if (participantError) {
        console.error('Participant creation error:', participantError)
        console.error('Participant error details:', JSON.stringify(participantError, null, 2))
        throw participantError
      }
      
      console.log('Participant created successfully')

      // Navigate to session
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error creating session:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        isDemoMode: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      })
      alert(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`)
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
