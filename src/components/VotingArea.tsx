'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CheckCircle, Calculator } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  EFFORT_OPTIONS, 
  SPRINT_OPTIONS, 
  DESIGNER_COUNT_OPTIONS,
  INDIVIDUAL_DESIGNER_LEVELS,
  BREAKPOINT_OPTIONS, 
  FIDELITY_OPTIONS,
  MEETING_BUFFER_OPTIONS,
  ITERATION_MULTIPLIER_OPTIONS,
  calculateEstimate,
  estimateToTShirtSize,
  MAX_POINTS,
  DISCOVERY_ACTIVITY_OPTIONS,
  DISCOVERY_ACTIVITY_MAP,
  DESIGN_TESTING_ACTIVITY_GROUPS,
  DESIGN_TESTING_ACTIVITY_MAP
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
  deliverables: number | null
  meetingBuffer: number | null
  iterationMultiplier: number | null
  discoveryActivities: string[]
  designActivities: string[]
}

const createInitialFactors = (): EstimationFactors => ({
  effort: null,
  time: null,
  sprints: null,
  designerCount: null,
  designerLevels: [],
  breakpoints: null,
  fidelity: null,
  deliverables: null,
  meetingBuffer: null,
  iterationMultiplier: null,
  discoveryActivities: [],
  designActivities: []
})

