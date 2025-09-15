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
import { Users, Copy, Check, LogOut } from 'lucide-react'

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
      // Load session from Supabase
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

      // Find current participant
      const participantId = localStorage.getItem(`participant_${sessionCode}`)
      console.log('Looking for participant:', { participantId, sessionCode, participantsData })
      if (participantId) {
        const participant = participantsData?.find(p => p.id === participantId)
        console.log('Found participant:', participant)
        setCurrentParticipant(participant || null)
      } else {
        console.log('No participant ID found in localStorage for session:', sessionCode)
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
    if (!session) return

    console.log('Setting up real-time subscriptions for session:', session.id)

    // Set up real-time subscriptions
    const tasksSubscription = supabase
      .channel(`tasks-${session.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          console.log('Tasks changed:', payload)
          // Reload tasks when they change
          try {
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('session_id', session.id)
              .order('created_at', { ascending: false })

            if (tasksError) throw tasksError
            setTasks(tasksData || [])

            // Update current task if it's voting
            const votingTask = tasksData?.find(t => t.status === 'voting')
            setCurrentTask(votingTask || null)

            // Load votes for current task
            if (votingTask) {
              loadVotesForTask(votingTask.id)
            }
          } catch (error) {
            console.error('Error reloading tasks:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('Tasks subscription status:', status)
      })

    const votesSubscription = supabase
      .channel(`votes-${session.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'votes' },
        async (payload) => {
          console.log('Votes changed:', payload)
          // Reload votes for all tasks in this session
          try {
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('session_id', session.id)
              .eq('status', 'voting')
              .single()

            if (!tasksError && tasksData) {
              loadVotesForTask(tasksData.id)
            }
          } catch (error) {
            console.error('Error reloading votes:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('Votes subscription status:', status)
      })

    const participantsSubscription = supabase
      .channel(`participants-${session.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        async (payload) => {
          console.log('Participants changed:', payload)
          // Reload participants when they change
          try {
            const { data: participantsData, error: participantsError } = await supabase
              .from('participants')
              .select('*')
              .eq('session_id', session.id)
              .order('joined_at', { ascending: true })

            if (participantsError) throw participantsError
            setParticipants(participantsData || [])
          } catch (error) {
            console.error('Error reloading participants:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('Participants subscription status:', status)
      })

    return () => {
      console.log('Cleaning up real-time subscriptions')
      tasksSubscription.unsubscribe()
      votesSubscription.unsubscribe()
      participantsSubscription.unsubscribe()
    }
  }, [session])

  useEffect(() => {
    loadSessionData()
  }, [sessionCode, loadSessionData])

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions()
    return cleanup
  }, [setupRealtimeSubscriptions])

  const copySessionLink = () => {
    const link = `${window.location.origin}/join/${sessionCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leaveSession = async () => {
    if (!currentParticipant) return

    const isModerator = currentParticipant.is_moderator
    const confirmMessage = isModerator 
      ? 'Are you sure you want to leave this session? As the moderator, this will end the session for all participants.'
      : 'Are you sure you want to leave this session?'

    if (!confirm(confirmMessage)) return

    try {
      if (isModerator) {
        // If moderator leaves, deactivate the session
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ is_active: false })
          .eq('id', session?.id)

        if (sessionError) throw sessionError
      }

      // Remove participant from session
      const { error: participantError } = await supabase
        .from('participants')
        .delete()
        .eq('id', currentParticipant.id)

      if (participantError) throw participantError

      // Clear participant data from localStorage
      localStorage.removeItem(`participant_${sessionCode}`)

      // Redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error leaving session:', error)
      alert('Failed to leave session. Please try again.')
    }
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
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Estimation Session</h1>
              <p className="text-gray-600">Session Code: <span className="font-mono font-bold">{sessionCode}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={copySessionLink} variant="outline" size="sm">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              {currentParticipant && (
                <Button onClick={leaveSession} variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Session
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Task Management & Current Voting */}
          <div className="space-y-6">
            {/* Task Management - Moved to top */}
            <TaskManagement
              sessionId={session?.id || sessionCode}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              isModerator={isModerator}
              hasActiveVoting={!!currentTask}
            />

            {/* Current Task Voting */}
            {currentTask && (
              <div>
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
          </div>

          {/* Right Column - Participants & Task History */}
          <div className="space-y-4">
            {/* Participants */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant) => {
                    const hasVoted = currentTask ? votes.some(vote => vote.participant_id === participant.id) : false
                    return (
                      <Badge 
                        key={participant.id} 
                        variant={hasVoted ? "default" : "outline"}
                        className="text-xs"
                      >
                        {participant.nickname}
                        {participant.is_moderator && " (Mod)"}
                        {hasVoted && " ✓"}
                      </Badge>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Task History - Only show if there are completed tasks */}
            {tasks.some(task => task.status === 'completed') && (
              <TaskHistory tasks={tasks} sessionId={session?.id || sessionCode} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
