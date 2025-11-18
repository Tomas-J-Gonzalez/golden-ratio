'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Task } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { SprintColumn } from './SprintColumn'
import { TaskCard } from './TaskCard'
import { Button } from '@/components/ui/button'
import { Download, Settings, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { SequencingSetupDialog } from './SequencingSetupDialog'

interface TaskSequencingBoardProps {
  sessionId: string
  tasks: Task[]
  sequencingConfig: {
    quarter: string
    startingSprint: number
    sprintsPerQuarter: number
  }
  onConfigUpdate: () => void
}

export function TaskSequencingBoard({
  sessionId,
  tasks,
  sequencingConfig,
  onConfigUpdate
}: TaskSequencingBoardProps) {
  const [organizedTasks, setOrganizedTasks] = useState<Record<number, Task[]>>({})
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)

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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Backlog Column */}
          <BacklogColumn tasks={backlogTasks} />

          {/* Sprint Columns */}
          <SortableContext items={sprintNumbers.map(n => `sprint-${n}`)} strategy={horizontalListSortingStrategy}>
            {sprintNumbers.map((sprintNum) => (
              <div key={sprintNum} className="flex-shrink-0 w-64">
                <SprintColumn
                  sprintNumber={sprintNum}
                  tasks={organizedTasks[sprintNum] || []}
                  maxCapacity={40}
                />
              </div>
            ))}
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
              sequencing_sprints_per_quarter: config.sprintsPerQuarter
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
        existingConfig={sequencingConfig}
      />
    </div>
  )
}

// Backlog Column Component
function BacklogColumn({ tasks }: { tasks: Task[] }) {
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
              <TaskCard key={task.id} task={task} isOver={isOver} />
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

