'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
            <span className="text-5xl">🌀</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Generate interactive sitemap visualisations from any website URL.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* URL Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Generate Sitemap
              </CardTitle>
              <p className="text-sm text-slate-600">
                Enter a website URL to crawl and generate an interactive sitemap visualisation
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urlInput">Website URL</Label>
                <Input
                  id="urlInput"
                  type="url"
                  placeholder="https://example.com"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>
              
              <Button
                onClick={createSession}
                disabled={isCreating || !sessionCode.trim()}
                className="w-full bg-[#1e40af] hover:bg-[#3b82f6] text-white"
              >
                {isCreating ? 'Generating...' : 'Generate Sitemap'}
              </Button>
            </CardContent>
          </Card>

          {/* Example URLs */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500 mb-3">Try:</p>
              <div className="flex flex-wrap gap-2">
                {['https://example.com', 'https://github.com', 'https://nextjs.org'].map((url) => (
                  <button
                    key={url}
                    onClick={() => setSessionCode(url)}
                    className="text-sm text-[#1e40af] hover:text-[#3b82f6] underline transition-colors"
                  >
                    {url}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-900">Advanced Options</span>
                <Button variant="outline" size="sm" className="text-slate-500 hover:text-slate-700">
                  Options
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-400">
            CrawlDebugColophon
          </p>
        </div>
      </div>
    </div>
  )
}
