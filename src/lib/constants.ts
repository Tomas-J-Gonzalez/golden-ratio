// Estimation scale for design tasks
export const ESTIMATION_SCALE = [
  { value: 1, label: 'XS', description: 'Very small task (1-2 hours)' },
  { value: 2, label: 'S', description: 'Small task (2-4 hours)' },
  { value: 4, label: 'M', description: 'Medium task (4-8 hours)' },
  { value: 8, label: 'L', description: 'Large task (1-2 days)' },
  { value: 16, label: 'XL', description: 'Very large task (2+ days)' },
]

// Meeting buffer options
export const MEETING_BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 0.1, label: '+10%' },
  { value: 0.2, label: '+20%' },
  { value: 0.3, label: '+30%' },
  { value: 0.5, label: '+50%' },
]

// Iteration multiplier options
export const ITERATION_MULTIPLIER_OPTIONS = [
  { value: 1, label: '1x (No iteration)' },
  { value: 2, label: '2x (2 rounds)' },
  { value: 3, label: '3x (3 rounds)' },
  { value: 4, label: '4x (4 rounds)' },
]

// Generate unique session code
export const generateSessionCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
