'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase, Task } from '@/lib/supabase'
import { Plus, Trash2, Play } from 'lucide-react'

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
      onTaskUpdate()
    } catch (error) {
      console.error('Error adding task:', error)
      alert('Failed to add task. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      // Delete task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      onTaskUpdate()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
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
      onTaskUpdate()
    } catch (error) {
      console.error('Error starting voting:', error)
      alert('Failed to start voting. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'voting':
        return <Badge variant="default">Voting</Badge>
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
        {isModerator && !hasActiveVoting && (
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
              disabled={!newTaskTitle.trim() || isAdding}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add Task'}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {tasks.length > 0 && (
            tasks.map((task) => (
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
                      onClick={() => deleteTask(task.id)}
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
    </Card>
  )
}