export default function VotingArea({ 
  taskId, 
  taskTitle, 
  participantId, 
  onVoteSubmitted 
}: VotingAreaProps) {
  const [factors, setFactors] = useState<EstimationFactors>(() => createInitialFactors())
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

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
        const storedFactors = (existingVote.factors || {}) as Partial<EstimationFactors>
        setFactors(prev => ({
          ...prev,
          ...storedFactors,
          designerLevels: Array.isArray(storedFactors.designerLevels) ? storedFactors.designerLevels : prev.designerLevels,
          discoveryActivities: Array.isArray(storedFactors.discoveryActivities) ? storedFactors.discoveryActivities : prev.discoveryActivities,
          designActivities: Array.isArray(storedFactors.designActivities) ? storedFactors.designActivities : prev.designActivities
        }))
        setHasVoted(true)
      }
    } catch (error) {
      console.error('Error checking existing vote:', error)
    }
  }, [taskId, participantId])

  useEffect(() => {
    checkExistingVote()
  }, [checkExistingVote])

  useEffect(() => {
    // Find the portal container in the DOM
    const container = document.getElementById('current-estimate-box')
    setPortalContainer(container)
  }, [])

  // Auto-suggest effort level based on other factors
  useEffect(() => {
    const { sprints, designerCount, breakpoints, fidelity, iterationMultiplier } = factors
    
    // Need at least 3 factors selected to make a suggestion
    const selectedFactorsCount = [sprints, designerCount, breakpoints, fidelity, iterationMultiplier]
      .filter(f => f !== null).length
    
    if (selectedFactorsCount < 3) return

    // Calculate suggested effort based on other factors
    let effortScore = 0
    
    // Sprint contribution (more sprints = higher effort)
    if (sprints !== null) {
      if (sprints <= 0.2) effortScore += 1      // Very Low
      else if (sprints <= 0.5) effortScore += 2 // Low
      else if (sprints <= 1) effortScore += 4   // Medium
      else if (sprints <= 2) effortScore += 8   // High
      else effortScore += 16                    // Very High
    }
    
    // Designer count contribution (more designers = higher complexity)
    if (designerCount !== null) {
      if (designerCount === 1) effortScore += 1
      else if (designerCount === 2) effortScore += 2
      else if (designerCount === 3) effortScore += 4
      else if (designerCount === 4) effortScore += 8
      else effortScore += 16
    }
    
    // Breakpoints contribution (more breakpoints = more effort)
    if (breakpoints !== null) {
      effortScore += breakpoints
    }
    
    // Fidelity contribution (higher fidelity = more effort)
    if (fidelity !== null) {
      effortScore += fidelity
    }
    
    // Iteration multiplier (more iterations = more effort)
    if (iterationMultiplier !== null && iterationMultiplier > 1) {
      effortScore += iterationMultiplier * 2
    }
    
    // Map the score to effort level (1, 2, 4, 8, 16)
    let suggestedEffort = 1 // Default to Very Low
    if (effortScore <= 5) suggestedEffort = 1      // Very Low
    else if (effortScore <= 10) suggestedEffort = 2  // Low
    else if (effortScore <= 20) suggestedEffort = 4  // Medium
    else if (effortScore <= 35) suggestedEffort = 8  // High
    else suggestedEffort = 16                        // Very High
    
    // Always update effort to the suggested value (dynamic)
    setFactors(prev => ({ ...prev, effort: suggestedEffort }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factors.sprints, factors.designerCount, factors.breakpoints, factors.fidelity, factors.iterationMultiplier])

  // Auto-suggest sprint allocation based on effort and other factors
  useEffect(() => {
    const { effort, designerCount, breakpoints, fidelity, iterationMultiplier } = factors
    
    // Need effort and at least 2 other factors selected to make a suggestion
    if (effort === null) return
    
    const selectedFactorsCount = [designerCount, breakpoints, fidelity, iterationMultiplier]
      .filter(f => f !== null).length
    
    if (selectedFactorsCount < 2) return

    // Calculate suggested sprint allocation based on effort and other factors
    let sprintScore = 0
    
    // Effort contribution (higher effort = more sprints needed)
    if (effort === 1) sprintScore += 0.1      // Very Low -> 0.1 sprint
    else if (effort === 2) sprintScore += 0.2 // Low -> 0.2 sprint
    else if (effort === 4) sprintScore += 0.5 // Medium -> 0.5 sprint
    else if (effort === 8) sprintScore += 1   // High -> 1 sprint
    else sprintScore += 1.5                   // Very High -> 1.5 sprints
    
    // Designer count contribution (more designers = slightly more sprints for coordination)
    if (designerCount !== null) {
      if (designerCount >= 3) sprintScore += 0.2
      if (designerCount >= 4) sprintScore += 0.2
    }
    
    // Breakpoints contribution (more breakpoints = more sprints)
    if (breakpoints !== null) {
      sprintScore += (breakpoints - 1) * 0.1
    }
    
    // Fidelity contribution (higher fidelity = more sprints)
    if (fidelity !== null) {
      if (fidelity >= 3) sprintScore += 0.3
      if (fidelity >= 8) sprintScore += 0.2
    }
    
    // Iteration multiplier (more iterations = more sprints)
    if (iterationMultiplier !== null && iterationMultiplier > 1) {
      sprintScore += (iterationMultiplier - 1) * 0.3
    }
    
    // Map the score to sprint allocation (0.1, 0.2, 0.5, 1, 1.5, 2, 3)
    let suggestedSprints = 0.1 // Default to 0.1 sprint
    if (sprintScore <= 0.15) suggestedSprints = 0.1
    else if (sprintScore <= 0.35) suggestedSprints = 0.2
    else if (sprintScore <= 0.75) suggestedSprints = 0.5
    else if (sprintScore <= 1.25) suggestedSprints = 1
    else if (sprintScore <= 1.75) suggestedSprints = 1.5
    else if (sprintScore <= 2.5) suggestedSprints = 2
    else suggestedSprints = 3
    
    // Always update sprints to the suggested value (dynamic)
    setFactors(prev => ({ ...prev, sprints: suggestedSprints }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factors.effort, factors.designerCount, factors.breakpoints, factors.fidelity, factors.iterationMultiplier])

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
      sprints: factors.sprints!,
      designerCount: factors.designerCount!,
      designerLevels: factors.designerLevels,
      breakpoints: factors.breakpoints!,
      fidelity: factors.fidelity!,
      meetingBuffer: factors.meetingBuffer || 0,
      iterationMultiplier: factors.iterationMultiplier || 1,
      discoveryActivities: factors.discoveryActivities,
      designActivities: factors.designActivities
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
      toast.success('Estimate submitted successfully!')
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
      toast.error(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }


  const calculateOptionPoints = (
    factorType: keyof EstimationFactors | 'activity',
    value: number,
    impact?: number
  ): number => {
    // Use default/average values for other factors to calculate contribution
    const defaultEffort = 4 // Medium
    const defaultSprints = 0.5 // Half sprint
    const defaultBreakpoints = 2 // Desktop + Mobile
    const defaultFidelity = 3 // Hi-fi
    const defaultDesignerCount = 1
    const defaultDesignerLevels = [2] // Senior
    const defaultMeetingBuffer = 0
    const defaultIterationMultiplier = 1
    const defaultDiscoveryActivities: string[] = []
    const defaultDesignActivities: string[] = []

    // Calculate estimate with this option and defaults
    let estimateWithOption: number
    let estimateWithoutOption: number

    if (factorType === 'effort') {
      estimateWithOption = calculateEstimate({
        effort: value,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else if (factorType === 'sprints') {
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: value,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else if (factorType === 'breakpoints') {
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: value,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else if (factorType === 'fidelity') {
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: value,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else if (factorType === 'designerCount') {
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: value,
        designerLevels: Array(value).fill(2), // Senior level
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else if (factorType === 'meetingBuffer') {
      const baseEstimate = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: 0,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: value,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = baseEstimate
    } else if (factorType === 'iterationMultiplier') {
      const baseEstimate = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: 1,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: value,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
      estimateWithoutOption = baseEstimate
    } else if (factorType === 'activity' && impact !== undefined) {
      // For activities, calculate the actual contribution to the estimate
      const isDiscovery = DISCOVERY_ACTIVITY_OPTIONS.some(opt => opt.impact === impact)
      const activityId = isDiscovery 
        ? DISCOVERY_ACTIVITY_OPTIONS.find(opt => opt.impact === impact)?.id || ''
        : DESIGN_TESTING_ACTIVITY_GROUPS.flatMap(g => g.options).find(opt => opt.impact === impact)?.id || ''
      
      if (!activityId) return 0

      const activitiesWith = isDiscovery 
        ? [activityId]
        : [activityId]
      
      estimateWithOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: isDiscovery ? activitiesWith : defaultDiscoveryActivities,
        designActivities: isDiscovery ? defaultDesignActivities : activitiesWith
      })
      estimateWithoutOption = calculateEstimate({
        effort: defaultEffort,
        sprints: defaultSprints,
        designerCount: defaultDesignerCount,
        designerLevels: defaultDesignerLevels,
        breakpoints: defaultBreakpoints,
        fidelity: defaultFidelity,
        meetingBuffer: defaultMeetingBuffer,
        iterationMultiplier: defaultIterationMultiplier,
        discoveryActivities: defaultDiscoveryActivities,
        designActivities: defaultDesignActivities
      })
    } else {
      return 0
    }

    return Math.max(0, Math.round(estimateWithOption - estimateWithoutOption))
  }

  const renderFactorSelector = (
    title: string,
    factorType: keyof EstimationFactors,
    options: Array<{ value: number; label: string; description: string }>
  ) => {
    const selectedValue = factors[factorType]
    const isEffortSelector = factorType === 'effort'
    const isSprintSelector = factorType === 'sprints'
    const isSuggested = (isEffortSelector || isSprintSelector) && selectedValue !== null
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm flex items-center gap-2">
          {title} <span className="text-red-500">*</span>
          {isSuggested && (
            <span className="text-xs text-blue-600 font-normal">
              (Suggested based on your selections)
            </span>
          )}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {options.map((option) => {
            const points = calculateOptionPoints(factorType, option.value)
            return (
              <Button
                key={option.value}
                variant={selectedValue === option.value ? "default" : "outline"}
                size="sm"
                className="h-auto p-3 flex flex-col items-start text-left min-h-[60px] break-words relative"
                onClick={() => updateFactor(factorType, option.value)}
              >
                {points > 0 && (
                  <span className="absolute top-1 right-1 text-[9px] font-medium text-slate-500">
                    {points}pts
                  </span>
                )}
                <div className="font-medium text-xs leading-tight">{option.label}</div>
                <div className="text-xs opacity-70 mt-1 leading-tight break-words">{option.description}</div>
              </Button>
            )
          })}
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
            {DESIGNER_COUNT_OPTIONS.map((option) => {
              const points = calculateOptionPoints('designerCount', option.value)
              return (
                <Button
                  key={option.value}
                  variant={factors.designerCount === option.value ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center text-center relative"
                  onClick={() => updateDesignerCount(option.value)}
                >
                  {points > 0 && (
                    <span className="absolute top-1 right-1 text-[9px] font-medium text-slate-500">
                      {points}pts
                    </span>
                  )}
                  <div className="font-medium text-xs">{option.label}</div>
                </Button>
              )
            })}
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

  const toggleActivity = (factorType: 'discoveryActivities' | 'designActivities', activityId: string) => {
    setFactors(prev => {
      const currentSelections = prev[factorType]
      const exists = currentSelections.includes(activityId)
      const updatedSelections = exists
        ? currentSelections.filter(id => id !== activityId)
        : [...currentSelections, activityId]
      return { ...prev, [factorType]: updatedSelections }
    })
  }

  const renderDiscoveryActivities = () => {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Discovery Activities</h4>
        <p className="text-xs text-slate-500">Select the discovery work this task requires</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DISCOVERY_ACTIVITY_OPTIONS.map(option => {
            const isSelected = factors.discoveryActivities.includes(option.id)
            const points = calculateOptionPoints('activity', 0, option.impact)
            return (
              <Button
                key={option.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className="h-auto p-3 flex flex-col items-start text-left min-h-[60px] break-words relative"
                onClick={() => toggleActivity('discoveryActivities', option.id)}
              >
                {points > 0 && (
                  <span className="absolute top-1 right-1 text-[9px] font-medium text-slate-500">
                    {points}pts
                  </span>
                )}
                <div className="font-medium text-xs leading-tight">{option.label}</div>
                <div className="text-xs opacity-70 mt-1 leading-tight break-words">{option.description}</div>
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDesignTestingActivities = () => {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Design &amp; Testing Activities</h4>
        <p className="text-xs text-slate-500">Capture the level of design execution involved</p>
        {DESIGN_TESTING_ACTIVITY_GROUPS.map(group => (
          <div key={group.title} className="space-y-2">
            <div className="text-sm font-medium text-slate-700">{group.title}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.options.map(option => {
                const isSelected = factors.designActivities.includes(option.id)
                const points = calculateOptionPoints('activity', 0, option.impact)
                return (
                  <Button
                    key={option.id}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto p-3 flex flex-col items-start text-left min-h-[60px] break-words relative"
                    onClick={() => toggleActivity('designActivities', option.id)}
                  >
                    {points > 0 && (
                      <span className="absolute top-1 right-1 text-[9px] font-medium text-slate-500">
                        {points}pts
                      </span>
                    )}
                    <div className="font-medium text-xs leading-tight">{option.label}</div>
                    <div className="text-xs opacity-70 mt-1 leading-tight break-words">{option.description}</div>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderActivitySummary = (title: string, selections: string[], map: Record<string, { label: string }>) => {
    if (!selections.length) return null
    return (
      <div>
        <strong>{title}:</strong>
        <div className="mt-1 flex flex-wrap gap-2">
          {selections.map(selection => (
            <span
              key={selection}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
            >
              {map[selection]?.label || selection}
            </span>
          ))}
        </div>
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
            <div><strong>Final Estimate:</strong> {finalEstimate ? estimateToTShirtSize(finalEstimate) : 'Not set'}</div>
          </div>
          <div className="space-y-3 text-sm">
            {renderActivitySummary('Discovery', factors.discoveryActivities, DISCOVERY_ACTIVITY_MAP)}
            {renderActivitySummary('Design & Testing', factors.designActivities, DESIGN_TESTING_ACTIVITY_MAP)}
          </div>
          
        </CardContent>
      </Card>
    )
  }

  const currentEstimate = getCurrentEstimate()
  const hoursEstimate = currentEstimate ? estimateToTShirtSize(currentEstimate) : 'Complete all factors'

  // Current Estimate Component to be portaled to sidebar
  const currentEstimateBox = (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span className="text-blue-900">Current Estimate</span>
        </CardTitle>
        <CardDescription className="text-xs text-blue-700/80 truncate">
          Estimating: {taskTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {currentEstimate ? `${currentEstimate}` : '—'}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {currentEstimate ? 'points' : ''}
          </div>
          {currentEstimate && currentEstimate >= MAX_POINTS && (
            <div className="text-xs text-amber-600 mt-1 font-medium">
              (Capped at {MAX_POINTS} points)
            </div>
          )}
          <div className="text-sm font-medium text-blue-800 mt-2">{hoursEstimate}</div>
        </div>

        {/* Submit Button - Only show when estimation is complete */}
        {isEstimationComplete() && (
          <Button 
            onClick={submitVote} 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Estimate'}
          </Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <>
      {/* Portal the estimate box to sidebar if container exists */}
      {portalContainer && createPortal(currentEstimateBox, portalContainer)}
      
      <Card>
        <CardHeader>
          <CardTitle>Estimate Task</CardTitle>
          <CardDescription>
            Select factors for: <span className="font-medium">&ldquo;{taskTitle}&rdquo;</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

        {/* Factor Selectors */}
        <div className="space-y-6">
          {renderDiscoveryActivities()}
          {renderDesignTestingActivities()}
          {renderDesignerSelector()}
          {renderFactorSelector('Breakpoints', 'breakpoints', BREAKPOINT_OPTIONS)}
          {renderFactorSelector('Fidelity Level', 'fidelity', FIDELITY_OPTIONS)}
          {renderFactorSelector('Meeting Buffer', 'meetingBuffer', MEETING_BUFFER_OPTIONS)}
          {renderFactorSelector('Design Iterations', 'iterationMultiplier', ITERATION_MULTIPLIER_OPTIONS)}
          {renderFactorSelector('Effort Level', 'effort', EFFORT_OPTIONS)}
          {renderFactorSelector('Sprint Allocation', 'sprints', SPRINT_OPTIONS)}
        </div>
      </CardContent>
    </Card>
    </>
  )
}