'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ESTIMATION_SCALE } from '@/lib/constants'
import { CheckCircle } from 'lucide-react'

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
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkExistingVote = useCallback(async () => {
    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - check localStorage
        const existingVotes = JSON.parse(localStorage.getItem(`demo_votes_${taskId}`) || '[]')
        const existingVote = existingVotes.find((vote: { participant_id: string; value: number }) => vote.participant_id === participantId)
        
        if (existingVote) {
          setSelectedValue(existingVote.value)
          setHasVoted(true)
        }
        return
      }
      
      // Production mode - use Supabase
      const { data, error } = await supabase
        .from('votes')
        .select('value')
        .eq('task_id', taskId)
        .eq('participant_id', participantId)
        .single()

      if (data && !error) {
        setSelectedValue(data.value)
        setHasVoted(true)
      }
    } catch {
      // No existing vote found
    }
  }, [taskId, participantId])

  useEffect(() => {
    checkExistingVote()
  }, [checkExistingVote])

  const submitVote = async () => {
    if (selectedValue === null) return

    setIsSubmitting(true)
    try {
      // Check if we're in demo mode
      const isDemoMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')
      
      if (isDemoMode) {
        // Demo mode - store in localStorage
        const newVote = {
          id: crypto.randomUUID(),
          task_id: taskId,
          participant_id: participantId,
          value: selectedValue,
          created_at: new Date().toISOString()
        }
        
        const existingVotes = JSON.parse(localStorage.getItem(`demo_votes_${taskId}`) || '[]')
        const updatedVotes = existingVotes.filter((vote: { participant_id: string }) => vote.participant_id !== participantId)
        updatedVotes.push(newVote)
        localStorage.setItem(`demo_votes_${taskId}`, JSON.stringify(updatedVotes))
        
        setHasVoted(true)
        onVoteSubmitted()
        return
      }
      
      // Production mode - use Supabase
      const { error } = await supabase
        .from('votes')
        .upsert({
          task_id: taskId,
          participant_id: participantId,
          value: selectedValue
        })

      if (error) throw error

      setHasVoted(true)
      onVoteSubmitted()
    } catch (error) {
      console.error('Error submitting vote:', error)
      alert('Failed to submit vote. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeVote = () => {
    setHasVoted(false)
    setSelectedValue(null)
  }

  if (hasVoted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Vote Submitted
          </CardTitle>
          <CardDescription>
            You voted: <span className="font-bold">{ESTIMATION_SCALE.find(s => s.value === selectedValue)?.label}</span> for &ldquo;{taskTitle}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={changeVote} variant="outline" className="w-full">
            Change Vote
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vote on Task</CardTitle>
        <CardDescription>
          Select your estimate for: <span className="font-medium">&ldquo;{taskTitle}&rdquo;</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ESTIMATION_SCALE.map((scale) => (
            <Button
              key={scale.value}
              variant={selectedValue === scale.value ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start space-y-3 text-left"
              onClick={() => setSelectedValue(scale.value)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-2xl font-bold">{scale.label}</div>
                <div className="text-sm font-medium text-blue-600">{scale.hours}</div>
              </div>
              <div className="text-sm font-medium">{scale.description}</div>
              <div className="text-xs space-y-1 opacity-80">
                <div><strong>Effort:</strong> {scale.effort}</div>
                <div><strong>Sprints:</strong> {scale.sprints}</div>
                <div><strong>Designers:</strong> {scale.designers}</div>
                <div><strong>Breakpoints:</strong> {scale.breakpoints}</div>
                <div><strong>Prototypes:</strong> {scale.prototypes}</div>
                <div><strong>Fidelity:</strong> {scale.fidelity}</div>
              </div>
              <div className="text-xs italic opacity-70 mt-2">
                {scale.examples}
              </div>
            </Button>
          ))}
        </div>
        
        {selectedValue !== null && (
          <div className="pt-4 border-t">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-lg">Selected: {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.label}</p>
                  <p className="text-sm text-gray-600">
                    {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.hours}
                  </div>
                  <div className="text-sm text-gray-500">
                    {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.sprints}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                <div><strong>Effort:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.effort}</div>
                <div><strong>Designers:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.designers}</div>
                <div><strong>Breakpoints:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.breakpoints}</div>
                <div><strong>Prototypes:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.prototypes}</div>
                <div><strong>Fidelity:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.fidelity}</div>
                <div className="col-span-2 md:col-span-1">
                  <strong>Examples:</strong> {ESTIMATION_SCALE.find(s => s.value === selectedValue)?.examples}
                </div>
              </div>
            </div>
            <Button 
              onClick={submitVote} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
