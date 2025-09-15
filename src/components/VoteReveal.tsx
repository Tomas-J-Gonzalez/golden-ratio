'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, Vote } from '@/lib/supabase'
import { 
  EFFORT_OPTIONS, 
  SPRINT_OPTIONS, 
  DESIGNER_COUNT_OPTIONS,
  DESIGNER_LEVEL_OPTIONS,
  BREAKPOINT_OPTIONS, 
  PROTOTYPE_OPTIONS, 
  FIDELITY_OPTIONS,
  MEETING_BUFFER_OPTIONS, 
  ITERATION_MULTIPLIER_OPTIONS,
  estimateToHours
} from '@/lib/constants'
import { CheckCircle, BarChart3 } from 'lucide-react'

interface VoteRevealProps {
  taskId: string
  taskTitle: string
  votes: Vote[]
  participants: Array<{ id: string; nickname: string }>
  isModerator: boolean
  onEstimateFinalized: () => void
}

export default function VoteReveal({ 
  taskId, 
  taskTitle, 
  votes, 
  participants,
  isModerator,
  onEstimateFinalized 
}: VoteRevealProps) {
  const [finalEstimate, setFinalEstimate] = useState<number>(0)
  const [meetingBuffer, setMeetingBuffer] = useState<number>(0)
  const [iterationMultiplier, setIterationMultiplier] = useState<number>(1)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Calculate vote statistics
  const voteStats = votes.reduce((acc, vote) => {
    const label = `${vote.value} pts`
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const averageVote = votes.length > 0 
    ? Math.round(votes.reduce((sum, vote) => sum + vote.value, 0) / votes.length)
    : 0

  const maxVote = Math.max(...votes.map(v => v.value))
  const minVote = Math.min(...votes.map(v => v.value))

  const finalizeEstimate = async () => {
    if (finalEstimate <= 0) return

    setIsFinalizing(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          final_estimate: finalEstimate,
          meeting_buffer: meetingBuffer,
          iteration_multiplier: iterationMultiplier
        })
        .eq('id', taskId)

      if (error) throw error
      onEstimateFinalized()
    } catch (error) {
      console.error('Error finalizing estimate:', error)
      alert('Failed to finalize estimate. Please try again.')
    } finally {
      setIsFinalizing(false)
    }
  }

  const getVoteColor = (value: number) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      4: 'bg-yellow-100 text-yellow-800',
      8: 'bg-orange-100 text-orange-800',
      16: 'bg-red-100 text-red-800'
    }
    return colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Vote Results
          </CardTitle>
          <CardDescription>
            Results for: <span className="font-medium">&ldquo;{taskTitle}&rdquo;</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vote Distribution */}
          <div className="space-y-3">
            <h4 className="font-medium">Vote Distribution</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(voteStats).map(([label, count]) => (
                <Badge key={label} variant="secondary" className="text-sm">
                  {label}: {count} vote{count !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </div>

          {/* Individual Votes */}
          <div className="space-y-3">
            <h4 className="font-medium">Individual Votes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {votes.map((vote) => {
                const participant = participants.find(p => p.id === vote.participant_id)
                const factors = vote.factors || {} as {
                  effort?: number;
                  sprints?: number;
                  designers?: number; // Legacy support
                  designerCount?: number;
                  designerLevel?: number;
                  breakpoints?: number;
                  prototypes?: number;
                  fidelity?: number;
                }
                const hoursEstimate = estimateToHours(vote.value)
                return (
                  <div key={vote.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getVoteColor(vote.value)}>
                        {vote.value} pts
                      </Badge>
                      <span className="text-sm font-medium">
                        {participant?.nickname || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 text-gray-600">
                      <div><strong>Hours:</strong> {hoursEstimate}</div>
                      {factors.effort && <div><strong>Effort:</strong> {EFFORT_OPTIONS.find(o => o.value === factors.effort)?.label}</div>}
                      {factors.sprints && <div><strong>Sprints:</strong> {SPRINT_OPTIONS.find(o => o.value === factors.sprints)?.label}</div>}
                      {factors.designerCount && factors.designerLevel ? (
                        <div><strong>Designers:</strong> {DESIGNER_COUNT_OPTIONS.find(o => o.value === factors.designerCount)?.label} ({DESIGNER_LEVEL_OPTIONS.find(o => o.value === factors.designerLevel)?.label})</div>
                      ) : factors.designers && (
                        <div><strong>Designers:</strong> {DESIGNER_COUNT_OPTIONS.find(o => o.value === factors.designers)?.label || 'Legacy format'}</div>
                      )}
                      {factors.breakpoints && <div><strong>Breakpoints:</strong> {BREAKPOINT_OPTIONS.find(o => o.value === factors.breakpoints)?.label}</div>}
                      {factors.prototypes && <div><strong>Prototypes:</strong> {PROTOTYPE_OPTIONS.find(o => o.value === factors.prototypes)?.label}</div>}
                      {factors.fidelity && <div><strong>Fidelity:</strong> {FIDELITY_OPTIONS.find(o => o.value === factors.fidelity)?.label}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageVote}</div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{minVote}</div>
              <div className="text-sm text-gray-600">Min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{maxVote}</div>
              <div className="text-sm text-gray-600">Max</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isModerator && (
        <Card>
          <CardHeader>
            <CardTitle>Finalize Estimate</CardTitle>
            <CardDescription>
              Set the final estimate and any additional factors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="final-estimate">Final Estimate (points)</Label>
              <Input
                id="final-estimate"
                type="number"
                min="1"
                value={finalEstimate}
                onChange={(e) => setFinalEstimate(Number(e.target.value))}
                placeholder="Enter final estimate"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {finalEstimate > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Estimate Summary:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><strong>Points:</strong> {finalEstimate}</div>
                    <div><strong>Hours:</strong> {estimateToHours(finalEstimate)}</div>
                    <div className="col-span-2 text-gray-600">
                      Custom estimate based on team consensus
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Meeting Buffer</Label>
              <Select value={meetingBuffer.toString()} onValueChange={(value) => setMeetingBuffer(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting buffer" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_BUFFER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Iteration Multiplier</Label>
              <Select value={iterationMultiplier.toString()} onValueChange={(value) => setIterationMultiplier(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select iteration multiplier" />
                </SelectTrigger>
                <SelectContent>
                  {ITERATION_MULTIPLIER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {finalEstimate > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Final Calculation</h4>
                <div className="space-y-1 text-sm">
                  <div>Base estimate: {finalEstimate} points</div>
                  <div>Meeting buffer: +{Math.round(finalEstimate * meetingBuffer)} points</div>
                  <div>Iteration multiplier: ×{iterationMultiplier}</div>
                  <div className="font-bold text-lg pt-2 border-t">
                    Total: {Math.round((finalEstimate + (finalEstimate * meetingBuffer)) * iterationMultiplier)} points
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={finalizeEstimate} 
              disabled={finalEstimate <= 0 || isFinalizing}
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isFinalizing ? 'Finalizing...' : 'Finalize Estimate'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
