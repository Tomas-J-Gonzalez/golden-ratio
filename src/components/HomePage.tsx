'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Plus, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { generateSessionCode } from '@/lib/constants'
import TopNavigation from './TopNavigation'
import { toast } from 'sonner'

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
      
      // Create session (mock client handles demo mode automatically)
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
      toast.success('Session created successfully!')
      router.push(`/session/${newSessionCode}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Failed to create session. Please try again.')
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
      toast.success('Joined session successfully!')
      router.push(`/session/${sessionCode}`)
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join session. Please check the session code.')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <>
      <TopNavigation />
      <div className="min-h-screen bg-slate-50 pt-16 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🌀</div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Collaborative estimation sessions for UX/UI design teams
            </p>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8">
          {/* Create Session */}
          <Card className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-1.5 bg-blue-100 rounded-full">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Create Session
              </CardTitle>
              <p className="text-slate-500 text-xs">
                Start a new estimation session
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div>
                <Input
                  placeholder="Your name"
                  value={moderatorName}
                  onChange={(e) => setModeratorName(e.target.value)}
                  className="w-full text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <Button
                onClick={createSession}
                disabled={isCreating || !moderatorName.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm"
              >
                {isCreating ? 'Creating...' : 'Create Session'}
              </Button>
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
            <CardHeader className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-1.5 bg-green-100 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Join Session
              </CardTitle>
              <p className="text-slate-500 text-xs">
                Enter session code to join
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div>
                <Input
                  placeholder="Session code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-sm font-mono w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <Input
                  placeholder="Your name"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full text-sm"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              <Button
                onClick={joinSession}
                disabled={isJoining || !sessionCode.trim() || !nickname.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                {isJoining ? 'Joining...' : 'Join Session'}
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </>
  )
}
