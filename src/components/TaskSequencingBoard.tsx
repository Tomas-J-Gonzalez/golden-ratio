'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Task, Vote, Participant } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { SprintColumn } from './SprintColumn'
import { TaskCard } from './TaskCard'
import { Button } from '@/components/ui/button'
import { Download, Settings, RotateCcw, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { SequencingSetupDialog } from './SequencingSetupDialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { estimateToTShirtSize } from '@/lib/constants'

interface TaskSequencingBoardProps {
  sessionId: string
  tasks: Task[]
  sequencingConfig: {
    quarter: string
    startingSprint: number
    sprintsPerQuarter: number
    initiationDate?: string
  }
  onConfigUpdate: () => void
  participants?: Participant[]
  isModerator?: boolean
}

export function TaskSequencingBoard({
  sessionId,
  tasks,
  sequencingConfig,
  onConfigUpdate,
  participants = [],
  isModerator = false
}: TaskSequencingBoardProps) {
  const [organizedTasks, setOrganizedTasks] = useState<Record<number, Task[]>>({})
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskVotes, setTaskVotes] = useState<Vote[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  )

  // Initialize tasks into sprints and backlog
  useEffect(() => {
    const sprints: Record<number, Task[]> = {}
    const backlog: Task[] = []

    const sprintNumbers = Array.from(
      { length: sequencingConfig.sprintsPerQuarter },
      (_, i) => sequencingConfig.startingSprint + i
    )

    // Initialize empty sprints
    sprintNumbers.forEach(sprintNum => {
      sprints[sprintNum] = []
    })

    // Organize tasks
    tasks.forEach(task => {
      if (task.sprint_number && task.quarter === sequencingConfig.quarter) {
        const sprintNum = task.sprint_number
        if (sprints[sprintNum]) {
          sprints[sprintNum].push(task)
        } else {
          backlog.push(task)
        }
      } else {
        backlog.push(task)
      }
    })

    // Sort tasks within each sprint by sequence_order
    Object.keys(sprints).forEach(sprintNum => {
      sprints[parseInt(sprintNum)] = sprints[parseInt(sprintNum)].sort((a, b) => 
        (a.sequence_order || 0) - (b.sequence_order || 0)
      )
    })

    setOrganizedTasks(sprints)
    setBacklogTasks(backlog)
  }, [tasks, sequencingConfig])

  const handleDragStart = () => {
    // Track drag start if needed in the future
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Handle dropping into sprint
    if (overId.startsWith('sprint-')) {
      const sprintNumber = parseInt(overId.replace('sprint-', ''), 10)
      if (!isNaN(sprintNumber)) {
        await moveTaskToSprint(taskId, sprintNumber)
      }
    }
    // Handle dropping into backlog
    else if (overId === 'backlog') {
      await moveTaskToBacklog(taskId)
    }
  }

  const moveTaskToSprint = async (taskId: string, sprintNumber: number) => {
    setIsSaving(true)
    try {
      // Find the task
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      // Remove from current location
      const newOrganized = { ...organizedTasks }
      const newBacklog = backlogTasks.filter(t => t.id !== taskId)

      // Remove from any sprint
      Object.keys(newOrganized).forEach(sprintNum => {
        newOrganized[parseInt(sprintNum)] = newOrganized[parseInt(sprintNum)].filter(t => t.id !== taskId)
      })

      // Add to target sprint
      if (!newOrganized[sprintNumber]) {
        newOrganized[sprintNumber] = []
      }
      
      const updatedTask = { ...task, sprint_number: sprintNumber, quarter: sequencingConfig.quarter }
      newOrganized[sprintNumber].push(updatedTask)

      // Calculate sequence order (append to end)
      const sequenceOrder = newOrganized[sprintNumber].length - 1

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          sprint_number: sprintNumber,
          quarter: sequencingConfig.quarter,
          sequence_order: sequenceOrder
        })
        .eq('id', taskId)

      if (error) throw error

      setOrganizedTasks(newOrganized)
      setBacklogTasks(newBacklog)
      onConfigUpdate()
    } catch (error) {
      console.error('Error moving task:', error)
      toast.error('Failed to move task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const moveTaskToBacklog = async (taskId: string) => {
    setIsSaving(true)
    try {
      // Remove from sprints
      const newOrganized = { ...organizedTasks }
      Object.keys(newOrganized).forEach(sprintNum => {
        newOrganized[parseInt(sprintNum)] = newOrganized[parseInt(sprintNum)].filter(t => t.id !== taskId)
      })

      // Add to backlog
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        const newBacklog = [...backlogTasks.filter(t => t.id !== taskId), task]
        setBacklogTasks(newBacklog)
      }

      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({
          sprint_number: null,
          quarter: null,
          sequence_order: null
        })
        .eq('id', taskId)

      if (error) throw error

      setOrganizedTasks(newOrganized)
      onConfigUpdate()
    } catch (error) {
      console.error('Error moving task to backlog:', error)
      toast.error('Failed to move task. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const exportToCSV = () => {
    const sprintNumbers = Array.from(
      { length: sequencingConfig.sprintsPerQuarter },
      (_, i) => sequencingConfig.startingSprint + i
    )

    const csvRows: string[] = []
    csvRows.push('Sprint,Task Title,Points,Quarter,Order')

    sprintNumbers.forEach(sprintNum => {
      const sprintTasks = organizedTasks[sprintNum] || []
      sprintTasks.forEach((task, index) => {
        const baseEstimate = task.final_estimate || 0
        const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
        const totalWithBuffer = baseEstimate + bufferAmount
        const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
        
        csvRows.push(
          `Sprint ${sprintNum},"${task.title}",${finalTotal},${sequencingConfig.quarter},${index + 1}`
        )
      })
    })

    // Add backlog tasks
    backlogTasks.forEach(task => {
      const baseEstimate = task.final_estimate || 0
      const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
      const totalWithBuffer = baseEstimate + bufferAmount
      const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
      
      csvRows.push(`Backlog,"${task.title}",${finalTotal},,`)
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `task-sequencing-${sequencingConfig.quarter}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Sequencing exported to CSV!')
  }

  const exportToMiro = async () => {
    try {
      const sprintNumbers = Array.from(
        { length: sequencingConfig.sprintsPerQuarter },
        (_, i) => sequencingConfig.startingSprint + i
      )

      // Create Miro-compatible format (tab-separated for easy paste into Miro)
      // Miro converts tab-separated data into sticky notes when pasted
      const miroRows: string[] = []
      
      // Header row (optional, Miro will use first row as headers if detected)
      miroRows.push('Sprint\tTask Title\tPoints\tDescription\tTags\tStart Date')

      sprintNumbers.forEach(sprintNum => {
        const sprintTasks = organizedTasks[sprintNum] || []
        
        // Calculate sprint start date
        let sprintStartDate = ''
        if (sequencingConfig.initiationDate) {
          const initiationDate = new Date(sequencingConfig.initiationDate)
          const sprintIndex = sprintNum - sequencingConfig.startingSprint
          const sprintStart = new Date(initiationDate)
          sprintStart.setDate(sprintStart.getDate() + (sprintIndex * 14)) // 2 weeks per sprint
          sprintStartDate = sprintStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }

        sprintTasks.forEach((task, index) => {
          const baseEstimate = task.final_estimate || 0
          const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
          const totalWithBuffer = baseEstimate + bufferAmount
          const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
          
          const description = task.description || ''
          const tags = task.tags?.map(t => t.label).join(', ') || ''
          
          miroRows.push(
            `Sprint ${sprintNum}\t${task.title}\t${finalTotal} pts\t${description}\t${tags}\t${sprintStartDate}`
          )
        })
      })

      // Add backlog tasks
      backlogTasks.forEach(task => {
        const baseEstimate = task.final_estimate || 0
        const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
        const totalWithBuffer = baseEstimate + bufferAmount
        const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
        const description = task.description || ''
        const tags = task.tags?.map(t => t.label).join(', ') || ''
        
        miroRows.push(`Backlog\t${task.title}\t${finalTotal} pts\t${description}\t${tags}\t`)
      })

      const miroContent = miroRows.join('\n')
      
      // Copy to clipboard
      await navigator.clipboard.writeText(miroContent)
      
      toast.success(
        <div className="space-y-1">
          <div className="font-medium">Data copied to clipboard!</div>
          <div className="text-xs text-gray-600">
            Open Miro, create a new board, and paste (Cmd/Ctrl+V) to create sticky notes
          </div>
        </div>,
        { duration: 5000 }
      )
    } catch (error) {
      console.error('Error exporting to Miro:', error)
      toast.error('Failed to copy to clipboard. Please try again.')
    }
  }

  const clearSequencing = async () => {
    if (!confirm('Are you sure you want to clear all task sequencing? This will remove all sprint assignments.')) {
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          sprint_number: null,
          quarter: null,
          sequence_order: null
        })
        .eq('session_id', sessionId)

      if (error) throw error

      toast.success('Sequencing cleared!')
      onConfigUpdate()
    } catch (error) {
      console.error('Error clearing sequencing:', error)
      toast.error('Failed to clear sequencing. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

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

  const handleTaskExpand = (task: Task) => {
    setSelectedTask(task)
    setTaskDialogOpen(true)
  }

  const handleTaskUpdate = async (taskId: string, updates: { title?: string; description?: string }) => {
    try {
      const updateData: { title?: string; description?: string } = {}
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      toast.success('Task updated successfully')
      onConfigUpdate()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task. Please try again.')
      throw error
    }
  }

  const sprintNumbers = Array.from(
    { length: sequencingConfig.sprintsPerQuarter },
    (_, i) => sequencingConfig.startingSprint + i
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Sequencing</h2>
          <p className="text-sm text-gray-600">
            {sequencingConfig.quarter} • Sprints {sequencingConfig.startingSprint} - {sequencingConfig.startingSprint + sequencingConfig.sprintsPerQuarter - 1}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSetupDialogOpen(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToMiro}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Copy to Miro
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSequencing}
            disabled={isSaving}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Backlog Column */}
          <BacklogColumn 
            tasks={backlogTasks} 
            onTaskExpand={handleTaskExpand}
            isModerator={isModerator}
            onTaskUpdate={handleTaskUpdate}
          />

          {/* Sprint Columns */}
          <SortableContext items={sprintNumbers.map(n => `sprint-${n}`)} strategy={horizontalListSortingStrategy}>
            {sprintNumbers.map((sprintNum) => {
              // Calculate sprint start date (assuming 2-week sprints)
              const sprintStartDate = sequencingConfig.initiationDate 
                ? (() => {
                    const initiationDate = new Date(sequencingConfig.initiationDate)
                    const sprintIndex = sprintNum - sequencingConfig.startingSprint
                    const sprintStart = new Date(initiationDate)
                    sprintStart.setDate(sprintStart.getDate() + (sprintIndex * 14)) // 2 weeks per sprint
                    return sprintStart
                  })()
                : null

              return (
                <div key={sprintNum} className="flex-shrink-0 w-64">
                  <SprintColumn
                    sprintNumber={sprintNum}
                    tasks={organizedTasks[sprintNum] || []}
                    maxCapacity={40}
                    onTaskExpand={handleTaskExpand}
                    sprintStartDate={sprintStartDate}
                    isModerator={isModerator}
                    onTaskUpdate={handleTaskUpdate}
                  />
                </div>
              )
            })}
          </SortableContext>
        </div>
      </DndContext>

      <SequencingSetupDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
        onConfirm={async (config) => {
          // Update session configuration
          const { error } = await supabase
            .from('sessions')
            .update({
              sequencing_quarter: config.quarter,
              sequencing_starting_sprint: config.startingSprint,
              sequencing_sprints_per_quarter: config.sprintsPerQuarter,
              sequencing_initiation_date: config.initiationDate
            })
            .eq('id', sessionId)

          if (error) {
            toast.error('Failed to update configuration')
            return
          }

          toast.success('Configuration updated!')
          setSetupDialogOpen(false)
          onConfigUpdate()
        }}
        existingConfig={{
          quarter: sequencingConfig.quarter,
          startingSprint: sequencingConfig.startingSprint,
          sprintsPerQuarter: sequencingConfig.sprintsPerQuarter,
          initiationDate: sequencingConfig.initiationDate
        }}
      />

      {/* Task Detail Sheet (Miro-style side panel) */}
      <Sheet
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) {
            setSelectedTask(null)
          }
        }}
      >
        {selectedTask && (
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader className="space-y-3 pb-4 border-b">
              <SheetTitle className="text-xl">{selectedTask.title}</SheetTitle>
              <SheetDescription className="whitespace-pre-line text-gray-600 text-base">
                {selectedTask.description || 'No description provided.'}
              </SheetDescription>
            </SheetHeader>

            {(() => {
              const baseEstimate = selectedTask.final_estimate || 0
              const bufferPercent = selectedTask.meeting_buffer ? Math.round(selectedTask.meeting_buffer * 100) : 0
              const bufferAmount = selectedTask.meeting_buffer ? Math.round(baseEstimate * selectedTask.meeting_buffer) : 0
              const iterationMultiplier = selectedTask.iteration_multiplier || 1
              const totalPoints = Math.round((baseEstimate + bufferAmount) * iterationMultiplier)
              const completedDate = new Date(selectedTask.created_at)

              return (
                <div className="space-y-6 pt-6">
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
                      {selectedTask.voting_duration_seconds && (
                        <p>Voting duration: <span className="font-medium">
                          {Math.floor(selectedTask.voting_duration_seconds / 60)}:{(selectedTask.voting_duration_seconds % 60).toString().padStart(2, '0')}
                        </span></p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}

// Backlog Column Component
function BacklogColumn({ 
  tasks, 
  onTaskExpand,
  isModerator = false,
  onTaskUpdate
}: { 
  tasks: Task[]
  onTaskExpand?: (task: Task) => void
  isModerator?: boolean
  onTaskUpdate?: (taskId: string, updates: { title?: string; description?: string }) => Promise<void>
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'backlog',
    data: {
      type: 'backlog'
    }
  })

  return (
    <div className="flex-shrink-0 w-64">
      <div
        ref={setNodeRef}
        className={`
          flex flex-col h-full min-h-[500px] bg-gray-100 rounded-lg border-2 border-dashed p-3
          ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
        `}
      >
        <h3 className="font-semibold text-sm text-gray-700 mb-3">Backlog</h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                isOver={isOver} 
                onExpand={onTaskExpand}
                isModerator={isModerator}
                onUpdate={onTaskUpdate}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-8">
              No unassigned tasks
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

