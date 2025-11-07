'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff } from 'lucide-react'
import { Participant, Vote } from '@/lib/supabase'

interface VotesHiddenProps {
  taskTitle: string
  votes: Vote[]
  participants: Participant[]
  isModerator: boolean
  onRevealVotes: () => void
}

export default function VotesHidden({ 
  taskTitle, 
  votes, 
  participants, 
  isModerator,
  onRevealVotes 
}: VotesHiddenProps) {
  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId)
    return participant ? participant.nickname : 'Unknown'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-400" />
              All Votes Submitted: {taskTitle}
            </CardTitle>
            <CardDescription>
              All {votes.length} participants have completed their estimates
            </CardDescription>
          </div>
          {isModerator && (
            <Button 
              onClick={onRevealVotes}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4" />
              Reveal Votes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-white rounded-full mb-4 shadow-sm">
              <EyeOff className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Votes Hidden</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {isModerator 
                ? "Click 'Reveal Votes' to show all estimates and results to everyone"
                : "Waiting for the moderator to reveal the votes"}
            </p>
          </div>

          {/* Show who has voted without showing estimates */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Participants Who Voted:</h4>
            <div className="flex flex-wrap gap-2">
              {votes.map((vote) => (
                <Badge 
                  key={vote.id}
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  {getParticipantName(vote.participant_id)} ✓
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

