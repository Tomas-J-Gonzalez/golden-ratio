'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, CheckCircle } from 'lucide-react'
import { Vote, Participant, supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  EFFORT_OPTIONS, 
  TIME_OPTIONS,
  SPRINT_OPTIONS, 
  DESIGNER_COUNT_OPTIONS,
  INDIVIDUAL_DESIGNER_LEVELS,
  BREAKPOINT_OPTIONS, 
  FIDELITY_OPTIONS,
  MEETING_BUFFER_OPTIONS,
  ITERATION_MULTIPLIER_OPTIONS,
  estimateToTShirtSize
} from '@/lib/constants'

// Support both old and new factor structures for backward compatibility
interface VoteFactors {
  effort: number
  time?: number
  sprints: number
  designerCount?: number
  designerLevels?: number[]
  designers?: number // Legacy field
  breakpoints: number
  fidelity: number
  meetingBuffer?: number
  iterationMultiplier?: number
  finalEstimate?: number
  prototypes?: number // Legacy field
}

interface VotingResultsProps {
  taskTitle: string
  taskId: string
  votes: Vote[]
  participants: Participant[]
  isModerator: boolean
  onTaskCompleted?: () => void
}

export default function VotingResults({ taskTitle, taskId, votes, participants, isModerator, onTaskCompleted }: VotingResultsProps) {
  const [copied, setCopied] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    return participant ? participant.nickname : 'Unknown'
  }

  const getFactorLabel = (factorType: string, value: number) => {
    switch (factorType) {
      case 'effort':
        return EFFORT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'time':
        return TIME_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'sprints':
        return SPRINT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'designerCount':
      case 'designers': // Legacy support
        return DESIGNER_COUNT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'breakpoints':
        return BREAKPOINT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'fidelity':
        return FIDELITY_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'prototypes': // Legacy support
        return 'Prototypes (legacy)'
      case 'meetingBuffer':
        return MEETING_BUFFER_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'iterationMultiplier':
        return ITERATION_MULTIPLIER_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      default:
        return 'Unknown'
    }
  }

  const getDesignerLevels = (designerLevels: number[]) => {
    return designerLevels.map((level, index) => 
      `Designer ${index + 1}: ${INDIVIDUAL_DESIGNER_LEVELS.find(l => l.value === level)?.label || 'Unknown'}`
    ).join(', ')
  }

  const generateMarkdownSummary = () => {
    const estimates = votes.map(vote => {
      if (vote.factors && typeof vote.factors === 'object') {
        const factors = vote.factors as Record<string, number>
        const baseEstimate = factors.time || 1
        const complexityMultiplier = (factors.effort + factors.sprints + (factors.designerCount || 1) + factors.breakpoints + factors.fidelity) / 5
        return Math.round(baseEstimate * complexityMultiplier)
      }
      return 0
    })

    const averageEstimate = estimates.length > 0 ? Math.round(estimates.reduce((sum, est) => sum + est, 0) / estimates.length) : 0
    const minEstimate = estimates.length > 0 ? Math.min(...estimates) : 0
    const maxEstimate = estimates.length > 0 ? Math.max(...estimates) : 0

    let markdown = `# Task Estimation Results\n\n`
    markdown += `## Task: ${taskTitle}\n\n`
    markdown += `**Participants:** ${votes.length}\n\n`
    markdown += `---\n\n`
    
    // Summary Statistics
    markdown += `## Summary\n\n`
    markdown += `| Metric | Estimate | Points |\n`
    markdown += `|--------|----------|--------|\n`
    markdown += `| **Average** | ${estimateToTShirtSize(averageEstimate)} | ${averageEstimate} |\n`
    markdown += `| **Minimum** | ${estimateToTShirtSize(minEstimate)} | ${minEstimate} |\n`
    markdown += `| **Maximum** | ${estimateToTShirtSize(maxEstimate)} | ${maxEstimate} |\n\n`
    
    // Individual Estimates
    markdown += `## Individual Estimates\n\n`
    
    votes.forEach((vote) => {
      const factors = vote.factors as VoteFactors
      const estimate = estimates[votes.indexOf(vote)]
      const participantName = getParticipantName(vote.participant_id)
      
      markdown += `### ${participantName}\n\n`
      markdown += `**Estimate:** ${estimateToTShirtSize(estimate)} (${estimate} points)\n\n`
      markdown += `**Factors:**\n`
      markdown += `- **Effort:** ${getFactorLabel('effort', factors.effort)}\n`
      if (factors.time) markdown += `- **Time:** ${getFactorLabel('time', factors.time)}\n`
      markdown += `- **Sprints:** ${getFactorLabel('sprints', factors.sprints)}\n`
      if (factors.designerCount || factors.designers) {
        markdown += `- **Designers:** ${getFactorLabel('designerCount', factors.designerCount || factors.designers || 0)}\n`
      }
      if (factors.designerLevels && factors.designerLevels.length > 0) {
        markdown += `- **Designer Levels:** ${getDesignerLevels(factors.designerLevels)}\n`
      }
      markdown += `- **Breakpoints:** ${getFactorLabel('breakpoints', factors.breakpoints)}\n`
      markdown += `- **Fidelity:** ${getFactorLabel('fidelity', factors.fidelity)}\n`
      if (factors.meetingBuffer) markdown += `- **Meeting Buffer:** ${getFactorLabel('meetingBuffer', factors.meetingBuffer)}\n`
      if (factors.iterationMultiplier) markdown += `- **Design Iterations:** ${getFactorLabel('iterationMultiplier', factors.iterationMultiplier)}\n`
      markdown += `\n`
    })
    
    markdown += `---\n\n`
    markdown += `*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n`
    
    return markdown
  }

  const copyToClipboard = () => {
    const markdown = generateMarkdownSummary()
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const completeTask = async () => {
    if (!isModerator) return
    
    setIsCompleting(true)
    try {
      // Calculate the average estimate to store as final estimate
      const estimates = votes.map(vote => {
        if (vote.factors && typeof vote.factors === 'object') {
          const factors = vote.factors as Record<string, number>
          const baseEstimate = factors.time || 1
          const complexityMultiplier = (factors.effort + factors.sprints + (factors.designerCount || 1) + factors.breakpoints + factors.fidelity) / 5
          return Math.round(baseEstimate * complexityMultiplier)
        }
        return 0
      })
      const averageEstimate = estimates.length > 0 ? Math.round(estimates.reduce((sum, est) => sum + est, 0) / estimates.length) : 0

      // Update task status to completed in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          final_estimate: averageEstimate
        })
        .eq('id', taskId)

      if (error) throw error
      
      toast.success('Task completed successfully!')
      
      if (onTaskCompleted) {
        onTaskCompleted()
      }
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task. Please try again.')
    } finally {
      setIsCompleting(false)
    }
  }

  // Calculate statistics
  const estimates = votes.map(vote => {
    if (vote.factors && typeof vote.factors === 'object') {
      const factors = vote.factors as Record<string, number>
      // Simple calculation for display - you might want to use the actual calculateEstimate function
      const baseEstimate = factors.time || 1
      const complexityMultiplier = (factors.effort + factors.sprints + (factors.designerCount || 1) + factors.breakpoints + factors.fidelity) / 5
      return Math.round(baseEstimate * complexityMultiplier)
    }
    return 0
  })

  const averageEstimate = estimates.length > 0 ? Math.round(estimates.reduce((sum, est) => sum + est, 0) / estimates.length) : 0
  const minEstimate = estimates.length > 0 ? Math.min(...estimates) : 0
  const maxEstimate = estimates.length > 0 ? Math.max(...estimates) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Voting Results: {taskTitle}
            </CardTitle>
            <CardDescription>
              All {votes.length} participants have completed their estimates
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Results
                </>
              )}
            </Button>
            {isModerator && (
              <Button 
                onClick={completeTask}
                disabled={isCompleting}
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                {isCompleting ? 'Completing...' : 'Complete Task'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estimateToTShirtSize(averageEstimate)}</div>
            <div className="text-sm text-blue-700">Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estimateToTShirtSize(minEstimate)}</div>
            <div className="text-sm text-green-700">Minimum</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{estimateToTShirtSize(maxEstimate)}</div>
            <div className="text-sm text-orange-700">Maximum</div>
          </div>
        </div>

        {/* Individual Votes */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Individual Estimates</h4>
          {votes.map((vote) => {
            const factors = vote.factors as VoteFactors
            const estimate = estimates[votes.indexOf(vote)]
            
            return (
              <div key={vote.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{getParticipantName(vote.participant_id)}</div>
                  <Badge className="bg-green-100 text-green-800">
                    {estimateToTShirtSize(estimate)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><strong>Effort:</strong> {getFactorLabel('effort', factors.effort)}</div>
                  {factors.time && <div><strong>Time:</strong> {getFactorLabel('time', factors.time)}</div>}
                  <div><strong>Sprints:</strong> {getFactorLabel('sprints', factors.sprints)}</div>
                  {(factors.designerCount || factors.designers) && <div><strong>Designers:</strong> {getFactorLabel('designerCount', factors.designerCount || factors.designers || 0)}</div>}
                  {factors.designerLevels && factors.designerLevels.length > 0 && (
                    <div className="col-span-2 text-xs text-gray-600">
                      {getDesignerLevels(factors.designerLevels)}
                    </div>
                  )}
                  <div><strong>Breakpoints:</strong> {getFactorLabel('breakpoints', factors.breakpoints)}</div>
                  <div><strong>Fidelity:</strong> {getFactorLabel('fidelity', factors.fidelity)}</div>
                  {factors.prototypes && <div><strong>Prototypes:</strong> {getFactorLabel('prototypes', factors.prototypes)}</div>}
                  {factors.meetingBuffer && <div><strong>Meeting Buffer:</strong> {getFactorLabel('meetingBuffer', factors.meetingBuffer)}</div>}
                  {factors.iterationMultiplier && <div><strong>Iterations:</strong> {getFactorLabel('iterationMultiplier', factors.iterationMultiplier)}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
