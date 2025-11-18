'use client'

import { use, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { supabase, Session, Task, Participant, Vote } from '@/lib/supabase'
import { Copy, Check, Home, Users, Calendar, Clock, Kanban } from 'lucide-react'
import { toast } from 'sonner'
import TopNavigation from '@/components/TopNavigation'
import { estimateToTShirtSize } from '@/lib/constants'
import { TaskSequencingBoard } from '@/components/TaskSequencingBoard'
import { SequencingSetupDialog } from '@/components/SequencingSetupDialog'

interface SessionReviewPageProps {
  params: Promise<{ sessionCode: string }>
}

export default function SessionReviewPage({ params }: SessionReviewPageProps) {
  const { sessionCode } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskVotes, setTaskVotes] = useState<Vote[]>([])
  const [showSequencing, setShowSequencing] = useState(false)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)

  useEffect(() => {
    loadSessionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionCode])

  // Load votes when a task is selected
  useEffect(() => {
    const loadTaskVotes = async () => {
      if (!selectedTask) {
        setTaskVotes([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('task_id', selectedTask.id)

        if (error) throw error
        setTaskVotes(data || [])
      } catch (error) {
        console.error('Error loading votes:', error)
        setTaskVotes([])
      }
    }

    loadTaskVotes()
  }, [selectedTask])

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    return participant?.nickname || 'Unknown'
  }

  const loadSessionData = async () => {
    try {
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', sessionCode)
        .single()

      if (sessionError || !sessionData) {
        throw new Error('Session not found')
      }

      setSession(sessionData)

      // Load all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('joined_at', { ascending: true })

      if (participantsError) throw participantsError
      setParticipants(participantsData || [])

    } catch (error) {
      console.error('Error loading session data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSessionDuration = () => {
    if (!session) return 'Unknown'
    
    const startTime = new Date(session.created_at)
    const endTime = new Date() // Current time as end
    const durationMs = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  const getTotalPoints = () => {
    return tasks
      .filter(task => task.final_estimate)
      .reduce((total, task) => {
        const baseEstimate = task.final_estimate || 0
        const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
        const totalWithBuffer = baseEstimate + bufferAmount
        const finalTotal = totalWithBuffer * (task.iteration_multiplier || 1)
        return total + finalTotal
      }, 0)
  }

  const generateSummaryMarkdown = () => {
    let markdown = `# Session Summary\n\n`
    markdown += `**Session Code:** ${sessionCode}\n`
    markdown += `**Date:** ${new Date(session?.created_at || '').toLocaleDateString()}\n`
    markdown += `**Duration:** ${getSessionDuration()}\n`
    markdown += `**Participants:** ${participants.length}\n`
    markdown += `**Tasks Completed:** ${tasks.filter(t => t.status === 'completed').length}\n`
    markdown += `**Total Effort Points:** ${Math.round(getTotalPoints())}\n\n`
    
    markdown += `---\n\n`
    markdown += `## Participants\n\n`
    participants.forEach(p => {
      markdown += `- ${p.nickname}${p.is_moderator ? ' (Moderator)' : ''}\n`
    })
    
    markdown += `\n## Tasks Estimated\n\n`
    markdown += `| Task | Status | Estimate | Date |\n`
    markdown += `|------|--------|----------|------|\n`
    
    tasks.forEach(task => {
      const estimate = task.final_estimate || 'N/A'
      const status = task.status.replace('_', ' ')
      const date = new Date(task.created_at).toLocaleDateString()
      markdown += `| ${task.title} | ${status} | ${estimate} pts | ${date} |\n`
    })
    
    return markdown
  }

  const copySummary = () => {
    const markdown = generateSummaryMarkdown()
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Summary copied!')
  }

  if (isLoading) {
    return (
      <>
        <TopNavigation />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading session summary...</p>
          </div>
        </div>
      </>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'completed')
  const hasSequencing = session?.sequencing_enabled && 
                        session?.sequencing_quarter && 
                        session?.sequencing_starting_sprint &&
                        session?.sequencing_sprints_per_quarter

  const handleStartSequencing = async (config: {
    quarter: string
    startingSprint: number
    sprintsPerQuarter: number
  }) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          sequencing_enabled: true,
          sequencing_quarter: config.quarter,
          sequencing_starting_sprint: config.startingSprint,
          sequencing_sprints_per_quarter: config.sprintsPerQuarter
        })
        .eq('id', session?.id)

      if (error) throw error

      toast.success('Sequencing started!')
      setSetupDialogOpen(false)
      setShowSequencing(true)
      loadSessionData()
    } catch (error) {
      console.error('Error starting sequencing:', error)
      toast.error('Failed to start sequencing. Please try again.')
    }
  }

  return (
    <>
      <TopNavigation />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className={`container mx-auto px-4 py-8 ${showSequencing ? 'max-w-full' : 'max-w-5xl'}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Summary</h1>
                <p className="text-gray-600">
                  Session Code: <span className="font-mono font-bold text-gray-900">{sessionCode}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {completedTasks.length > 0 && !showSequencing && (
                  <Button 
                    onClick={() => {
                      if (hasSequencing) {
                        setShowSequencing(true)
                      } else {
                        setSetupDialogOpen(true)
                      }
                    }} 
                    variant="default" 
                    size="sm"
                  >
                    <Kanban className="w-4 h-4 mr-2" />
                    {hasSequencing ? 'View Sequencing' : 'Start Sequencing'}
                  </Button>
                )}
                {showSequencing && (
                  <Button 
                    onClick={() => setShowSequencing(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    View Summary
                  </Button>
                )}
                <Button onClick={copySummary} variant="outline" size="sm">
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy Summary'}
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>

          {/* Task Sequencing Board */}
          {showSequencing && hasSequencing && (
            <div className="mb-8">
              <TaskSequencingBoard
                sessionId={session?.id || ''}
                tasks={completedTasks}
                sequencingConfig={{
                  quarter: session?.sequencing_quarter || '',
                  startingSprint: session?.sequencing_starting_sprint || 154,
                  sprintsPerQuarter: session?.sequencing_sprints_per_quarter || 6
                }}
                onConfigUpdate={loadSessionData}
              />
            </div>
          )}

          {/* Session Stats */}
          {!showSequencing && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {new Date(session?.created_at || '').toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {getSessionDuration()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {participants.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(getTotalPoints())}
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Participants List */}
          {!showSequencing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                {participants.length} participant{participants.length !== 1 ? 's' : ''} joined this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {participants.map(participant => (
                  <Badge 
                    key={participant.id}
                    variant={participant.is_moderator ? "default" : "outline"}
                    className="px-3 py-1"
                  >
                    {participant.nickname}
                    {participant.is_moderator && " (Moderator)"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Completed Tasks */}
          {!showSequencing && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks Completed</CardTitle>
              <CardDescription>
                {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} estimated during this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedTasks.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Base Estimate</TableHead>
                        <TableHead>Buffer</TableHead>
                        <TableHead>Iterations</TableHead>
                        <TableHead>Total Points</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedTasks.map((task) => {
                        const baseEstimate = task.final_estimate || 0
                        const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
                        const totalWithBuffer = baseEstimate + bufferAmount
                        const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))

                        return (
                          <TableRow key={task.id}>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTask(task)
                                  setTaskDialogOpen(true)
                                }}
                                className="font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded text-left"
                              >
                                {task.title}
                              </button>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{baseEstimate} pts</Badge>
                            </TableCell>
                            <TableCell>
                              {task.meeting_buffer ? (
                                <Badge variant="secondary">
                                  +{Math.round(task.meeting_buffer * 100)}%
                                </Badge>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {task.iteration_multiplier || 1}x
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-blue-600 text-white">
                                {finalTotal} pts
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No tasks were completed in this session</p>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* All Tasks (including pending/voting) */}
          {!showSequencing && tasks.filter(t => t.status !== 'completed').length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Other Tasks</CardTitle>
                <CardDescription>
                  Tasks that were created but not completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.filter(t => t.status !== 'completed').map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                        )}
                      </div>
                      <Badge variant="secondary">{task.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sequencing Setup Dialog */}
          <SequencingSetupDialog
            open={setupDialogOpen}
            onOpenChange={setSetupDialogOpen}
            onConfirm={handleStartSequencing}
          />
        </div>
      </div>

      {/* Task Detail Modal */}
      <Dialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) {
            setSelectedTask(null)
          }
        }}
      >
        {selectedTask && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader className="space-y-2">
              <DialogTitle>{selectedTask.title}</DialogTitle>
              <DialogDescription className="whitespace-pre-line text-gray-600">
                {selectedTask.description || 'No description provided.'}
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const baseEstimate = selectedTask.final_estimate || 0
              const bufferPercent = selectedTask.meeting_buffer ? Math.round(selectedTask.meeting_buffer * 100) : 0
              const bufferAmount = selectedTask.meeting_buffer ? Math.round(baseEstimate * selectedTask.meeting_buffer) : 0
              const iterationMultiplier = selectedTask.iteration_multiplier || 1
              const totalPoints = Math.round((baseEstimate + bufferAmount) * iterationMultiplier)
              const completedDate = new Date(selectedTask.created_at)

              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Base Estimate</p>
                      <p className="text-lg font-semibold text-gray-900">{baseEstimate > 0 ? `${baseEstimate} pts` : '—'}</p>
                      {baseEstimate > 0 && (
                        <p className="text-xs text-gray-500">{estimateToTShirtSize(baseEstimate)}</p>
                      )}
                    </div>
                    <div className="rounded-md border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Meeting Buffer</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {bufferPercent > 0 ? `+${bufferPercent}%` : 'None'}
                      </p>
                      {bufferPercent > 0 && (
                        <p className="text-xs text-gray-500">≈ {bufferAmount} pts extra</p>
                      )}
                    </div>
                    <div className="rounded-md border bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">Iteration Multiplier</p>
                      <p className="text-lg font-semibold text-gray-900">{iterationMultiplier}x</p>
                      {iterationMultiplier > 1 && (
                        <p className="text-xs text-gray-500">Accounts for additional review cycles</p>
                      )}
                    </div>
                    <div className="rounded-md border bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">Total Effort</p>
                      <p className="text-xl font-semibold text-blue-700">{totalPoints} pts</p>
                      {totalPoints > 0 && (
                        <p className="text-xs text-blue-600/80">{estimateToTShirtSize(totalPoints)}</p>
                      )}
                    </div>
                  </div>

                  {/* Voters Section */}
                  {taskVotes.length > 0 && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm mb-2">
                        Participants ({taskVotes.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {taskVotes.map((vote) => (
                          <Badge 
                            key={vote.id}
                            variant="default"
                            className="text-xs px-2 py-1"
                          >
                            {getParticipantName(vote.participant_id)}
                            <span className="ml-1 opacity-70">• {vote.value} pts</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-md border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">Completion Details</p>
                    <div className="mt-2 space-y-1">
                      <p>Logged on <span className="font-medium">{completedDate.toLocaleDateString()}</span></p>
                      <p>Created at <span className="font-medium">{completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                    </div>
                  </div>
                </div>
              )
            })()}

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

