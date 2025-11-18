'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TaskTag } from '@/lib/supabase'

export type { TaskTag }

// Pastel color palette
const PASTEL_COLORS = [
  { name: 'pastel-blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { name: 'pastel-pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { name: 'pastel-green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { name: 'pastel-purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { name: 'pastel-yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { name: 'pastel-orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { name: 'pastel-teal', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  { name: 'pastel-rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  { name: 'pastel-indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { name: 'pastel-cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
]

interface TagPickerProps {
  tags: TaskTag[]
  onTagsChange: (tags: TaskTag[]) => void
  disabled?: boolean
}

export function TagPicker({ tags, onTagsChange, disabled }: TagPickerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0].name)

  const addTag = () => {
    if (!newTagLabel.trim()) return
    
    const trimmedLabel = newTagLabel.trim()
    
    // Check if tag with same label already exists
    if (tags.some(tag => tag.label.toLowerCase() === trimmedLabel.toLowerCase())) {
      return
    }

    const newTag: TaskTag = {
      label: trimmedLabel,
      color: selectedColor
    }

    onTagsChange([...tags, newTag])
    setNewTagLabel('')
    setSelectedColor(PASTEL_COLORS[0].name)
  }

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    onTagsChange(newTags)
  }

  const getColorClasses = (colorName: string) => {
    const color = PASTEL_COLORS.find(c => c.name === colorName) || PASTEL_COLORS[0]
    return `${color.bg} ${color.text} ${color.border}`
  }

  return (
    <div className="space-y-2">
      {/* Display existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => {
            const colorClasses = getColorClasses(tag.color)
            return (
              <Badge
                key={index}
                variant="outline"
                className={`${colorClasses} border px-2 py-0.5 text-xs font-medium flex items-center gap-1`}
              >
                {tag.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:opacity-70 focus:outline-none focus:ring-1 focus:ring-offset-1 rounded"
                    aria-label={`Remove tag ${tag.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Add tag button */}
      {!disabled && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
              <DialogDescription>
                Create a new tag with a label and color
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="tag-label" className="text-sm font-medium">
                  Tag Label
                </label>
                <Input
                  id="tag-label"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                      setIsDialogOpen(false)
                    }
                  }}
                  placeholder="Enter tag name"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {PASTEL_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`h-10 w-10 rounded-md border-2 transition-all ${
                        color.bg
                      } ${
                        selectedColor === color.name
                          ? `${color.border} ring-2 ring-offset-2 ring-gray-400 scale-110`
                          : 'border-gray-200 hover:scale-105'
                      }`}
                      aria-label={`Select ${color.name} color`}
                      title={color.name.replace('pastel-', '')}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setNewTagLabel('')
                    setSelectedColor(PASTEL_COLORS[0].name)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    addTag()
                    setIsDialogOpen(false)
                  }}
                  disabled={!newTagLabel.trim()}
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

