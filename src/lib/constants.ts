// Flexible estimation factors for design tasks
export const EFFORT_OPTIONS = [
  { value: 1, label: 'Very Low', description: 'Minimal complexity, straightforward task' },
  { value: 2, label: 'Low', description: 'Simple task with few variables' },
  { value: 4, label: 'Medium', description: 'Moderate complexity, some unknowns' },
  { value: 8, label: 'High', description: 'Complex task with multiple considerations' },
  { value: 16, label: 'Very High', description: 'Highly complex with many variables' },
  { value: 32, label: 'Extreme', description: 'Maximum complexity, many unknowns' }
]

export const SPRINT_OPTIONS = [
  { value: 0.1, label: '0.1 sprint', description: 'Quick task, part of a sprint' },
  { value: 0.2, label: '0.2 sprint', description: 'Small task, quarter sprint' },
  { value: 0.5, label: '0.5 sprint', description: 'Half sprint effort' },
  { value: 1, label: '1 sprint', description: 'Full sprint commitment' },
  { value: 1.5, label: '1.5 sprints', description: 'One and a half sprints' },
  { value: 2, label: '2 sprints', description: 'Two full sprints' },
  { value: 3, label: '3+ sprints', description: 'Multiple sprints, major effort' }
]

export const DESIGNER_OPTIONS = [
  { value: 1, label: '1 designer', description: 'Single designer can handle' },
  { value: 1.5, label: '1-2 designers', description: 'One primary, occasional support' },
  { value: 2, label: '2 designers', description: 'Two designers working together' },
  { value: 3, label: '2-3 designers', description: 'Small team collaboration' },
  { value: 4, label: '3+ designers', description: 'Multiple designers required' },
  { value: 5, label: 'Full team', description: 'Entire design team involved' }
]

export const BREAKPOINT_OPTIONS = [
  { value: 1, label: 'Desktop only', description: 'Single breakpoint design' },
  { value: 2, label: 'Desktop + Mobile', description: 'Two main breakpoints' },
  { value: 3, label: 'Desktop + Tablet + Mobile', description: 'Three standard breakpoints' },
  { value: 4, label: 'All breakpoints + responsive', description: 'Full responsive design' },
  { value: 5, label: 'All + accessibility', description: 'Responsive + accessibility considerations' },
  { value: 6, label: 'All + accessibility + i18n', description: 'Full responsive + accessibility + internationalization' }
]

export const PROTOTYPE_OPTIONS = [
  { value: 1, label: 'None', description: 'No prototyping required' },
  { value: 2, label: 'Static mockups', description: 'Static design mockups only' },
  { value: 3, label: 'Basic interactions', description: 'Simple click-through prototypes' },
  { value: 4, label: 'Interactive prototypes', description: 'Full interaction prototyping' },
  { value: 5, label: 'Advanced prototypes', description: 'Complex interactions + animations' },
  { value: 6, label: 'Full user journey', description: 'Complete user journey prototyping' }
]

export const FIDELITY_OPTIONS = [
  { value: 1, label: 'Lo-fi', description: 'Low fidelity, wireframes/sketches' },
  { value: 2, label: 'Mid-fi', description: 'Medium fidelity, detailed wireframes' },
  { value: 3, label: 'Hi-fi', description: 'High fidelity, pixel-perfect designs' },
  { value: 4, label: 'Hi-fi + design system', description: 'High fidelity + design system integration' },
  { value: 5, label: 'Hi-fi + system + documentation', description: 'Complete design system with documentation' }
]

// Calculate total estimate based on individual factors
export const calculateEstimate = (factors: {
  effort: number;
  sprints: number;
  designers: number;
  breakpoints: number;
  prototypes: number;
  fidelity: number;
}) => {
  const baseEstimate = factors.effort;
  const complexityMultiplier = (factors.sprints + factors.designers + factors.breakpoints + factors.prototypes + factors.fidelity) / 5;
  return Math.round(baseEstimate * complexityMultiplier);
}

// Convert estimate to hours range
export const estimateToHours = (estimate: number) => {
  if (estimate <= 2) return '1-2 hours';
  if (estimate <= 4) return '2-4 hours';
  if (estimate <= 8) return '4-8 hours';
  if (estimate <= 16) return '1-2 days';
  if (estimate <= 32) return '2-4 days';
  if (estimate <= 64) return '1 week';
  return '1+ weeks';
}

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
