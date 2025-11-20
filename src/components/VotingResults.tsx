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
  estimateToTShirtSize,
  calculateEstimate,
  DISCOVERY_ACTIVITY_MAP,
  DESIGN_TESTING_ACTIVITY_MAP
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
  discoveryActivities?: string[]
  designActivities?: string[]
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

  const formatActivities = (activityIds?: string[], map?: Record<string, { label: string }>) => {
    if (!activityIds || !activityIds.length || !map) return ''
    const uniqueIds = Array.from(new Set(activityIds))
    return uniqueIds.map(id => map[id]?.label || id).join(', ')
  }

  const toNumberArray = (value: unknown, fallback: number[] = []) => {
    if (!Array.isArray(value)) return fallback
    const numbers = value.filter((item): item is number => typeof item === 'number' && !Number.isNaN(item))
    return numbers.length ? numbers : fallback
  }

  const toStringArray = (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value.filter((item): item is string => typeof item === 'string')
  }

  const generateMarkdownSummary = () => {
    const estimates = votes.map(vote => {
      if (vote.factors && typeof vote.factors === 'object') {
        const factors = vote.factors as VoteFactors
        const baseEstimate = factors.time || 1
        const designerTotal = factors.designerCount || factors.designers || 1
        const complexityMultiplier = (factors.effort + factors.sprints + designerTotal + factors.breakpoints + factors.fidelity) / 5
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
      const discoverySummary = formatActivities(factors.discoveryActivities, DISCOVERY_ACTIVITY_MAP)
      if (discoverySummary) markdown += `- **Discovery:** ${discoverySummary}\n`
      const designSummary = formatActivities(factors.designActivities, DESIGN_TESTING_ACTIVITY_MAP)
      if (designSummary) markdown += `- **Design & Testing:** ${designSummary}\n`
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
      // Calculate the average estimate using the improved calculateEstimate function
      const estimates = votes.map(vote => {
        if (vote.factors && typeof vote.factors === 'object') {
          const factors = vote.factors as Record<string, number | number[] | string[]>
          // Use the same calculation as VotingArea
          return calculateEstimate({
            effort: (typeof factors.effort === 'number' ? factors.effort : 1),
            sprints: (typeof factors.sprints === 'number' ? factors.sprints : 0.1),
            designerCount: (typeof factors.designerCount === 'number' ? factors.designerCount : 1),
            designerLevels: toNumberArray(factors.designerLevels, [1]),
            breakpoints: (typeof factors.breakpoints === 'number' ? factors.breakpoints : 1),
            fidelity: (typeof factors.fidelity === 'number' ? factors.fidelity : 1),
            meetingBuffer: (typeof factors.meetingBuffer === 'number' ? factors.meetingBuffer : 0),
            iterationMultiplier: (typeof factors.iterationMultiplier === 'number' ? factors.iterationMultiplier : 1),
            discoveryActivities: toStringArray(factors.discoveryActivities),
            designActivities: toStringArray(factors.designActivities)
          })
        }
        return vote.value || 0
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

  // Calculate statistics using the improved calculateEstimate function
  const estimates = votes.map(vote => {
    if (vote.factors && typeof vote.factors === 'object') {
      const factors = vote.factors as Record<string, number | number[] | string[]>
      // Use the same calculation as VotingArea
      return calculateEstimate({
        effort: (typeof factors.effort === 'number' ? factors.effort : 1),
        sprints: (typeof factors.sprints === 'number' ? factors.sprints : 0.1),
        designerCount: (typeof factors.designerCount === 'number' ? factors.designerCount : 1),
        designerLevels: toNumberArray(factors.designerLevels, [1]),
        breakpoints: (typeof factors.breakpoints === 'number' ? factors.breakpoints : 1),
        fidelity: (typeof factors.fidelity === 'number' ? factors.fidelity : 1),
        meetingBuffer: (typeof factors.meetingBuffer === 'number' ? factors.meetingBuffer : 0),
        iterationMultiplier: (typeof factors.iterationMultiplier === 'number' ? factors.iterationMultiplier : 1),
        discoveryActivities: toStringArray(factors.discoveryActivities),
        designActivities: toStringArray(factors.designActivities)
      })
    }
    return vote.value || 0
  })

  const averageEstimate = estimates.length > 0 ? Math.round(estimates.reduce((sum, est) => sum + est, 0) / estimates.length) : 0
  const minEstimate = estimates.length > 0 ? Math.min(...estimates) : 0
  const maxEstimate = estimates.length > 0 ? Math.max(...estimates) : 0

  const summaryCards = [
    { label: 'Minimum', value: estimateToTShirtSize(minEstimate), sublabel: `${minEstimate} pts` },
    { label: 'Average', value: estimateToTShirtSize(averageEstimate), sublabel: `${averageEstimate} pts`, highlight: true },
    { label: 'Maximum', value: estimateToTShirtSize(maxEstimate), sublabel: `${maxEstimate} pts` },
    { label: 'Participants', value: votes.length, sublabel: 'completed votes' }
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Voting results · {taskTitle}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              All {votes.length} participants finished estimating
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
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
                  Copy summary
                </>
              )}
            </Button>
            {isModerator && (
              <Button
                onClick={completeTask}
                disabled={isCompleting}
                size="sm"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle className="w-4 h-4" />
                {isCompleting ? 'Completing...' : 'Complete task'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(card => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className={`text-2xl font-semibold text-slate-900 ${card.highlight ? 'text-emerald-600' : ''}`}>
                {card.value}
              </p>
              <p className="text-xs text-slate-500">{card.sublabel}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Voting breakdown</h3>
              <p className="text-xs text-slate-500">Each participant’s rationale grouped by scope, team and execution</p>
            </div>
            <Badge className="w-fit bg-slate-100 text-slate-700">
              {votes.length} {votes.length === 1 ? 'vote' : 'votes'}
            </Badge>
          </div>

          <div className="grid gap-4">
            {votes.map((vote) => {
              const factors = vote.factors as VoteFactors
              const estimate = estimates[votes.indexOf(vote)]

              const discoveryActivities = (factors.discoveryActivities || []).filter(id => id !== 'discovery')

              const scopeItems = [
                { label: 'Effort', value: getFactorLabel('effort', factors.effort) },
                factors.time && { label: 'Time', value: getFactorLabel('time', factors.time) },
                { label: 'Sprints', value: getFactorLabel('sprints', factors.sprints) },
                { label: 'Breakpoints', value: getFactorLabel('breakpoints', factors.breakpoints) },
                { label: 'Fidelity', value: getFactorLabel('fidelity', factors.fidelity) }
              ].filter(Boolean) as { label: string, value: string }[]

              const teamItems = [
                (factors.designerCount || factors.designers) && {
                  label: 'Designers',
                  value: getFactorLabel('designerCount', factors.designerCount || factors.designers || 0)
                },
                factors.designerLevels && factors.designerLevels.length > 0 && {
                  label: 'Designer levels',
                  value: getDesignerLevels(factors.designerLevels)
                }
              ].filter(Boolean) as { label: string, value: string }[]

              const deliveryItems = [
                factors.meetingBuffer && { label: 'Buffer', value: getFactorLabel('meetingBuffer', factors.meetingBuffer) },
                factors.iterationMultiplier && { label: 'Iterations', value: getFactorLabel('iterationMultiplier', factors.iterationMultiplier) }
              ].filter(Boolean) as { label: string, value: string }[]

              const activityItems = [
                discoveryActivities.length > 0 && {
                  label: 'Discovery',
                  value: formatActivities(discoveryActivities, DISCOVERY_ACTIVITY_MAP)
                },
                factors.designActivities && factors.designActivities.length > 0 && {
                  label: 'Design & testing',
                  value: formatActivities(factors.designActivities, DESIGN_TESTING_ACTIVITY_MAP)
                }
              ].filter(Boolean) as { label: string, value: string }[]

              const grouped = [
                { title: 'Scope & complexity', items: scopeItems },
                { title: 'Team setup', items: teamItems },
                { title: 'Execution buffers', items: deliveryItems },
                { title: 'Activities', items: activityItems }
              ].filter(group => group.items.length > 0)

              return (
                <article
                  key={vote.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 sm:p-5"
                >
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900 break-words">
                        {getParticipantName(vote.participant_id)}
                      </p>
                    </div>
                    <Badge className="w-fit bg-emerald-50 text-emerald-700">
                      {estimateToTShirtSize(estimate)}
                    </Badge>
                  </header>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {grouped.map((group) => (
                      <div key={group.title} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {group.title}
                        </p>
                        <div className="mt-2 space-y-1.5">
                          {group.items.map(item => (
                            <div
                              key={`${group.title}-${item.label}`}
                              className="flex flex-col gap-0.5 text-sm text-slate-600"
                            >
                              <span className="text-xs uppercase tracking-wide text-slate-500">{item.label}</span>
                              <span className="font-medium text-slate-900 break-words">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
