'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { supabase, Session, Task, Participant, Vote } from '@/lib/supabase'
import TaskManagement from './TaskManagement'
import VotingArea from './VotingArea'
import VotingResults from './VotingResults'
import VotesHidden from './VotesHidden'
import TaskHistory from './TaskHistory'
import { EmojiPicker } from './EmojiPicker'
import { ConfirmDialog } from './ui/confirm-dialog'
import { VotingMusicToggle } from './VotingMusicToggle'
import { VotingTimer } from './VotingTimer'
import { Users, Copy, Check, LogOut } from 'lucide-react'
import { toast } from 'sonner'

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
  const [codeCopied, setCodeCopied] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [selectedParticipantForEmoji, setSelectedParticipantForEmoji] = useState<Participant | null>(null)
  const [nickname, setNickname] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [votingDuration, setVotingDuration] = useState<number>(0)

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
        const participant = participantsData?.find((p: Participant) => p.id === participantId)
        console.log('Found participant:', participant)
        setCurrentParticipant(participant || null)
      } else {
        console.log('No participant ID found in localStorage for session:', sessionCode)
      }

      // Find current voting task (prioritize 'voting' over 'voting_completed')
      const votingTask = tasksData?.find((t: Task) => t.status === 'voting') 
        || tasksData?.find((t: Task) => t.status === 'voting_completed')
      console.log('[Initial Load] Setting currentTask to:', votingTask ? `${votingTask.title} (${votingTask.status})` : 'null')
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

  const joinSession = async () => {
    if (!nickname.trim() || !session) return

    setIsJoining(true)
    try {
      // Add participant to session
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .insert({
          session_id: session.id,
          nickname: nickname.trim(),
          is_moderator: false
        })
        .select()
        .single()

      if (participantError) throw participantError

      // Store participant ID for this session
      localStorage.setItem(`participant_${sessionCode}`, participant.id)
      
      // Update current participant
      setCurrentParticipant(participant)
      
      // Reload session data to get updated participants list
      await loadSessionData()
      
      toast.success('Joined session successfully!')
    } catch (error) {
      console.error('Error joining session:', error)
      toast.error('Failed to join session. Please try again.')
    } finally {
      setIsJoining(false)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
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

            // Update current task if it's voting (prioritize 'voting' over 'voting_completed')
            const votingTask = tasksData?.find((t: Task) => t.status === 'voting')
              || tasksData?.find((t: Task) => t.status === 'voting_completed')
            console.log('[Real-time Update] Setting currentTask to:', votingTask ? `${votingTask.title} (${votingTask.status})` : 'null')
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
      .subscribe((status: string) => {
        console.log('Tasks subscription status:', status)
      })

    const votesSubscription = supabase
      .channel(`votes-${session.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'votes' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
          console.log('Votes changed:', payload)
          // Reload votes for all tasks in this session
          try {
            // Find any active voting task (including voting_completed)
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('session_id', session.id)
              .in('status', ['voting', 'voting_completed'])

            if (!tasksError && tasksData && tasksData.length > 0) {
              // Load votes for the first matching task (there should only be one active voting task)
              loadVotesForTask(tasksData[0].id)
            }
          } catch (error) {
            console.error('Error reloading votes:', error)
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Votes subscription status:', status)
      })

    const participantsSubscription = supabase
      .channel(`participants-${session.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${session.id}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (payload: any) => {
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
            
            // Handle DELETE events - if a participant was deleted, show a toast
            if (payload.eventType === 'DELETE' && payload.old) {
              const deletedNickname = payload.old.nickname
              if (deletedNickname) {
                toast.info(`${deletedNickname} left the session`)
              }
            }
            
            // Also update currentParticipant if it changed
            const participantId = localStorage.getItem(`participant_${sessionCode}`)
            if (participantId) {
              const participant = participantsData?.find((p: Participant) => p.id === participantId)
              if (participant) {
                setCurrentParticipant(participant)
              }
            }
          } catch (error) {
            console.error('Error reloading participants:', error)
          }
        }
      )
      .subscribe((status: string) => {
        console.log('Participants subscription status:', status)
      })

    return () => {
      console.log('Cleaning up real-time subscriptions')
      tasksSubscription.unsubscribe()
      votesSubscription.unsubscribe()
      participantsSubscription.unsubscribe()
    }
  }, [session, sessionCode])

  useEffect(() => {
    loadSessionData()
  }, [sessionCode, loadSessionData])

  useEffect(() => {
    const cleanup = setupRealtimeSubscriptions()
    return cleanup
  }, [setupRealtimeSubscriptions])

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode)
    setCodeCopied(true)
    toast.success('Session code copied!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const confirmLeaveSession = async () => {
    if (!currentParticipant) return

    try {
      const isModerator = currentParticipant.is_moderator
      
      if (isModerator) {
        // If moderator ends session, deactivate it but don't delete participant yet
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ is_active: false })
          .eq('id', session?.id)

        if (sessionError) throw sessionError

        setLeaveDialogOpen(false)
        toast.success('Session ended')
        
        // Redirect moderator to review page
        setTimeout(() => {
          window.location.href = `/session-review/${sessionCode}`
        }, 500)
      } else {
        // Regular participant leaves
        const { error: participantError } = await supabase
          .from('participants')
          .delete()
          .eq('id', currentParticipant.id)

        if (participantError) throw participantError

        // Clear participant data from localStorage
        localStorage.removeItem(`participant_${sessionCode}`)

        setLeaveDialogOpen(false)
        toast.success('Left session successfully')
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      }
    } catch (error) {
      console.error('Error leaving session:', error)
      setLeaveDialogOpen(false)
      toast.error(currentParticipant.is_moderator ? 'Failed to end session. Please try again.' : 'Failed to leave session. Please try again.')
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

  const revealVotes = async () => {
    if (!currentTask || !isModerator) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ votes_revealed: true })
        .eq('id', currentTask.id)

      if (error) {
        console.error('Error details:', error)
        // If column doesn't exist yet, just show results anyway
        if (error.message?.includes('column') || error.code === '42703') {
          toast.info('Showing results (database migration needed)')
          // Force update by reloading
          loadSessionData()
          return
        }
        throw error
      }
      
      toast.success('Votes revealed!')
      loadSessionData()
    } catch (error) {
      console.error('Error revealing votes:', error)
      toast.error('Failed to reveal votes. Please try again.')
    }
  }

  const updateParticipantEmoji = async (emoji: string) => {
    if (!selectedParticipantForEmoji) return

    try {
      const { error } = await supabase
        .from('participants')
        .update({ avatar_emoji: emoji })
        .eq('id', selectedParticipantForEmoji.id)

      if (error) {
        // If column doesn't exist, show helpful message
        if (error.message?.includes('column') || error.code === '42703') {
          toast.error('Avatar feature requires database migration')
          return
        }
        throw error
      }
      
      toast.success('Avatar updated!')
      loadSessionData()
    } catch (error) {
      console.error('Error updating avatar:', error)
      toast.error('Failed to update avatar. Please try again.')
    }
  }

  const handleParticipantClick = (participant: Participant) => {
    // Only allow users to change their own avatar
    if (currentParticipant?.id === participant.id) {
      setSelectedParticipantForEmoji(participant)
      setEmojiPickerOpen(true)
    }
  }

  const updateTaskStatusToVotingCompleted = useCallback(async (taskId: string, durationSeconds?: number) => {
    try {
      const updateData: { status: string; voting_duration_seconds?: number } = {
        status: 'voting_completed'
      }
      
      // Save the voting duration if provided
      if (durationSeconds !== undefined && durationSeconds > 0) {
        updateData.voting_duration_seconds = durationSeconds
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error
      
      // Reset duration state
      setVotingDuration(0)
      loadSessionData()
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }, [loadSessionData])

  // Calculate derived values
  const isModerator = currentParticipant?.is_moderator || false
  const allParticipantsVoted = currentTask && votes.length >= participants.length
  const isVotingInProgress = currentTask?.status === 'voting'
  
  // Debug logging for music toggle visibility
  console.log('Music toggle debug:', {
    currentTaskStatus: currentTask?.status,
    currentTaskTitle: currentTask?.title,
    isVotingInProgress,
    allTasks: tasks.map(t => ({ title: t.title, status: t.status }))
  })

  // Update task status to voting_completed when all participants have voted
  useEffect(() => {
    if (currentTask && allParticipantsVoted && currentTask.status === 'voting') {
      updateTaskStatusToVotingCompleted(currentTask.id, votingDuration)
    }
  }, [currentTask, allParticipantsVoted, updateTaskStatusToVotingCompleted, votingDuration])

  // Reset voting duration when a new voting task starts
  useEffect(() => {
    if (currentTask?.status === 'voting') {
      setVotingDuration(0)
    }
  }, [currentTask?.id, currentTask?.status])

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

  // Show join form if session exists but user hasn't joined yet
  if (!currentParticipant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Join Session
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Session Code: <span className="font-mono font-bold text-gray-900">{sessionCode}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your name"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinSession()}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
              />
            </div>
            <Button 
              onClick={joinSession} 
              disabled={!nickname.trim() || isJoining}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isJoining ? 'Joining...' : 'Join Session'}
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Design Estimation Session</h1>
              <div className="flex items-center gap-2">
                <p className="text-gray-600">
                  Session Code: <span className="font-mono font-bold text-gray-900">{sessionCode}</span>
                </p>
                <Button 
                  onClick={copySessionCode} 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 hover:bg-gray-100"
                  title="Copy session code"
                >
                  {codeCopied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {session && <VotingMusicToggle key={sessionCode} isVotingActive={isVotingInProgress} />}
              {session && <VotingTimer isVotingActive={isVotingInProgress} onDurationChange={setVotingDuration} />}
              {currentParticipant && (
                <Button onClick={() => setLeaveDialogOpen(true)} variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  {currentParticipant.is_moderator ? 'End Session' : 'Leave Session'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-[70%_30%] gap-6">
          {/* Left Column - Task Management & Current Voting */}
          <div className="space-y-6 order-2 lg:order-1">
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
                  // Show results if revealed OR if votes_revealed field doesn't exist (undefined = backward compatible)
                  currentTask.votes_revealed !== false ? (
                    <VotingResults
                      taskTitle={currentTask.title}
                      taskId={currentTask.id}
                      votes={votes}
                      participants={participants}
                      isModerator={isModerator}
                      onTaskCompleted={handleTaskUpdate}
                    />
                  ) : (
                    <VotesHidden
                      taskTitle={currentTask.title}
                      votes={votes}
                      participants={participants}
                      isModerator={isModerator}
                      onRevealVotes={revealVotes}
                    />
                  )
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
          <div className="space-y-4 order-1 lg:order-2">
            {/* Sticky container for participants, task history, and current estimate */}
            <div className="lg:sticky lg:top-6 space-y-4">
              {/* Participants */}
              <Card>
                <CardHeader className="pb-0 pt-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="w-3 h-3" />
                    Participants ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex flex-wrap gap-1">
                    {participants.map((participant) => {
                      const hasVoted = currentTask ? votes.some(vote => vote.participant_id === participant.id) : false
                      const isCurrentUser = currentParticipant?.id === participant.id
                      return (
                        <Badge 
                          key={participant.id} 
                          variant={hasVoted ? "default" : "outline"}
                          className={`text-xs px-2 py-0.5 ${
                            isCurrentUser ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''
                          }`}
                          onClick={() => isCurrentUser && handleParticipantClick(participant)}
                          title={isCurrentUser ? 'Click to change your avatar' : ''}
                        >
                          {participant.avatar_emoji && `${participant.avatar_emoji} `}
                          {participant.nickname}
                          {participant.is_moderator && " (M)"}
                          {hasVoted && " ✓"}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Task History - Show if there are completed tasks */}
              {tasks.some(task => task.status === 'completed') && (
                <TaskHistory tasks={tasks} sessionId={session?.id || sessionCode} participants={participants} />
              )}

              {/* Current Estimate Display - Only show when there's an active vote and user hasn't voted */}
              {currentTask && currentParticipant && !votes.some(v => v.participant_id === currentParticipant.id) && (
                <div id="current-estimate-box" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave/End Session Confirmation Dialog */}
      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title={currentParticipant?.is_moderator ? "End Session?" : "Leave Session?"}
        description={
          currentParticipant?.is_moderator
            ? "This will end the session for all participants and take you to a summary page. The session data will be preserved."
            : "Are you sure you want to leave this session? You can rejoin using the session code."
        }
        confirmText={currentParticipant?.is_moderator ? "End Session" : "Leave Session"}
        cancelText={currentParticipant?.is_moderator ? "Continue Session" : "Stay"}
        onConfirm={confirmLeaveSession}
        variant="destructive"
      />

      {/* Emoji Picker Dialog */}
      {selectedParticipantForEmoji && (
        <EmojiPicker
          open={emojiPickerOpen}
          onOpenChange={setEmojiPickerOpen}
          currentEmoji={selectedParticipantForEmoji.avatar_emoji}
          onSelectEmoji={updateParticipantEmoji}
          participantName={selectedParticipantForEmoji.nickname}
        />
      )}
    </div>
  )
}
