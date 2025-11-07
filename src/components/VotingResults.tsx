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
        {/* Summary Statistics - Minimal layout */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="px-4 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Final estimate</h3>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100 px-4 py-5">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs text-gray-500">Minimum</span>
              <span className="text-lg font-semibold text-gray-900">{estimateToTShirtSize(minEstimate)}</span>
              <span className="text-xs text-gray-400">{minEstimate} pts</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs text-gray-500">Average</span>
              <span className="text-2xl font-semibold text-gray-900">{estimateToTShirtSize(averageEstimate)}</span>
              <span className="text-[11px] font-medium text-blue-600/80 bg-blue-50 px-2 py-0.5 rounded-full">{averageEstimate} pts</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-xs text-gray-500">Maximum</span>
              <span className="text-lg font-semibold text-gray-900">{estimateToTShirtSize(maxEstimate)}</span>
              <span className="text-xs text-gray-400">{maxEstimate} pts</span>
            </div>
          </div>
        </div>

        {/* Individual Estimates - Collapsible/Cleaner */}
        <details open className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between py-2 px-1 hover:bg-gray-50 rounded">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Individual Estimates ({votes.length})
                <span className="text-xs text-gray-400">Click to toggle</span>
              </h3>
              <svg 
                className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          
          <div className="space-y-3 mt-4">
            {votes.map((vote) => {
              const factors = vote.factors as VoteFactors
              const estimate = estimates[votes.indexOf(vote)]
              
              return (
                <div key={vote.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
                  {/* Header */}
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <div className="font-medium text-gray-900">{getParticipantName(vote.participant_id)}</div>
                    <Badge className="bg-green-600 text-white text-sm px-3 py-1">
                      {estimateToTShirtSize(estimate)}
                    </Badge>
                  </div>
                  
                  {/* Factor Details */}
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Effort:</span>
                        <span className="font-medium text-gray-900">{getFactorLabel('effort', factors.effort)}</span>
                      </div>
                      {factors.time && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time:</span>
                          <span className="font-medium text-gray-900">{getFactorLabel('time', factors.time)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sprints:</span>
                        <span className="font-medium text-gray-900">{getFactorLabel('sprints', factors.sprints)}</span>
                      </div>
                      {(factors.designerCount || factors.designers) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Designers:</span>
                          <span className="font-medium text-gray-900">{getFactorLabel('designerCount', factors.designerCount || factors.designers || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Breakpoints:</span>
                        <span className="font-medium text-gray-900">{getFactorLabel('breakpoints', factors.breakpoints)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fidelity:</span>
                        <span className="font-medium text-gray-900">{getFactorLabel('fidelity', factors.fidelity)}</span>
                      </div>
                      {factors.meetingBuffer && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Buffer:</span>
                          <span className="font-medium text-gray-900">{getFactorLabel('meetingBuffer', factors.meetingBuffer)}</span>
                        </div>
                      )}
                      {factors.iterationMultiplier && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Iterations:</span>
                          <span className="font-medium text-gray-900">{getFactorLabel('iterationMultiplier', factors.iterationMultiplier)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Designer Levels - Full Width */}
                    {factors.designerLevels && factors.designerLevels.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500 block mb-1">Designer Levels:</span>
                        <span className="text-xs text-gray-700">{getDesignerLevels(factors.designerLevels)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
