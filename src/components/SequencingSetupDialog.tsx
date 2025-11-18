'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SequencingSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: {
    quarter: string
    startingSprint: number
    sprintsPerQuarter: number
    initiationDate: string
  }) => void
  existingConfig?: {
    quarter?: string
    startingSprint?: number
    sprintsPerQuarter?: number
    initiationDate?: string
  }
}

export function SequencingSetupDialog({
  open,
  onOpenChange,
  onConfirm,
  existingConfig
}: SequencingSetupDialogProps) {
  const [quarter, setQuarter] = useState(existingConfig?.quarter || '')
  const [startingSprint, setStartingSprint] = useState(existingConfig?.startingSprint?.toString() || '154')
  const [sprintsPerQuarter, setSprintsPerQuarter] = useState(existingConfig?.sprintsPerQuarter?.toString() || '6')
  const [initiationDate, setInitiationDate] = useState(() => {
    if (existingConfig?.initiationDate) {
      return existingConfig.initiationDate
    }
    // Default to today's date in YYYY-MM-DD format
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const currentYear = new Date().getFullYear()
  const quarters = [
    `Q1 ${currentYear}`,
    `Q2 ${currentYear}`,
    `Q3 ${currentYear}`,
    `Q4 ${currentYear}`,
    `Q1 ${currentYear + 1}`,
    `Q2 ${currentYear + 1}`,
    `Q3 ${currentYear + 1}`,
    `Q4 ${currentYear + 1}`
  ]

  const handleConfirm = () => {
    if (!quarter.trim() || !startingSprint || !sprintsPerQuarter || !initiationDate) {
      return
    }

    onConfirm({
      quarter: quarter.trim(),
      startingSprint: parseInt(startingSprint, 10),
      sprintsPerQuarter: parseInt(sprintsPerQuarter, 10),
      initiationDate: initiationDate
    })
  }

  const isValid = quarter.trim() && startingSprint && sprintsPerQuarter && initiationDate &&
                  parseInt(startingSprint, 10) > 0 && 
                  parseInt(sprintsPerQuarter, 10) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Task Sequencing</DialogTitle>
          <DialogDescription>
            Configure the quarter and sprint structure for organizing your tasks
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quarter">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger id="quarter">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="starting-sprint">Starting Sprint Number</Label>
            <Input
              id="starting-sprint"
              type="number"
              min="1"
              value={startingSprint}
              onChange={(e) => setStartingSprint(e.target.value)}
              placeholder="e.g., 154"
            />
            <p className="text-xs text-gray-500">
              The first sprint number for this quarter
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprints-per-quarter">Sprints per Quarter</Label>
            <Input
              id="sprints-per-quarter"
              type="number"
              min="1"
              max="12"
              value={sprintsPerQuarter}
              onChange={(e) => setSprintsPerQuarter(e.target.value)}
              placeholder="e.g., 6"
            />
            <p className="text-xs text-gray-500">
              Typically 6 sprints per quarter (assuming 2-week sprints)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initiation-date">Initiation Date</Label>
            <Input
              id="initiation-date"
              type="date"
              value={initiationDate}
              onChange={(e) => setInitiationDate(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Start date of the first sprint for this quarter
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            {existingConfig ? 'Update Configuration' : 'Start Sequencing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

