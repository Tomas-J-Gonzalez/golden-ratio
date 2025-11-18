'use client'

import { Task } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface TaskCardProps {
  task: Task
  isOver?: boolean
}

export function TaskCard({ task, isOver }: TaskCardProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-white border rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="font-medium text-sm mb-1 line-clamp-2">{task.title}</div>
      
      {task.description && (
        <div className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</div>
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
  )
}

