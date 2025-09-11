// Comprehensive estimation scale for design tasks
export const ESTIMATION_SCALE = [
  { 
    value: 1, 
    label: 'XS', 
    description: 'Quick Fix',
    hours: '1-2 hours',
    effort: 'Very Low',
    sprints: '0.1 sprint',
    designers: '1 designer',
    breakpoints: 'Desktop only',
    prototypes: 'None',
    fidelity: 'Lo-fi',
    examples: 'Color adjustments, text changes, minor spacing fixes'
  },
  { 
    value: 2, 
    label: 'S', 
    description: 'Simple Component',
    hours: '2-4 hours',
    effort: 'Low',
    sprints: '0.2 sprint',
    designers: '1 designer',
    breakpoints: 'Desktop + Mobile',
    prototypes: 'Static mockups',
    fidelity: 'Lo-fi',
    examples: 'Button states, form inputs, simple cards'
  },
  { 
    value: 4, 
    label: 'M', 
    description: 'Standard Feature',
    hours: '4-8 hours',
    effort: 'Medium',
    sprints: '0.5 sprint',
    designers: '1-2 designers',
    breakpoints: 'Desktop + Tablet + Mobile',
    prototypes: 'Basic interactions',
    fidelity: 'Mid-fi',
    examples: 'Navigation menus, data tables, user profiles'
  },
  { 
    value: 8, 
    label: 'L', 
    description: 'Complex Feature',
    hours: '1-2 days',
    effort: 'High',
    sprints: '1 sprint',
    designers: '2-3 designers',
    breakpoints: 'All breakpoints + responsive',
    prototypes: 'Interactive prototypes',
    fidelity: 'Hi-fi',
    examples: 'Dashboard layouts, multi-step forms, complex workflows'
  },
  { 
    value: 16, 
    label: 'XL', 
    description: 'Major Feature',
    hours: '2-4 days',
    effort: 'Very High',
    sprints: '1-2 sprints',
    designers: '3+ designers',
    breakpoints: 'All breakpoints + accessibility',
    prototypes: 'Advanced prototypes + user testing',
    fidelity: 'Hi-fi + design system',
    examples: 'Complete app redesigns, new product features, design systems'
  },
  { 
    value: 32, 
    label: 'XXL', 
    description: 'Epic/Project',
    hours: '1+ weeks',
    effort: 'Extreme',
    sprints: '2+ sprints',
    designers: 'Full team',
    breakpoints: 'All breakpoints + accessibility + internationalization',
    prototypes: 'Full user journey prototypes',
    fidelity: 'Hi-fi + design system + documentation',
    examples: 'New product launches, major platform overhauls, design system creation'
  }
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
