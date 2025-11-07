'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Music, Volume2, VolumeX } from 'lucide-react'

const DEFAULT_VOLUME = 0.4

interface VotingMusicToggleProps {
  isVotingActive: boolean
}

export function VotingMusicToggle({ isVotingActive }: VotingMusicToggleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const [isLoadingAudio, setIsLoadingAudio] = useState(true)

  useEffect(() => {
    const audioElement = new Audio('/jazz.mp3')
    audioElement.loop = true
    audioElement.volume = DEFAULT_VOLUME
    audioElement.preload = 'auto'

    const handleCanPlayThrough = () => {
      setIsLoadingAudio(false)
    }

    audioElement.addEventListener('canplaythrough', handleCanPlayThrough)
    audioRef.current = audioElement

    return () => {
      audioElement.pause()
      audioElement.removeEventListener('canplaythrough', handleCanPlayThrough)
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isEnabled && isVotingActive) {
      const playAudio = async () => {
        try {
          await audio.play()
        } catch (error) {
          console.error('Unable to play audio automatically:', error)
        }
      }

      playAudio()
    } else {
      audio.pause()
      audio.currentTime = 0
    }
  }, [isEnabled, isVotingActive, volume])

  useEffect(() => {
    if (!isVotingActive && isEnabled) {
      setIsEnabled(false)
    }
  }, [isVotingActive, isEnabled])

  const toggleLabel = useMemo(() => {
    if (!isVotingActive) return 'Music available when voting starts'
    if (isEnabled) return 'Stop session music'
    return 'Play session music'
  }, [isEnabled, isVotingActive])

  const volumeIcon = volume <= 0.01 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />

  return (
    <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <Button
        type="button"
        size="sm"
        variant={isEnabled ? 'default' : 'outline'}
        onClick={() => {
          if (!isVotingActive || isLoadingAudio) return
          setIsEnabled((prev) => !prev)
        }}
        aria-pressed={isEnabled}
        disabled={!isVotingActive || isLoadingAudio}
        className={`flex items-center gap-2 transition ${
          isEnabled ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
        }`}
        title={toggleLabel}
      >
        <Music
          className={`w-4 h-4 ${
            isEnabled
              ? 'text-white animate-[spin_4s_linear_infinite]'
              : 'text-blue-600'
          }`}
        />
        <span className="text-xs font-medium">Music</span>
      </Button>

      <div className="flex items-center gap-2">
        <span className="text-gray-400">{volumeIcon}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => {
            const newVolume = Number(event.target.value)
            setVolume(newVolume)
          }}
          disabled={!isVotingActive}
          className="h-1 w-24 cursor-pointer accent-blue-600 disabled:opacity-40"
          aria-label="Adjust session music volume"
        />
      </div>
    </div>
  )
}

