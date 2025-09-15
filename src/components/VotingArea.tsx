'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Calculator } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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
  calculateEstimate,
  estimateToTShirtSize
} from '@/lib/constants'

interface VotingAreaProps {
  taskId: string
  taskTitle: string
  participantId: string
  onVoteSubmitted: () => void
}

interface EstimationFactors {
  effort: number | null
  time: number | null
  sprints: number | null
  designerCount: number | null
  designerLevels: number[] // Array of designer levels
  breakpoints: number | null
  fidelity: number | null
  meetingBuffer: number | null
  iterationMultiplier: number | null
  finalEstimate: number | null
}

export default function VotingArea({ 
  taskId, 
  taskTitle, 
  participantId, 
  onVoteSubmitted 
}: VotingAreaProps) {
  const [factors, setFactors] = useState<EstimationFactors>({
    effort: null,
    time: null,
    sprints: null,
    designerCount: null,
    designerLevels: [],
    breakpoints: null,
    fidelity: null,
    meetingBuffer: null,
    iterationMultiplier: null,
    finalEstimate: null
  })
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkExistingVote = useCallback(async () => {
    try {
      // Check for existing vote in Supabase
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('task_id', taskId)
        .eq('participant_id', participantId)
        .single()

      if (existingVote) {
        setFactors(existingVote.factors || {})
        setHasVoted(true)
      }
    } catch (error) {
      console.error('Error checking existing vote:', error)
    }
  }, [taskId, participantId])

  useEffect(() => {
    checkExistingVote()
  }, [checkExistingVote])

  const updateFactor = (factorType: keyof EstimationFactors, value: number) => {
    setFactors(prev => ({
      ...prev,
      [factorType]: value
    }))
  }

  const updateDesignerCount = (count: number) => {
    setFactors(prev => {
      const newDesignerLevels = Array(count).fill(1) // Initialize with Junior level
      return { ...prev, designerCount: count, designerLevels: newDesignerLevels }
    })
  }

  const updateDesignerLevel = (index: number, level: number) => {
    setFactors(prev => {
      const newDesignerLevels = [...prev.designerLevels]
      newDesignerLevels[index] = level
      return { ...prev, designerLevels: newDesignerLevels }
    })
  }

  const isEstimationComplete = () => {
    return factors.effort !== null &&
           factors.time !== null &&
           factors.sprints !== null &&
           factors.designerCount !== null &&
           factors.designerLevels.length === factors.designerCount &&
           factors.breakpoints !== null &&
           factors.fidelity !== null &&
           factors.meetingBuffer !== null &&
           factors.iterationMultiplier !== null
  }

  const getCurrentEstimate = () => {
    if (!isEstimationComplete()) return null
    return calculateEstimate({
      effort: factors.effort!,
      time: factors.time!,
      sprints: factors.sprints!,
      designerCount: factors.designerCount!,
      designerLevels: factors.designerLevels,
      breakpoints: factors.breakpoints!,
      fidelity: factors.fidelity!
    })
  }

  const submitVote = async () => {
    if (!isEstimationComplete()) return

    setIsSubmitting(true)
    const finalEstimate = getCurrentEstimate()!
    console.log('Submitting vote with:', { taskId, participantId, finalEstimate, factors })
    
    try {
      // Submit vote to Supabase
      const { error } = await supabase
        .from('votes')
        .upsert({
          task_id: taskId,
          participant_id: participantId,
          value: finalEstimate,
          factors: factors
        })

      if (error) throw error

      setHasVoted(true)
      onVoteSubmitted()
    } catch (error) {
      console.error('Error submitting vote:', error)
      console.error('Error details:', {
        taskId,
        participantId,
        finalEstimate,
        factors,
        error: error instanceof Error ? error.message : error
      })
      alert(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }


  const renderFactorSelector = (
    title: string,
    factorType: keyof EstimationFactors,
    options: Array<{ value: number; label: string; description: string }>
  ) => {
    const selectedValue = factors[factorType]
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">
          {title} <span className="text-red-500">*</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selectedValue === option.value ? "default" : "outline"}
              size="sm"
              className="h-auto p-3 flex flex-col items-start text-left min-h-[60px] break-words"
              onClick={() => updateFactor(factorType, option.value)}
            >
              <div className="font-medium text-xs leading-tight">{option.label}</div>
              <div className="text-xs opacity-70 mt-1 leading-tight break-words">{option.description}</div>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  const renderDesignerSelector = () => {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">
          Designers <span className="text-red-500">*</span>
        </h4>
        
        {/* Designer Count Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Number of Designers</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DESIGNER_COUNT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={factors.designerCount === option.value ? "default" : "outline"}
                size="sm"
                className="h-auto p-2 flex flex-col items-center text-center"
                onClick={() => updateDesignerCount(option.value)}
              >
                <div className="font-medium text-xs">{option.label}</div>
              </Button>
            ))}
          </div>
        </div>

        {/* Individual Designer Level Assignment */}
        {factors.designerCount && factors.designerCount > 0 && (
          <div className="space-y-2">
            <Label className="text-xs">Assign Level to Each Designer</Label>
            <div className="space-y-2">
              {Array.from({ length: factors.designerCount }, (_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-16">Designer {index + 1}:</span>
                  <div className="flex gap-1 flex-wrap">
                    {INDIVIDUAL_DESIGNER_LEVELS.map((level) => (
                      <Button
                        key={level.value}
                        variant={factors.designerLevels[index] === level.value ? "default" : "outline"}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => updateDesignerLevel(index, level.value)}
                      >
                        {level.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (hasVoted) {
    const finalEstimate = getCurrentEstimate()
    const tShirtEstimate = finalEstimate ? estimateToTShirtSize(finalEstimate) : 'Unknown'
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Vote Submitted
          </CardTitle>
          <CardDescription>
            Your estimate for &ldquo;{taskTitle}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tShirtEstimate}</div>
              <div className="text-sm text-green-700">Final Estimate</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Effort:</strong> {EFFORT_OPTIONS.find(o => o.value === factors.effort)?.label}</div>
            <div><strong>Time:</strong> {TIME_OPTIONS.find(o => o.value === factors.time)?.label}</div>
            <div><strong>Sprints:</strong> {SPRINT_OPTIONS.find(o => o.value === factors.sprints)?.label}</div>
            <div className="col-span-2">
              <strong>Designers:</strong> {factors.designerCount} designer{factors.designerCount !== 1 ? 's' : ''}
              {factors.designerLevels.length > 0 && (
                <div className="mt-1 text-xs">
                  {factors.designerLevels.map((level, index) => (
                    <span key={index} className="inline-block mr-2">
                      Designer {index + 1}: {INDIVIDUAL_DESIGNER_LEVELS.find(l => l.value === level)?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div><strong>Breakpoints:</strong> {BREAKPOINT_OPTIONS.find(o => o.value === factors.breakpoints)?.label}</div>
            <div><strong>Fidelity:</strong> {FIDELITY_OPTIONS.find(o => o.value === factors.fidelity)?.label}</div>
            <div><strong>Meeting Buffer:</strong> {MEETING_BUFFER_OPTIONS.find(o => o.value === factors.meetingBuffer)?.label}</div>
            <div><strong>Design Iterations:</strong> {ITERATION_MULTIPLIER_OPTIONS.find(o => o.value === factors.iterationMultiplier)?.label}</div>
            <div><strong>Final Estimate:</strong> {factors.finalEstimate ? estimateToTShirtSize(factors.finalEstimate) : 'Not set'}</div>
          </div>
          
        </CardContent>
      </Card>
    )
  }

  const currentEstimate = getCurrentEstimate()
  const hoursEstimate = currentEstimate ? estimateToTShirtSize(currentEstimate) : 'Complete all factors'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Task</CardTitle>
        <CardDescription>
          Select factors for: <span className="font-medium">&ldquo;{taskTitle}&rdquo;</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Estimate Display */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Current Estimate</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {currentEstimate ? `${currentEstimate} points` : 'Incomplete'}
            </div>
            <div className="text-sm text-blue-700">{hoursEstimate}</div>
          </div>
        </div>

        {/* Factor Selectors */}
        <div className="space-y-6">
          {renderFactorSelector('Effort Level', 'effort', EFFORT_OPTIONS)}
          {renderFactorSelector('Time Estimation', 'time', TIME_OPTIONS)}
          {renderFactorSelector('Sprint Allocation', 'sprints', SPRINT_OPTIONS)}
          {renderDesignerSelector()}
          {renderFactorSelector('Breakpoints', 'breakpoints', BREAKPOINT_OPTIONS)}
          {renderFactorSelector('Fidelity Level', 'fidelity', FIDELITY_OPTIONS)}
          {renderFactorSelector('Meeting Buffer', 'meetingBuffer', MEETING_BUFFER_OPTIONS)}
          {renderFactorSelector('Design Iterations', 'iterationMultiplier', ITERATION_MULTIPLIER_OPTIONS)}
        </div>

        {/* Final Estimate Input */}
        <div className="space-y-2">
          <Label htmlFor="final-estimate">Final Estimate (t-shirt size)</Label>
          <Input
            id="final-estimate"
            type="number"
            min="1"
            value={factors.finalEstimate || ''}
            onChange={(e) => setFactors(prev => ({ ...prev, finalEstimate: Number(e.target.value) || null }))}
            placeholder="Enter final estimate"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {factors.finalEstimate && factors.finalEstimate > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium mb-2">Estimate Summary:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Size:</strong> {estimateToTShirtSize(factors.finalEstimate)}</div>
                <div><strong>Value:</strong> {factors.finalEstimate}</div>
                <div className="col-span-2 text-gray-600">
                  Final estimate based on all factors
                </div>
              </div>
            </div>
          )}
        </div>
        
        {isEstimationComplete() && (
          <div className="pt-4 border-t">
            <Button 
              onClick={submitVote} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Estimate'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}