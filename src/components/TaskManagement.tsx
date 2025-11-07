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
import { Plus, Trash2, Play } from 'lucide-react'
import { toast } from 'sonner'

interface TaskManagementProps {
  sessionId: string
  tasks: Task[]
  onTaskUpdate: () => void
  isModerator: boolean
  hasActiveVoting: boolean
}

export default function TaskManagement({ sessionId, tasks, onTaskUpdate, isModerator, hasActiveVoting }: TaskManagementProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)

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
          {tasks.filter(task => task.status === 'pending' || task.status === 'voting').length > 0 && (
            tasks.filter(task => task.status === 'pending' || task.status === 'voting').map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                {isModerator && (
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => startVoting(task.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Voting
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-black text-black hover:bg-black hover:text-white"
                      onClick={() => {
                        setTaskToDelete(task.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete task
                    </Button>
                  </div>
                )}
              </div>
            ))
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
    </Card>
  )
}
