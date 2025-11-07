'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Task } from '@/lib/supabase'
import { Download, FileText, ChevronDown, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { estimateToTShirtSize } from '@/lib/constants'

interface TaskHistoryProps {
  tasks: Task[]
  sessionId: string
}

export default function TaskHistory({ tasks, sessionId }: TaskHistoryProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'voting_completed')

  const exportToCSV = async () => {
    setIsExporting(true)
    try {
      const csvData = completedTasks.map(task => ({
        'Task Title': task.title,
        'Description': task.description || '',
        'Final Estimate': task.final_estimate || 0,
        'Meeting Buffer': task.meeting_buffer ? `${Math.round(task.meeting_buffer * 100)}%` : '0%',
        'Iteration Multiplier': task.iteration_multiplier || 1,
        'Total Points': task.final_estimate 
          ? Math.round((task.final_estimate + (task.final_estimate * (task.meeting_buffer || 0))) * (task.iteration_multiplier || 1))
          : 0,
        'Created At': new Date(task.created_at).toLocaleDateString()
      }))

      const headers = Object.keys(csvData[0] || {})
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `estimation-session-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Failed to export CSV. Please try again.')
    } finally {
      setIsExporting(false)
    }
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
    jiraText += `* *Completed:* ${new Date(task.created_at).toLocaleDateString()}\n`
    
    navigator.clipboard.writeText(jiraText)
    setCopiedTaskId(task.id)
    setTimeout(() => setCopiedTaskId(null), 2000)
    toast.success('Task copied for Jira!')
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
          {!isCollapsed && (
            <Button 
              onClick={(e) => {
                e.stopPropagation()
                exportToCSV()
              }}
              disabled={isExporting} 
              variant="outline"
              size="sm"
            >
              <Download className="w-3 h-3 mr-1" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
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
                <TableHead className="w-20"></TableHead>
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
                        className="font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-300 rounded"
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
                      <span className="text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
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
    </Card>
  )
}
