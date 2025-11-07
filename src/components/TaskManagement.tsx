'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from './ui/confirm-dialog'
import { supabase, Task } from '@/lib/supabase'
import { Plus, Trash2, Play, GripVertical, Square } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactElement } from 'react'

interface TaskManagementProps {
  sessionId: string
  tasks: Task[]
  onTaskUpdate: () => void
  isModerator: boolean
  hasActiveVoting: boolean
}

// Sortable Task Item Component
function SortableTaskItem({ 
  task, 
  isModerator, 
  getStatusBadge, 
  onStartVoting, 
  onStopVoting,
  onDeleteClick,
  hasActiveVoting,
  hasVotingCompleted
}: { 
  task: Task
  isModerator: boolean
  getStatusBadge: (status: string) => ReactElement
  onStartVoting: (taskId: string) => void
  onStopVoting: (taskId: string) => void
  onDeleteClick: (taskId: string) => void
  hasActiveVoting: boolean
  hasVotingCompleted: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 border rounded-lg bg-white ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Drag Handle */}
      {isModerator && (
        <button
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder task"
        >
          <GripVertical className="w-5 h-5" />
        </button>
      )}

      {/* Task Content */}
      <div className="flex-1">
        <h3 className="font-medium">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge(task.status)}
          {task.final_estimate && (
            <Badge variant="outline">
              Final: {task.final_estimate} points
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isModerator && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {task.status === 'pending' && (
              <Button
                size="sm"
                onClick={() => onStartVoting(task.id)}
                disabled={hasActiveVoting || hasVotingCompleted}
                title={
                  hasActiveVoting 
                    ? "Complete the current voting task first" 
                    : hasVotingCompleted 
                    ? "Complete the finished task before starting a new vote"
                    : "Start voting on this task"
                }
              >
                <Play className="w-4 h-4 mr-1" />
                Start Voting
              </Button>
            )}
            {task.status === 'voting' && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                onClick={() => onStopVoting(task.id)}
                title="Stop voting and return to pending"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop Voting
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="border-black text-black hover:bg-black hover:text-white"
              onClick={() => onDeleteClick(task.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete task
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TaskManagement({ sessionId, tasks, onTaskUpdate, isModerator, hasActiveVoting }: TaskManagementProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [stopVotingDialogOpen, setStopVotingDialogOpen] = useState(false)
  const [taskToStopVoting, setTaskToStopVoting] = useState<string | null>(null)
  // Filter to only show pending/voting tasks
  const activeTasks = tasks.filter(task => task.status === 'pending' || task.status === 'voting')
  // Check if there's a voting_completed task
  const hasVotingCompleted = tasks.some(task => task.status === 'voting_completed')

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // We could update the order in the database here if needed
      // For now, just show visual feedback
      toast.success('Task order updated')
    }
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    try {
      // Add task to Supabase
      const { error } = await supabase
        .from('tasks')
        .insert({
          session_id: sessionId,
          title: newTaskTitle,
          description: newTaskDescription || null,
          status: 'pending'
        })

      if (error) throw error

      setNewTaskTitle('')
      setNewTaskDescription('')
      toast.success('Task added successfully')
      onTaskUpdate()
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      // Delete task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete)

      if (error) throw error
      toast.success('Task deleted successfully')
      onTaskUpdate()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    } finally {
      setTaskToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const startVoting = async (taskId: string) => {
    // Check if there's already an active voting or voting_completed task
    if (hasActiveVoting || hasVotingCompleted) {
      toast.error(
        hasVotingCompleted 
          ? 'Please complete the finished voting task before starting a new one'
          : 'Please complete the current voting task before starting a new one'
      )
      return
    }

    try {
      // Update task status to voting in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'voting' })
        .eq('id', taskId)

      if (error) throw error
      toast.success('Voting started')
      onTaskUpdate()
    } catch (error) {
      console.error('Error starting voting:', error)
      toast.error('Failed to start voting. Please try again.')
    }
  }

  const confirmStopVoting = async () => {
    if (!taskToStopVoting) return

    try {
      // Delete all votes for this task
      const { error: deleteVotesError } = await supabase
        .from('votes')
        .delete()
        .eq('task_id', taskToStopVoting)

      if (deleteVotesError) throw deleteVotesError

      // Update task status back to pending
      const { error: updateTaskError } = await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('id', taskToStopVoting)

      if (updateTaskError) throw updateTaskError

      toast.success('Voting stopped and votes cleared')
      onTaskUpdate()
    } catch (error) {
      console.error('Error stopping voting:', error)
      toast.error('Failed to stop voting. Please try again.')
    } finally {
      setTaskToStopVoting(null)
      setStopVotingDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'voting':
        return <Badge variant="default">Voting</Badge>
      case 'voting_completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Voting Completed</Badge>
      case 'completed':
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Management</CardTitle>
        <CardDescription>
          {isModerator ? 'Create and manage tasks for estimation' : 'View current tasks'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isModerator && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Redesign navigation bar"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description (Optional)</Label>
              <Textarea
                id="task-description"
                placeholder="Add more details about the task..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                rows={3}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            <Button 
              onClick={addTask} 
              disabled={!newTaskTitle.trim() || isAdding || hasActiveVoting}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : hasActiveVoting ? 'Complete active voting first' : 'Add Task'}
            </Button>
            {hasActiveVoting && (
              <p className="text-xs text-gray-600 text-center">
                Complete the current task voting before adding a new task
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {activeTasks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeTasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {activeTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isModerator={isModerator}
                    getStatusBadge={getStatusBadge}
                    onStartVoting={startVoting}
                    onStopVoting={(taskId) => {
                      setTaskToStopVoting(taskId)
                      setStopVotingDialogOpen(true)
                    }}
                    onDeleteClick={(taskId) => {
                      setTaskToDelete(taskId)
                      setDeleteDialogOpen(true)
                    }}
                    hasActiveVoting={hasActiveVoting}
                    hasVotingCompleted={hasVotingCompleted}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No active tasks</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task?"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTask}
        variant="destructive"
      />

      {/* Stop Voting Confirmation Dialog */}
      <ConfirmDialog
        open={stopVotingDialogOpen}
        onOpenChange={setStopVotingDialogOpen}
        title="Stop Voting?"
        description="This will cancel the current vote, delete all submitted votes, and return the task to pending status. This action cannot be undone."
        confirmText="Stop Voting"
        cancelText="Continue Voting"
        onConfirm={confirmStopVoting}
        variant="destructive"
      />
    </Card>
  )
}
