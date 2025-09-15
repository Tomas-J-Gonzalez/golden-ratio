'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, RotateCcw, Calculator } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  EFFORT_OPTIONS, 
  SPRINT_OPTIONS, 
  DESIGNER_COUNT_OPTIONS,
  DESIGNER_LEVEL_OPTIONS,
  BREAKPOINT_OPTIONS, 
  FIDELITY_OPTIONS,
  calculateEstimate,
  estimateToHours
} from '@/lib/constants'

interface VotingAreaProps {
  taskId: string
  taskTitle: string
  participantId: string
  onVoteSubmitted: () => void
}

interface EstimationFactors {
  effort: number | null
  sprints: number | null
  designerCount: number | null
  designerLevel: number | null
  breakpoints: number | null
  fidelity: number | null
}

export default function VotingArea({ 
  taskId, 
  taskTitle, 
  participantId, 
  onVoteSubmitted 
}: VotingAreaProps) {
  const [factors, setFactors] = useState<EstimationFactors>({
    effort: null,
    sprints: null,
    designerCount: null,
    designerLevel: null,
    breakpoints: null,
    fidelity: null
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

  const isEstimationComplete = () => {
    return Object.values(factors).every(value => value !== null)
  }

  const getCurrentEstimate = () => {
    if (!isEstimationComplete()) return null
    return calculateEstimate({
      effort: factors.effort!,
      sprints: factors.sprints!,
      designerCount: factors.designerCount!,
      designerLevel: factors.designerLevel!,
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

  const changeVote = () => {
    setHasVoted(false)
    setFactors({
      effort: null,
      sprints: null,
      designerCount: null,
      designerLevel: null,
      breakpoints: null,
      fidelity: null
    })
  }

  const renderFactorSelector = (
    title: string,
    factorType: keyof EstimationFactors,
    options: Array<{ value: number; label: string; description: string }>
  ) => {
    const selectedValue = factors[factorType]
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selectedValue === option.value ? "default" : "outline"}
              size="sm"
              className="h-auto p-3 flex flex-col items-start text-left"
              onClick={() => updateFactor(factorType, option.value)}
            >
              <div className="font-medium text-xs">{option.label}</div>
              <div className="text-xs opacity-70 mt-1">{option.description}</div>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (hasVoted) {
    const finalEstimate = getCurrentEstimate()
    const hoursEstimate = finalEstimate ? estimateToHours(finalEstimate) : 'Unknown'
    
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
              <div className="text-2xl font-bold text-green-600">{finalEstimate} points</div>
              <div className="text-sm text-green-700">{hoursEstimate}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Effort:</strong> {EFFORT_OPTIONS.find(o => o.value === factors.effort)?.label}</div>
            <div><strong>Sprints:</strong> {SPRINT_OPTIONS.find(o => o.value === factors.sprints)?.label}</div>
            <div><strong>Designers:</strong> {DESIGNER_COUNT_OPTIONS.find(o => o.value === factors.designerCount)?.label} ({DESIGNER_LEVEL_OPTIONS.find(o => o.value === factors.designerLevel)?.label})</div>
            <div><strong>Breakpoints:</strong> {BREAKPOINT_OPTIONS.find(o => o.value === factors.breakpoints)?.label}</div>
            <div><strong>Fidelity:</strong> {FIDELITY_OPTIONS.find(o => o.value === factors.fidelity)?.label}</div>
          </div>
          
          <Button variant="outline" onClick={changeVote} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Change Vote
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentEstimate = getCurrentEstimate()
  const hoursEstimate = currentEstimate ? estimateToHours(currentEstimate) : 'Complete all factors'

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
          {renderFactorSelector('Sprint Allocation', 'sprints', SPRINT_OPTIONS)}
          {renderFactorSelector('Number of Designers', 'designerCount', DESIGNER_COUNT_OPTIONS)}
          {renderFactorSelector('Designer Level', 'designerLevel', DESIGNER_LEVEL_OPTIONS)}
          {renderFactorSelector('Breakpoints', 'breakpoints', BREAKPOINT_OPTIONS)}
          {renderFactorSelector('Fidelity Level', 'fidelity', FIDELITY_OPTIONS)}
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