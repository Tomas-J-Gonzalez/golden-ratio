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
  }) => void
  existingConfig?: {
    quarter?: string
    startingSprint?: number
    sprintsPerQuarter?: number
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
    if (!quarter.trim() || !startingSprint || !sprintsPerQuarter) {
      return
    }

    onConfirm({
      quarter: quarter.trim(),
      startingSprint: parseInt(startingSprint, 10),
      sprintsPerQuarter: parseInt(sprintsPerQuarter, 10)
    })
  }

  const isValid = quarter.trim() && startingSprint && sprintsPerQuarter && 
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

