'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Vote, Participant } from '@/lib/supabase'
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

interface VoteFactors {
  effort: number
  time: number
  sprints: number
  designerCount: number
  designerLevels: number[]
  breakpoints: number
  fidelity: number
  meetingBuffer: number
  iterationMultiplier: number
  finalEstimate: number
}

interface VotingResultsProps {
  taskTitle: string
  votes: Vote[]
  participants: Participant[]
}

export default function VotingResults({ taskTitle, votes, participants }: VotingResultsProps) {
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
        return DESIGNER_COUNT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'breakpoints':
        return BREAKPOINT_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
      case 'fidelity':
        return FIDELITY_OPTIONS.find(o => o.value === value)?.label || 'Unknown'
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
        <CardTitle className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          Voting Results: {taskTitle}
        </CardTitle>
        <CardDescription>
          All {votes.length} participants have completed their estimates
        </CardDescription>
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
                  <div><strong>Time:</strong> {getFactorLabel('time', factors.time)}</div>
                  <div><strong>Sprints:</strong> {getFactorLabel('sprints', factors.sprints)}</div>
                  <div><strong>Designers:</strong> {getFactorLabel('designerCount', factors.designerCount)}</div>
                  {factors.designerLevels && factors.designerLevels.length > 0 && (
                    <div className="col-span-2 text-xs text-gray-600">
                      {getDesignerLevels(factors.designerLevels)}
                    </div>
                  )}
                  <div><strong>Breakpoints:</strong> {getFactorLabel('breakpoints', factors.breakpoints)}</div>
                  <div><strong>Fidelity:</strong> {getFactorLabel('fidelity', factors.fidelity)}</div>
                  <div><strong>Meeting Buffer:</strong> {getFactorLabel('meetingBuffer', factors.meetingBuffer)}</div>
                  <div><strong>Iterations:</strong> {getFactorLabel('iterationMultiplier', factors.iterationMultiplier)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
