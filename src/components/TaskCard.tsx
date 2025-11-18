'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Expand, Edit2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface TaskCardProps {
  task: Task
  isOver?: boolean
  onExpand?: (task: Task) => void
  isModerator?: boolean
  onUpdate?: (taskId: string, updates: { title?: string; description?: string }) => Promise<void>
}

export function TaskCard({ task, isOver, onExpand, isModerator = false, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when task prop changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(task.title)
      setEditDescription(task.description || '')
    }
  }, [task.title, task.description, isEditing])
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  }

  const baseEstimate = task.final_estimate || 0
  const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
  const totalWithBuffer = baseEstimate + bufferAmount
  const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))

  // Get tag color classes helper
  const getTagColorClasses = (colorName: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      'pastel-blue': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
      'pastel-pink': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
      'pastel-green': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
      'pastel-purple': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
      'pastel-yellow': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
      'pastel-orange': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
      'pastel-teal': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
      'pastel-rose': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
      'pastel-indigo': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
      'pastel-cyan': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
    }
    const color = colorMap[colorName] || colorMap['pastel-blue']
    return `${color.bg} ${color.text} ${color.border}`
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onExpand) {
      onExpand(task)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if editing
    if (isEditing) return
    
    // Only expand if not dragging (dnd-kit handles drag detection)
    if (!isDragging && onExpand) {
      // Check if click is on the card content, not on drag handles or buttons
      const target = e.target as HTMLElement
      if (!target.closest('[data-sensor-instance]') && 
          !target.closest('button') && 
          !target.closest('input') && 
          !target.closest('textarea')) {
        onExpand(task)
      }
    }
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(false)
    setEditTitle(task.title)
    setEditDescription(task.description || '')
  }

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onUpdate) return

    setIsSaving(true)
    try {
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border rounded-lg p-3 shadow-sm
        hover:shadow-md transition-all hover:border-gray-300
        ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-pointer'}
      `}
      onClick={handleCardClick}
    >
      {/* Action buttons in top right */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        {isModerator && (
          <button
            onClick={isEditing ? handleCancelEdit : handleEditClick}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label={isEditing ? "Cancel edit" : "Edit task"}
            title={isEditing ? "Cancel edit" : "Edit task"}
          >
            {isEditing ? (
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
            ) : (
              <Edit2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
            )}
          </button>
        )}
        {onExpand && (
          <button
            onClick={handleExpandClick}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Expand task details"
            title="View task details"
          >
            <Expand className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>
      
      {/* Drag handle area - exclude buttons */}
      <div {...listeners} {...attributes} className={isModerator && onExpand ? "pr-14" : onExpand ? "pr-10" : isModerator ? "pr-10" : ""}>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Task title"
              className="text-sm font-medium h-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSaveEdit(e as unknown as React.MouseEvent)
                } else if (e.key === 'Escape') {
                  handleCancelEdit(e as unknown as React.MouseEvent)
                }
              }}
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Task description (optional)"
              className="text-xs min-h-[60px] resize-none"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Escape') {
                  handleCancelEdit(e as unknown as React.MouseEvent)
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving || !editTitle.trim()}
              className="w-full h-7 text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        ) : (
          <>
            <div className="font-medium text-sm mb-1 line-clamp-2">{task.title}</div>
          
            {task.description && (
              <div className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</div>
            )}
          </>
        )}

      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs font-semibold">
          {finalTotal} pts
        </Badge>
        {task.voting_duration_seconds && (
          <span className="text-xs text-gray-500">
            {Math.floor(task.voting_duration_seconds / 60)}:{(task.voting_duration_seconds % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.slice(0, 3).map((tag, index) => {
            const colorClasses = getTagColorClasses(tag.color)
            return (
              <Badge
                key={index}
                variant="outline"
                className={`${colorClasses} border px-1.5 py-0 text-[10px] font-medium`}
              >
                {tag.label}
              </Badge>
            )
          })}
          {task.tags.length > 3 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              +{task.tags.length - 3}
            </Badge>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

