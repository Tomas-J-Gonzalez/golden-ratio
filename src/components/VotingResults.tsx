'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check, CheckCircle, EyeOff } from 'lucide-react'
import { Vote, Participant, supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { POINT_OPTIONS } from '@/lib/constants'

interface VotingResultsProps {
  taskTitle: string
  taskId: string
  votes: Vote[]
  participants: Participant[]
  isModerator: boolean
  onTaskCompleted?: () => void
  onHideVotes?: () => void
}

export default function VotingResults({ taskTitle, taskId, votes, participants, isModerator, onTaskCompleted, onHideVotes }: VotingResultsProps) {
  const [copied, setCopied] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    return participant ? participant.nickname : 'Unknown'
  }

  // Check if vote is skipped
  const isSkippedVote = (vote: Vote) => {
    if (vote.value === -1) return true
    const factors = vote.factors as { skipped?: boolean } | undefined
    return factors?.skipped === true
  }

  // Get emoji for skipped vote
  const getEmojiForSkippedVote = (vote: Vote) => {
    const factors = vote.factors as { 
      skipped?: boolean
      wantsCoffeeBreak?: boolean
      taskTooBig?: boolean
      scopeUnclear?: boolean
    } | undefined
    
    if (factors?.wantsCoffeeBreak) return '☕'
    if (factors?.taskTooBig) return '∞'
    if (factors?.scopeUnclear) return '❓'
    return null
  }

  // Filter out skipped votes for calculations
  const nonSkippedVotes = votes.filter(vote => !isSkippedVote(vote))
  const skippedVotes = votes.filter(vote => isSkippedVote(vote))

  // Get point values directly from votes (no calculation needed)
  const pointValues = nonSkippedVotes.map(vote => vote.value || 0).filter(v => v > 0)
  
  // Calculate average, preserving one decimal place for values like 0.5, 1.5, etc.
  const averageEstimate = pointValues.length > 0 
    ? Math.round((pointValues.reduce((sum, val) => sum + val, 0) / pointValues.length) * 10) / 10
    : 0
  // Format display values (remove trailing zeros for whole numbers, keep one decimal for decimals)
  const formatPointValue = (value: number): string => {
    if (value % 1 === 0) return value.toString()
    return value.toFixed(1)
  }

  const getSuggestedScore = (): number => {
    if (pointValues.length === 0) {
      return POINT_OPTIONS[0].value
    }
    const target = averageEstimate
    let closest = POINT_OPTIONS[0].value
    let minDiff = Math.abs(target - closest)
    POINT_OPTIONS.forEach(option => {
      const diff = Math.abs(target - option.value)
      if (diff < minDiff) {
        minDiff = diff
        closest = option.value
      }
    })
    return closest
  }

  const summaryCards = [
    { label: 'Score Average', value: formatPointValue(averageEstimate), sublabel: 'pt' },
    { label: 'Suggested Score', value: formatPointValue(getSuggestedScore()), sublabel: 'pt', highlight: true }
  ]

  const generateMarkdownSummary = () => {
    let markdown = `# Task Estimation Results\n\n`
    markdown += `## Task: ${taskTitle}\n\n`
    markdown += `**Participants:** ${votes.length}\n\n`
    markdown += `---\n\n`
    
    // Summary Statistics
    markdown += `## Summary\n\n`
    markdown += `| Metric | Points |\n`
    markdown += `|--------|--------|\n`
    markdown += `| **Score Average** | ${formatPointValue(averageEstimate)} |\n`
    markdown += `| **Suggested Score** | ${formatPointValue(getSuggestedScore())} |\n\n`
    
    // Individual Estimates
    markdown += `## Individual Estimates\n\n`
    
    nonSkippedVotes.forEach((vote) => {
      const participantName = getParticipantName(vote.participant_id)
      const pointValue = vote.value || 0
      const pointOption = POINT_OPTIONS.find(o => o.value === pointValue)
      
      markdown += `### ${participantName}\n\n`
      markdown += `**Estimate:** ${formatPointValue(pointValue)} points\n`
      if (pointOption) {
        markdown += `**Description:** ${pointOption.description}\n`
      }
      markdown += `\n`
    })

    if (skippedVotes.length > 0) {
      markdown += `## Skipped Votes\n\n`
      skippedVotes.forEach((vote) => {
        const participantName = getParticipantName(vote.participant_id)
        const emoji = getEmojiForSkippedVote(vote)
        markdown += `- **${participantName}:** ${emoji || 'Skipped'}\n`
      })
      markdown += `\n`
    }
    
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
      // Use average of point values (same calculation as display)
      const averageEstimate = pointValues.length > 0 
        ? Math.round((pointValues.reduce((sum, val) => sum + val, 0) / pointValues.length) * 10) / 10
        : 0

      // Update task status to completed in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          final_estimate: averageEstimate
        })
        .eq('id', taskId)

      if (error) throw error
      
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
            {isModerator && onHideVotes && (
              <Button
                onClick={onHideVotes}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Hide Votes
              </Button>
            )}
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
                {isCompleting ? 'Completing...' : 'Complete Task'}
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {summaryCards.map((card, index) => (
            <Card key={index} className={card.highlight ? 'border-blue-500 bg-blue-50' : ''}>
              <CardContent className="p-4">
                <div className="text-xs font-medium text-slate-600 mb-1">{card.label}</div>
                <div className={`text-2xl font-bold ${card.highlight ? 'text-blue-700' : 'text-slate-900'}`}>
                  {card.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{card.sublabel}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Show skipped votes first */}
        {skippedVotes.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-slate-600">Skipped Votes</h4>
            <div className="space-y-2">
              {skippedVotes.map((vote) => {
                const emoji = getEmojiForSkippedVote(vote)
                return (
                  <Card key={vote.id} className="border-gray-200 bg-gray-50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-gray-700">
                          {getParticipantName(vote.participant_id)}
                        </CardTitle>
                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
                          {emoji || 'Skipped'}
                        </Badge>
            </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Show non-skipped votes */}
        <div className="grid gap-4">
          {nonSkippedVotes.map((vote) => {
            const pointValue = vote.value || 0
            const pointOption = POINT_OPTIONS.find(o => o.value === pointValue)
              
              return (
              <Card key={vote.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-900">
                      {getParticipantName(vote.participant_id)}
                    </CardTitle>
                    <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                      {formatPointValue(pointValue)} pt
                    </Badge>
                  </div>
                </CardHeader>
                {pointOption && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-slate-600">
                      {pointOption.description}
                    </div>
                  </CardContent>
                )}
              </Card>
              )
            })}
          </div>
      </CardContent>
    </Card>
  )
}
