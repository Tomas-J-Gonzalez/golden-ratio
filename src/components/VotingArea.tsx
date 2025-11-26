'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { POINT_OPTIONS } from '@/lib/constants'
import { POINT_OPTIONS } from '@/lib/constants'

interface VotingAreaProps {
  taskId: string
  taskTitle: string
  participantId: string
  onVoteSubmitted: () => void
}

export default function VotingArea({ 
  taskId, 
  taskTitle, 
  participantId, 
  onVoteSubmitted 
}: VotingAreaProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<'coffee' | 'infinity' | 'question' | null>(null)
  const formatPointWithPt = (value: number) => {
    const formatted = value % 1 === 0 ? value.toString() : value.toFixed(1)
    return `${formatted} pt`
  }

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
        // Check if it's an emoji vote
        const factors = (existingVote.factors || {}) as {
          wantsCoffeeBreak?: boolean
          taskTooBig?: boolean
          scopeUnclear?: boolean
          skipped?: boolean
        }
        
        if (factors.skipped || existingVote.value === -1) {
          if (factors.wantsCoffeeBreak) {
            setSelectedEmoji('coffee')
          } else if (factors.taskTooBig) {
            setSelectedEmoji('infinity')
          } else if (factors.scopeUnclear) {
            setSelectedEmoji('question')
          }
          setHasVoted(true)
        } else if (existingVote.value && existingVote.value > 0) {
          // Regular point vote - verify it's a valid point option
          const validPoint = POINT_OPTIONS.find(o => o.value === existingVote.value)
          if (validPoint) {
            setSelectedPoint(existingVote.value)
        setHasVoted(true)
          }
        }
      }
    } catch (error) {
      // No existing vote found
      console.log('No existing vote found')
    }
  }, [taskId, participantId])

  useEffect(() => {
    checkExistingVote()
  }, [checkExistingVote])

  const submitVote = async () => {
    if (selectedPoint === null) return

    setIsSubmitting(true)
    
    try {
      // Submit vote to Supabase
      const { error } = await supabase
        .from('votes')
        .upsert({
          task_id: taskId,
          participant_id: participantId,
          value: selectedPoint,
          factors: {}
        })

      if (error) throw error

      setHasVoted(true)
      onVoteSubmitted()
    } catch (error) {
      console.error('Error submitting vote:', error)
      toast.error(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipVote = async () => {
    setIsSubmitting(true)
    
    try {
      // Submit a skip vote with value -1 and skipped flag
      const { error } = await supabase
        .from('votes')
        .upsert({
          task_id: taskId,
          participant_id: participantId,
          value: -1, // Special value to indicate skipped
          factors: {
            skipped: true
          }
        })

      if (error) throw error

      setHasVoted(true)
      onVoteSubmitted()
    } catch (error) {
      console.error('Error skipping vote:', error)
      toast.error(`Failed to skip vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmojiClick = async (emojiType: 'coffee' | 'infinity' | 'question') => {
    if (hasVoted) return

    setIsSubmitting(true)
    
    try {
      const factors: {
        skipped: boolean
        wantsCoffeeBreak?: boolean
        taskTooBig?: boolean
        scopeUnclear?: boolean
      } = {
        skipped: true
      }

      if (emojiType === 'coffee') {
        factors.wantsCoffeeBreak = true
      } else if (emojiType === 'infinity') {
        factors.taskTooBig = true
      } else if (emojiType === 'question') {
        factors.scopeUnclear = true
      }

      const { error } = await supabase
        .from('votes')
        .upsert({
          task_id: taskId,
          participant_id: participantId,
          value: -1,
          factors
        })

      if (error) throw error

      setSelectedEmoji(emojiType)
      setHasVoted(true)
      onVoteSubmitted()
    } catch (error) {
      console.error('Error submitting emoji vote:', error)
      toast.error(`Failed to submit vote: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (hasVoted) {
    if (selectedEmoji) {
      const emojiMessages = {
        coffee: { emoji: '☕', message: 'Coffee break requested', bgColor: 'bg-amber-50' },
        infinity: { emoji: '∞', message: 'Task marked as too big', bgColor: 'bg-red-50' },
        question: { emoji: '❓', message: 'Scope marked as unclear', bgColor: 'bg-yellow-50' }
      }
      const emojiInfo = emojiMessages[selectedEmoji]

    return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Vote Submitted
            </CardTitle>
            <CardDescription>
              Your response for &ldquo;{taskTitle}&rdquo;
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 ${emojiInfo.bgColor} rounded-lg`}>
              <div className="text-center">
                <div className="text-4xl mb-2">{emojiInfo.emoji}</div>
                <div className="text-lg font-semibold text-gray-700">{emojiInfo.message}</div>
                <div className="text-sm text-gray-500 mt-1">Your turn has been skipped</div>
        </div>
      </div>
          </CardContent>
        </Card>
    )
  }

    const selectedOption = POINT_OPTIONS.find(o => o.value === selectedPoint)
    
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
              <div className="text-2xl font-bold text-green-600">{formatPointWithPt(selectedPoint!)}</div>
              <div className="text-sm text-green-700">{selectedOption?.description || ''}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estimate Task</CardTitle>
          <CardDescription>
            Select your point estimate for: <span className="font-medium">&ldquo;{taskTitle}&rdquo;</span>
        </CardDescription>
      </CardHeader>
        <CardContent className="space-y-6">
          {/* Point Selection */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Select Points</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {POINT_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setSelectedPoint(option.value)}
                  variant={selectedPoint === option.value ? "default" : "outline"}
                  className={`h-16 relative flex flex-col items-start justify-center gap-1 px-3 text-left ${
                    selectedPoint === option.value 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl font-bold flex items-baseline gap-1">
                    {option.label}
                    <span className="text-xs font-semibold">pt</span>
                  </span>
                  <span
                    title={option.description}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <Info className="w-3 h-3" />
                  </span>
                  <span className="text-xs opacity-80">{option.description.split(' - ')[1]}</span>
                </Button>
              ))}
          </div>
          </div>

          {/* Emoji Action Buttons - Single Select */}
        <div className="flex gap-2 justify-start">
          <Button
            onClick={() => handleEmojiClick('coffee')}
            variant={selectedEmoji === 'coffee' ? "default" : "outline"}
            size="sm"
            disabled={hasVoted || isSubmitting}
            className={`px-3 py-1 ${selectedEmoji === 'coffee' ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800' : ''}`}
            title="I need a coffee break"
          >
            ☕
          </Button>
          <Button
            onClick={() => handleEmojiClick('infinity')}
            variant={selectedEmoji === 'infinity' ? "default" : "outline"}
            size="sm"
            disabled={hasVoted || isSubmitting}
            className={`px-3 py-1 ${selectedEmoji === 'infinity' ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-800' : ''}`}
            title="This task is way too big"
          >
            ∞
          </Button>
          <Button
            onClick={() => handleEmojiClick('question')}
            variant={selectedEmoji === 'question' ? "default" : "outline"}
            size="sm"
            disabled={hasVoted || isSubmitting}
            className={`px-3 py-1 ${selectedEmoji === 'question' ? 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800' : ''}`}
            title="Scope is unclear or I have questions"
          >
            ❓
          </Button>
        </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Submit Button - Only show when point is selected */}
            {selectedPoint !== null && (
          <Button 
            onClick={submitVote} 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Estimate'}
          </Button>
        )}
            
            {/* Skip Vote Button - Always visible */}
            <Button 
              onClick={skipVote} 
              disabled={isSubmitting || hasVoted}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              size="sm"
              variant="outline"
            >
              {isSubmitting ? 'Processing...' : 'Skip Vote'}
            </Button>
        </div>
      </CardContent>
    </Card>
      
    </>
  )
}
