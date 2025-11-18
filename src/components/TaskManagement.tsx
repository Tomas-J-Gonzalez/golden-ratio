'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from './ui/confirm-dialog'
import { TagPicker, TaskTag } from './TagPicker'
import { supabase, Task } from '@/lib/supabase'
import { Plus, Trash2, Play, GripVertical, Square, ChevronDown } from 'lucide-react'
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
  arrayMove,
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

// Sortable Task Item Component
function SortableTaskItem({ 
  task, 
  isModerator, 
  getStatusBadge, 
  onStartVoting, 
  onStopVoting,
  onDeleteClick,
  onTagsUpdate,
  hasActiveVoting,
  hasVotingCompleted
}: { 
  task: Task
  isModerator: boolean
  getStatusBadge: (status: string) => ReactElement
  onStartVoting: (taskId: string) => void
  onStopVoting: (taskId: string) => void
  onDeleteClick: (taskId: string) => void
  onTagsUpdate: (taskId: string, tags: TaskTag[]) => void
  hasActiveVoting: boolean
  hasVotingCompleted: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
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

  // Check if description is long (more than ~60 characters as a rough estimate for 1 line)
  const isLongDescription = task.description && task.description.length > 60

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-3 p-4 border rounded-lg bg-white ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Drag Handle */}
      {isModerator && (
        <button
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1 mt-0.5"
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
          <div className="mt-1">
            <p 
              className={`text-sm text-gray-600 ${
                !isExpanded && isLongDescription ? 'line-clamp-1' : ''
              }`}
            >
              {task.description}
            </p>
            {isLongDescription && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(!isExpanded)
                }}
                className="text-xs text-gray-400 hover:text-gray-600 mt-0.5 focus:outline-none"
              >
                {isExpanded ? '- less' : '+ more'}
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge(task.status)}
          {task.final_estimate && (
            <Badge variant="outline">
              Final: {task.final_estimate} points
            </Badge>
          )}
        </div>
        {/* Tags */}
        {isModerator && task.status === 'pending' && (
          <div className="mt-2">
            <TagPicker
              tags={task.tags || []}
              onTagsChange={(tags) => onTagsUpdate(task.id, tags)}
              disabled={false}
            />
          </div>
        )}
        {task.tags && task.tags.length > 0 && task.status !== 'pending' && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task.tags.map((tag, index) => {
              const colorClasses = getTagColorClasses(tag.color)
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className={`${colorClasses} border px-2 py-0.5 text-xs font-medium`}
                >
                  {tag.label}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isModerator && (
        <div className="flex flex-col gap-2 flex-shrink-0">
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
  const [newTaskTags, setNewTaskTags] = useState<TaskTag[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [stopVotingDialogOpen, setStopVotingDialogOpen] = useState(false)
  const [taskToStopVoting, setTaskToStopVoting] = useState<string | null>(null)
  const [isAddFormExpanded, setIsAddFormExpanded] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [isCardCollapsed, setIsCardCollapsed] = useState(false)
  // State to hold the draggable tasks
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  // Check if there's a voting_completed task
  const hasVotingCompleted = tasks.some(task => task.status === 'voting_completed')

  // Update active tasks when tasks prop changes
  useEffect(() => {
    const baseActiveTasks = tasks.filter(task => task.status === 'pending' || task.status === 'voting')
    setActiveTasks(baseActiveTasks)
  }, [tasks])

  // Auto-collapse when voting starts
  useEffect(() => {
    if (hasActiveVoting) {
      setIsCardCollapsed(true)
    }
  }, [hasActiveVoting])

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
      setActiveTasks((items) => {
        const oldIndex = items.findIndex(task => task.id === active.id)
        const newIndex = items.findIndex(task => task.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
      
      // Optional: You could persist this order to the database here
      // by adding an 'order' or 'position' field to the tasks table
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
          status: 'pending',
          tags: newTaskTags.length > 0 ? newTaskTags : null
        })

      if (error) throw error

      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskTags([])
      toast.success('Task added successfully')
      onTaskUpdate()
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const updateTaskTags = async (taskId: string, tags: TaskTag[]) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ tags: tags.length > 0 ? tags : null })
        .eq('id', taskId)

      if (error) throw error
      onTaskUpdate()
    } catch (error) {
      console.error('Error updating task tags:', error)
      toast.error('Failed to update tags. Please try again.')
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
      // Update task status to voting and reset votes_revealed in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'voting',
          votes_revealed: false 
        })
        .eq('id', taskId)

      if (error) {
        // If votes_revealed column doesn't exist, just update status
        if (error.message?.includes('column') || error.code === '42703') {
          const { error: fallbackError } = await supabase
            .from('tasks')
            .update({ status: 'voting' })
            .eq('id', taskId)
          
          if (fallbackError) throw fallbackError
        } else {
          throw error
        }
      }
      
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Task Management</CardTitle>
            <CardDescription>
              {isModerator ? 'Create and manage tasks for estimation' : 'View current tasks'}
            </CardDescription>
          </div>
          <button
            onClick={() => setIsCardCollapsed(!isCardCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCardCollapsed ? 'Expand task management' : 'Collapse task management'}
            title={isCardCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown 
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isCardCollapsed ? '-rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </CardHeader>
      {!isCardCollapsed && (
        <CardContent className="space-y-4">
        {isModerator && (
          <div className="border rounded-lg bg-gray-50">
            {/* Collapsible Header */}
            <button
              onClick={() => setIsAddFormExpanded(!isAddFormExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 rounded-t-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">
                  {isAddFormExpanded ? 'Hide Form' : 'Add New Task'}
                </span>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isAddFormExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Collapsible Form */}
            {isAddFormExpanded && (
              <div className="p-4 space-y-4 border-t border-gray-200">
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

                {/* Description Toggle */}
                {!showDescription ? (
                  <button
                    onClick={() => setShowDescription(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    + add description
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="task-description">Description (Optional)</Label>
                      <button
                        onClick={() => {
                          setShowDescription(false)
                          setNewTaskDescription('')
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        - remove
                      </button>
                    </div>
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
                )}

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <TagPicker
                    tags={newTaskTags}
                    onTagsChange={setNewTaskTags}
                    disabled={false}
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
                    onTagsUpdate={updateTaskTags}
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
      )}

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
