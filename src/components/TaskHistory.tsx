'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Task } from '@/lib/supabase'
import { Download, FileText, ChevronDown, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface TaskHistoryProps {
  tasks: Task[]
  sessionId: string
}

export default function TaskHistory({ tasks, sessionId }: TaskHistoryProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)

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
                      <div className="font-medium">{task.title}</div>
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
    </Card>
  )
}
