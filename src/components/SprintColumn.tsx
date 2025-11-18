'use client'

import { Task } from '@/lib/supabase'
import { TaskCard } from './TaskCard'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface SprintColumnProps {
  sprintNumber: number
  tasks: Task[]
  maxCapacity?: number
  onTaskExpand?: (task: Task) => void
  sprintStartDate?: Date | null
}

export function SprintColumn({ sprintNumber, tasks, maxCapacity = 40, onTaskExpand, sprintStartDate }: SprintColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `sprint-${sprintNumber}`,
    data: {
      type: 'sprint',
      sprintNumber
    }
  })

  const totalPoints = tasks.reduce((sum, task) => {
    const baseEstimate = task.final_estimate || 0
    const bufferAmount = baseEstimate * (task.meeting_buffer || 0)
    const totalWithBuffer = baseEstimate + bufferAmount
    const finalTotal = Math.round(totalWithBuffer * (task.iteration_multiplier || 1))
    return sum + finalTotal
  }, 0)

  const isOverCapacity = totalPoints > maxCapacity
  const capacityPercentage = (totalPoints / maxCapacity) * 100

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-h-[500px] bg-gray-50 rounded-lg border-2 p-3
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
        ${isOverCapacity ? 'border-red-300 bg-red-50' : ''}
      `}
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">
              Sprint {sprintNumber}
            </h3>
            {sprintStartDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                {sprintStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
          <Badge variant={isOverCapacity ? 'destructive' : 'secondary'} className="text-xs">
            {totalPoints} / {maxCapacity} pts
          </Badge>
        </div>
        
        {/* Capacity bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isOverCapacity 
                ? 'bg-red-500' 
                : capacityPercentage > 80 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
          />
        </div>

        {isOverCapacity && (
          <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
            <AlertCircle className="w-3 h-3" />
            <span>Over capacity by {totalPoints - maxCapacity} pts</span>
          </div>
        )}

        <div className="text-xs text-gray-500">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} isOver={isOver} onExpand={onTaskExpand} />
            ))
          ) : (
            <div className="text-center text-xs text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded">
              Drop tasks here
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}

