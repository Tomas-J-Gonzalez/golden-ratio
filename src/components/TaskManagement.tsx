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
}

export default function TaskManagement({ sessionId, tasks, onTaskUpdate, isModerator }: TaskManagementProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsAdding(true)
    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - add to localStorage
        const newTask = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          title: newTaskTitle,
          description: newTaskDescription || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
        
        const existingTasks = JSON.parse(localStorage.getItem(`demo_tasks_${sessionId}`) || '[]')
        existingTasks.unshift(newTask)
        localStorage.setItem(`demo_tasks_${sessionId}`, JSON.stringify(existingTasks))
        
        setNewTaskTitle('')
        setNewTaskDescription('')
        onTaskUpdate()
        return
      }
      
      // Production mode - use Supabase
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
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - update in localStorage
        const existingTasks = JSON.parse(localStorage.getItem(`demo_tasks_${sessionId}`) || '[]')
        const updatedTasks = existingTasks.map((task: any) => 
          task.id === taskId ? { ...task, status: 'voting' } : task
        )
        localStorage.setItem(`demo_tasks_${sessionId}`, JSON.stringify(updatedTasks))
        onTaskUpdate()
        return
      }
      
      // Production mode - use Supabase
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
        {isModerator && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                placeholder="e.g., Redesign navigation bar"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
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
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet. {isModerator && 'Create your first task above.'}</p>
          ) : (
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
                      variant="destructive"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
