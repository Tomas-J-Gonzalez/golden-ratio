'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock } from 'lucide-react'

interface VotingTimerProps {
  isVotingActive: boolean
  onDurationChange?: (seconds: number) => void
}

export function VotingTimer({ isVotingActive, onDurationChange }: VotingTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start timer when voting becomes active
  useEffect(() => {
    if (isVotingActive) {
      // Reset and start timer
      setElapsedSeconds(0)
      startTimeRef.current = Date.now()
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
          setElapsedSeconds(elapsed)
          if (onDurationChange) {
            onDurationChange(elapsed)
          }
        }
      }, 1000)
    } else {
      // Stop timer when voting ends
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      startTimeRef.current = null
      setElapsedSeconds(0)
      if (onDurationChange) {
        onDurationChange(0)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isVotingActive, onDurationChange])

  if (!isVotingActive) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-2 py-1 shadow-sm ring-1 ring-gray-200 backdrop-blur">
      <Clock className="w-4 h-4 text-gray-600" />
      <span className="text-xs font-medium text-gray-600">Timer</span>
      <span className="text-xs font-mono font-semibold text-gray-900">
        {formatTime(elapsedSeconds)}
      </span>
    </div>
  )
}

