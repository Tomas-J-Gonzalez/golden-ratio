'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase, Session, Task, Participant, Vote } from '@/lib/supabase'
import TaskManagement from './TaskManagement'
import VotingArea from './VotingArea'
import VoteReveal from './VoteReveal'
import TaskHistory from './TaskHistory'
import { Users, Copy, Check } from 'lucide-react'

interface SessionPageProps {
  sessionCode: string
}

export default function SessionPage({ sessionCode }: SessionPageProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadSessionData = useCallback(async () => {
    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - load from localStorage
        const demoSessionData = localStorage.getItem(`demo_session_${sessionCode}`)
        if (!demoSessionData) {
          throw new Error('Demo session not found')
        }
        
        const sessionData = JSON.parse(demoSessionData)
        setSession(sessionData)
        
        // Load demo participants
        const demoParticipants = []
        const participantId = localStorage.getItem(`participant_${sessionCode}`)
        if (participantId) {
          const demoParticipantData = localStorage.getItem(`demo_participant_${sessionCode}`)
          if (demoParticipantData) {
            demoParticipants.push(JSON.parse(demoParticipantData))
            setCurrentParticipant(JSON.parse(demoParticipantData))
          }
        }
        setParticipants(demoParticipants)
        
        // Load demo tasks
        const demoTasks = JSON.parse(localStorage.getItem(`demo_tasks_${sessionCode}`) || '[]')
        setTasks(demoTasks)
        
        // Find current voting task
        const votingTask = demoTasks.find((t: Task) => t.status === 'voting')
        setCurrentTask(votingTask || null)
        
        // Load votes for current task
        if (votingTask) {
          const demoVotes = JSON.parse(localStorage.getItem(`demo_votes_${votingTask.id}`) || '[]')
          setVotes(demoVotes)
        }
        
        setIsLoading(false)
        return
      }
      
      // Production mode - use Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', sessionCode)
        .eq('is_active', true)
        .single()

      if (sessionError || !sessionData) {
        throw new Error('Session not found')
      }

      setSession(sessionData)

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('joined_at', { ascending: true })

      if (participantsError) throw participantsError
      setParticipants(participantsData || [])

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Find current participant (simplified - in real app, use proper auth)
      const participantId = localStorage.getItem(`participant_${sessionCode}`)
      if (participantId) {
        const participant = participantsData?.find(p => p.id === participantId)
        setCurrentParticipant(participant || null)
      }

      // Find current voting task
      const votingTask = tasksData?.find(t => t.status === 'voting')
      setCurrentTask(votingTask || null)

      // Load votes for current task
      if (votingTask) {
        loadVotesForTask(votingTask.id)
      }

    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionCode])

  const loadVotesForTask = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('task_id', taskId)

      if (error) throw error
      setVotes(data || [])
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  }

  const setupRealtimeSubscriptions = useCallback(() => {
    // Check if we're in demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
    
    if (isDemoMode) {
      // Demo mode - no real-time subscriptions needed
      return () => {}
    }
    
    if (!session) return

    // Production mode - set up real-time subscriptions
    const tasksSubscription = supabase
      .channel('tasks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `session_id=eq.${session.id}` },
        () => {
          // Reload session data when tasks change
          window.location.reload()
        }
      )
      .subscribe()

    const votesSubscription = supabase
      .channel('votes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          if (currentTask) {
            loadVotesForTask(currentTask.id)
          }
        }
      )
      .subscribe()

    const participantsSubscription = supabase
      .channel('participants')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        () => {
          // Reload session data when participants change
          window.location.reload()
        }
      )
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
      votesSubscription.unsubscribe()
      participantsSubscription.unsubscribe()
    }
  }, [session, currentTask])

  useEffect(() => {
    loadSessionData()
    setupRealtimeSubscriptions()
  }, [sessionCode])

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${sessionCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleVoteSubmitted = () => {
    if (currentTask) {
      loadVotesForTask(currentTask.id)
    }
  }

  const handleTaskUpdate = () => {
    loadSessionData()
  }

  const handleEstimateFinalized = () => {
    loadSessionData()
    setCurrentTask(null)
    setVotes([])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">The session code &ldquo;{sessionCode}&rdquo; is invalid or has expired.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isModerator = currentParticipant?.is_moderator || false
  const allParticipantsVoted = currentTask && votes.length >= participants.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Design Estimation Session</h1>
              <p className="text-gray-600">Session Code: <span className="font-mono font-bold">{sessionCode}</span></p>
              {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder') && (
                <p className="text-sm text-amber-600 font-medium mt-1">
                  🚀 Demo Mode - Data stored locally
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={copySessionLink} variant="outline">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <Badge 
                    key={participant.id} 
                    variant={participant.is_moderator ? "default" : "secondary"}
                  >
                    {participant.nickname}
                    {participant.is_moderator && " (Moderator)"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Task Voting */}
        {currentTask && (
          <div className="mb-8">
            {allParticipantsVoted ? (
              <VoteReveal
                taskId={currentTask.id}
                taskTitle={currentTask.title}
                votes={votes}
                participants={participants}
                isModerator={isModerator}
                onEstimateFinalized={handleEstimateFinalized}
              />
            ) : currentParticipant ? (
              <VotingArea
                taskId={currentTask.id}
                taskTitle={currentTask.title}
                participantId={currentParticipant.id}
                onVoteSubmitted={handleVoteSubmitted}
              />
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>Waiting for participants to vote on: <strong>{currentTask.title}</strong></p>
                  <p className="text-sm text-gray-600 mt-2">
                    {votes.length} of {participants.length} participants have voted
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Task Management */}
        <div className="mb-8">
          <TaskManagement
            sessionId={session?.id || sessionCode}
            sessionCode={sessionCode}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            isModerator={isModerator}
          />
        </div>

        {/* Task History */}
        <TaskHistory tasks={tasks} sessionId={session?.id || sessionCode} />
      </div>
    </div>
  )
}
