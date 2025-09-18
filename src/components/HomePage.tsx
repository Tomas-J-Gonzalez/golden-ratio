'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateSessionCode } from '@/lib/constants'

export default function HomePage() {
  const [sessionCode, setSessionCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [moderatorName, setModeratorName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createSession = async () => {
    if (!moderatorName.trim()) return

    setIsCreating(true)
    try {
      const newSessionCode = generateSessionCode()
      
      // Check if we're in demo mode (placeholder Supabase URL)
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - simulate session creation
        console.log('Demo mode: Creating session with code:', newSessionCode)
        
        // Store demo session data
        const demoSession = {
          id: newSessionCode,
          code: newSessionCode,
          created_at: new Date().toISOString(),
          moderator_id: moderatorName,
          is_active: true
        }
        
        localStorage.setItem(`demo_session_${newSessionCode}`, JSON.stringify(demoSession))
        
        // Store demo participant data
        const demoParticipant = {
          id: `demo_${Date.now()}`,
          session_id: newSessionCode,
          nickname: moderatorName,
          is_moderator: true,
          joined_at: new Date().toISOString()
        }
        
        localStorage.setItem(`demo_participant_${newSessionCode}`, JSON.stringify(demoParticipant))
        localStorage.setItem(`participant_${newSessionCode}`, demoParticipant.id)
        
        // Navigate to session
        router.push(`/session/${newSessionCode}`)
        return
      }
      
      // Production mode - use Supabase
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          code: newSessionCode,
          moderator_id: moderatorName
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
      localStorage.setItem(`participant_${newSessionCode}`, participant.id)

      // Navigate to session
      router.push(`/session/${newSessionCode}`)
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const joinSession = async () => {
    if (!sessionCode.trim() || !nickname.trim()) return

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

      // Navigate directly to session
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error joining session:', error)
      alert('Failed to join session. Please check the session code.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-6">🌀</div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Design Estimation Tool
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Collaborative estimation sessions for UX/UI design teams
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Create Session */}
          <Card className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Create New Session
                </CardTitle>
              </div>
              <p className="text-slate-600 text-sm">
                Start a new estimation session as the moderator
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moderatorName" className="text-sm font-medium text-slate-700">Your Name</Label>
                <Input
                  id="moderatorName"
                  placeholder="Enter your name"
                  value={moderatorName}
                  onChange={(e) => setModeratorName(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <Button
                onClick={createSession}
                disabled={isCreating || !moderatorName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? 'Creating...' : 'Create Session'}
              </Button>
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Join Existing Session
                </CardTitle>
              </div>
              <p className="text-slate-600 text-sm">
                Enter a session code to join an ongoing estimation
              </p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionCode" className="text-sm font-medium text-slate-700">Session Code</Label>
                <Input
                  id="sessionCode"
                  placeholder="Enter 6-character code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg font-mono w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-sm font-medium text-slate-700">Your Name</Label>
                <Input
                  id="nickname"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <Button
                onClick={joinSession}
                disabled={isJoining || !sessionCode.trim() || !nickname.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
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
