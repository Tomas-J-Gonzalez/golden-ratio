'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Task, Participant, Vote, supabase } from '@/lib/supabase'
import { FileText, ChevronDown, Copy, Check, Trash2 } from 'lucide-react'
import { estimateToTShirtSize } from '@/lib/constants'
import { ConfirmDialog } from './ui/confirm-dialog'
import { toast } from 'sonner'

// Helper function to get tag color classes
const getTagColorClasses = (colorName: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    'pastel-blue': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'pastel-pink': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    'pastel-green': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'pastel-purple': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'pastel-yellow': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    'pastel-orange': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    'pastel-teal': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
    'pastel-rose': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    'pastel-indigo': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
    'pastel-cyan': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  }
  const color = colorMap[colorName] || colorMap['pastel-blue']
  return `${color.bg} ${color.text} ${color.border}`
}

interface TaskHistoryProps {
  tasks: Task[]
  sessionId: string
  participants: Participant[]
  isModerator?: boolean
  onTaskUpdate?: () => void
}

export default function TaskHistory({ tasks, participants, isModerator = false, onTaskUpdate }: TaskHistoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskVotes, setTaskVotes] = useState<Vote[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const tableWrapperRef = useRef<HTMLDivElement | null>(null)
  const dragStartX = useRef(0)
  const scrollStartX = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const completedTasks = tasks.filter(task => task.status === 'completed')

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

  const getTotalPoints = () => {
    return completedTasks.reduce((total, task) => {
      if (!task.final_estimate) return total
      const baseEstimate = task.final_estimate
      const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
      const totalWithBuffer = baseEstimate + bufferAmount
      const finalTotal = totalWithBuffer * (task.iteration_multiplier || 1)
      return total + finalTotal
    }, 0)
  }

  const copyTaskForJira = (task: Task) => {
    const baseEstimate = task.final_estimate || 0
    const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
    const totalWithBuffer = baseEstimate + bufferAmount
    const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
    
    // Generate Jira-formatted text for single task
    let jiraText = `h3. ${task.title}\n\n`
    
    if (task.description) {
      jiraText += `${task.description}\n\n`
    }
    
    jiraText += `h4. Estimation Details\n\n`
    jiraText += `* *Base Estimate:* ${baseEstimate} points\n`
    
    if (task.meeting_buffer) {
      jiraText += `* *Meeting Buffer:* +${Math.round(task.meeting_buffer * 100)}% (+${Math.round(bufferAmount)} points)\n`
    }
    
    if (task.iteration_multiplier && task.iteration_multiplier > 1) {
      jiraText += `* *Design Iterations:* ${task.iteration_multiplier}x multiplier\n`
    }
    
    jiraText += `* *Total Effort:* *${finalTotal} points*\n`
    if (task.voting_duration_seconds) {
      const minutes = Math.floor(task.voting_duration_seconds / 60)
      const seconds = task.voting_duration_seconds % 60
      jiraText += `* *Voting Duration:* ${minutes}:${seconds.toString().padStart(2, '0')}\n`
    }
    jiraText += `* *Completed:* ${new Date(task.created_at).toLocaleDateString()}\n`
    
    navigator.clipboard.writeText(jiraText)
    setCopiedTaskId(task.id)
    setTimeout(() => setCopiedTaskId(null), 2000)
  }

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      // Delete associated votes first
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('task_id', taskToDelete.id)

      if (votesError) {
        console.error('Error deleting votes:', votesError)
        // Continue with task deletion even if votes deletion fails
      }

      // Delete task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id)

      if (error) throw error

      if (onTaskUpdate) {
        onTaskUpdate()
      }
      
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    }
  }

  if (completedTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task History</CardTitle>
          <CardDescription>Completed task estimates will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No completed tasks yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isCollapsed ? '-rotate-90' : ''
              }`}
            />
            <div>
              <CardTitle className="text-sm">Task History</CardTitle>
              <CardDescription className="text-xs">
                {completedTasks.length} completed task{completedTasks.length !== 1 ? 's' : ''} • 
                Total: {getTotalPoints()} points
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          <div
            className="rounded-md border overflow-auto"
            ref={tableWrapperRef}
            onMouseDown={(e) => {
              dragStartX.current = e.clientX
              scrollStartX.current = tableWrapperRef.current?.scrollLeft || 0
              setIsDragging(true)
            }}
            onMouseMove={(e) => {
              if (!isDragging || !tableWrapperRef.current) return
              const delta = dragStartX.current - e.clientX
              tableWrapperRef.current.scrollLeft = scrollStartX.current + delta
            }}
            onMouseLeave={() => setIsDragging(false)}
            onMouseUp={() => setIsDragging(false)}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Base Estimate</TableHead>
                <TableHead>Buffer</TableHead>
                <TableHead>Iterations</TableHead>
                <TableHead>Total Points</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20">{isModerator && <span className="sr-only">Actions</span>}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedTasks.map((task) => {
                const baseEstimate = task.final_estimate || 0
                const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
                const totalWithBuffer = baseEstimate + bufferAmount
                const finalTotal = totalWithBuffer * (task.iteration_multiplier || 1)

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
                        {Math.round(finalTotal)} pts
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.voting_duration_seconds ? (
                        <span className="text-sm text-gray-600 font-mono">
                          {Math.floor(task.voting_duration_seconds / 60)}:{(task.voting_duration_seconds % 60).toString().padStart(2, '0')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => copyTaskForJira(task)}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          title="Copy for Jira"
                        >
                          {copiedTaskId === task.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500" />
                          )}
                        </Button>
                        {isModerator && (
                          <Button
                            onClick={() => handleDeleteClick(task)}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      )}

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

                  {/* Tags Section */}
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, index) => {
                          const colorClasses = getTagColorClasses(tag.color)
                          return (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`${colorClasses} border px-2 py-1 text-xs font-medium`}
                            >
                              {tag.label}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}

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
                      {selectedTask.voting_duration_seconds && (
                        <p>
                          Voting duration: <span className="font-medium font-mono">
                            {Math.floor(selectedTask.voting_duration_seconds / 60)}:{(selectedTask.voting_duration_seconds % 60).toString().padStart(2, '0')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => selectedTask && copyTaskForJira(selectedTask)}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy summary
              </Button>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        description={
          taskToDelete
            ? `Are you sure you want to delete "${taskToDelete.title}"? This will permanently remove the task and all associated votes. This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTask}
        variant="destructive"
      />
    </Card>
  )
}
