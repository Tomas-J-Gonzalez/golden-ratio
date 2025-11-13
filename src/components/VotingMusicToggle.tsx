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
  const [showVolumeControl, setShowVolumeControl] = useState(false)

  console.log('VotingMusicToggle rendered:', { isVotingActive, isLoadingAudio, isEnabled })

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
    if (!isVotingActive) {
      if (isEnabled) {
        setIsEnabled(false)
      }
      if (showVolumeControl) {
        setShowVolumeControl(false)
      }
    }
  }, [isVotingActive, isEnabled, showVolumeControl])

  const toggleLabel = useMemo(() => {
    if (!isVotingActive) return 'Music available when voting starts'
    if (isEnabled) return 'Stop session music'
    return 'Play session music'
  }, [isEnabled, isVotingActive])

  const volumeIcon = volume <= 0.01 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />

  return (
    <div className="flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-2 py-1 shadow-sm ring-1 ring-gray-200 backdrop-blur">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => {
          if (!isVotingActive || isLoadingAudio) return
          setIsEnabled((prev) => !prev)
        }}
        aria-pressed={isEnabled}
        disabled={!isVotingActive || isLoadingAudio}
        className={`h-8 w-8 rounded-full border ${
          isEnabled
            ? 'border-blue-200 bg-blue-50 text-blue-600'
            : 'border-transparent text-gray-500'
        }`}
        title={toggleLabel}
      >
        <Music
          className={`w-4 h-4 transition ${
            isEnabled
              ? 'animate-[spin_6s_linear_infinite] text-blue-600'
              : 'text-gray-500'
          }`}
        />
      </Button>

      <span className="text-xs font-medium text-gray-600">Music</span>

      <button
        type="button"
        onClick={() => {
          if (!isVotingActive) return
          setShowVolumeControl((prev) => !prev)
        }}
        disabled={!isVotingActive}
        className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
          showVolumeControl
            ? 'border-blue-200 bg-blue-50 text-blue-600'
            : 'border-transparent text-gray-500'
        } disabled:text-gray-400`}
        aria-label="Toggle volume control"
        aria-expanded={showVolumeControl}
      >
        {volumeIcon}
      </button>

      {showVolumeControl && (
        <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs text-blue-700 shadow-sm">
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
            className="h-1 w-24 cursor-pointer accent-blue-500"
            aria-label="Adjust session music volume"
          />
          <span className="w-8 text-right text-[11px] font-medium">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

