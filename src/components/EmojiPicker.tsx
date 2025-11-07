'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'

const FRUIT_EMOJIS = [
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇',
  '🍓', '🫐', '🍈', '🍒', '🍑', '🥭',
  '🍍', '🥥', '🥝', '🍏', '🍐', '🥑',
  '🍅', '🫒', '🌶️', '🫑', '🥒', '🥕'
]

interface EmojiPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmoji?: string
  onSelectEmoji: (emoji: string) => void
  participantName: string
}

export function EmojiPicker({ 
  open, 
  onOpenChange, 
  currentEmoji, 
  onSelectEmoji,
  participantName 
}: EmojiPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji || '🍎')

  const handleSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    onSelectEmoji(emoji)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select a fruit emoji for {participantName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-2 py-4">
          {FRUIT_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant={selectedEmoji === emoji ? "default" : "outline"}
              size="lg"
              className="text-2xl h-12 w-12 p-0"
              onClick={() => handleSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

