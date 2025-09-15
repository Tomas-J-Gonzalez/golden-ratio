// Effort level options (complexity)
export const EFFORT_OPTIONS = [
  { value: 1, label: 'Very Low', description: 'Minimal complexity' },
  { value: 2, label: 'Low', description: 'Simple task' },
  { value: 4, label: 'Medium', description: 'Moderate complexity' },
  { value: 8, label: 'High', description: 'Complex task' },
  { value: 16, label: 'Very High', description: 'Highly complex' }
]

// Time estimation options
export const TIME_OPTIONS = [
  { value: 1, label: 'XS', description: '1-2 hours' },
  { value: 2, label: 'S', description: '4-8 hours' },
  { value: 4, label: 'M', description: '1-2 days' },
  { value: 8, label: 'L', description: '3-5 days' },
  { value: 16, label: 'XL', description: '1+ weeks' }
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

export const DESIGNER_COUNT_OPTIONS = [
  { value: 1, label: '1 designer', description: 'Single designer can handle' },
  { value: 2, label: '2 designers', description: 'Two designers working together' },
  { value: 3, label: '3 designers', description: 'Small team collaboration' },
  { value: 4, label: '4 designers', description: 'Medium team effort' },
  { value: 5, label: '5+ designers', description: 'Large team required' }
]

export const DESIGNER_LEVEL_OPTIONS = [
  { value: 1, label: 'Junior', description: 'Junior designer level' },
  { value: 1.5, label: 'Intermediate', description: 'Mid-level designer' },
  { value: 2, label: 'Senior', description: 'Senior designer' },
  { value: 2.5, label: 'Lead', description: 'Lead designer' },
  { value: 3, label: 'Director', description: 'Design director level' }
]

// Designer level options for individual designer assignment
export const INDIVIDUAL_DESIGNER_LEVELS = [
  { value: 1, label: 'Junior', description: 'Junior designer' },
  { value: 1.5, label: 'Intermediate', description: 'Mid-level designer' },
  { value: 2, label: 'Senior', description: 'Senior designer' },
  { value: 2.5, label: 'Lead', description: 'Lead designer' },
  { value: 3, label: 'Director', description: 'Design director' }
]

export const BREAKPOINT_OPTIONS = [
  { value: 1, label: 'Desktop only', description: 'Single breakpoint design' },
  { value: 2, label: 'Desktop + Mobile', description: 'Two main breakpoints' },
  { value: 3, label: 'Desktop + Tablet + Mobile', description: 'Three standard breakpoints' },
  { value: 4, label: 'All breakpoints', description: 'Full responsive design' }
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
  { value: 4, label: 'Interactive prototype', description: 'Interactive prototype with animations' },
  { value: 5, label: 'Production-ready', description: 'Production-ready designs with specifications' }
]

// Calculate total estimate based on individual factors
export const calculateEstimate = (factors: {
  effort: number;
  time: number;
  sprints: number;
  designerCount: number;
  designerLevels: number[]; // Array of designer levels
  breakpoints: number;
  fidelity: number;
}) => {
  const baseEstimate = factors.time; // Use time as base
  const averageDesignerLevel = factors.designerLevels.length > 0 
    ? factors.designerLevels.reduce((sum, level) => sum + level, 0) / factors.designerLevels.length
    : 1;
  const complexityMultiplier = (factors.effort + factors.sprints + factors.designerCount + averageDesignerLevel + factors.breakpoints + factors.fidelity) / 6;
  return Math.round(baseEstimate * complexityMultiplier);
}

// Convert estimate to t-shirt size and hours range
export const estimateToTShirtSize = (estimate: number) => {
  if (estimate <= 2) return 'XS (1-2 hours)';
  if (estimate <= 4) return 'S (4-8 hours)';
  if (estimate <= 8) return 'M (1-2 days)';
  if (estimate <= 16) return 'L (3-5 days)';
  if (estimate <= 32) return 'XL (1+ weeks)';
  return 'XXL (2+ weeks)';
}

// Legacy function for backward compatibility
export const estimateToHours = (estimate: number) => {
  return estimateToTShirtSize(estimate);
}

// Meeting buffer options
export const MEETING_BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer', description: 'No additional time for meetings' },
  { value: 0.1, label: '+10%', description: '10% additional time for meetings' },
  { value: 0.2, label: '+20%', description: '20% additional time for meetings' },
  { value: 0.3, label: '+30%', description: '30% additional time for meetings' },
  { value: 0.5, label: '+50%', description: '50% additional time for meetings' },
]

// Iteration multiplier options
export const ITERATION_MULTIPLIER_OPTIONS = [
  { value: 1, label: '1x (No iteration)', description: 'No additional design iterations' },
  { value: 2, label: '2x (2 rounds)', description: '2 rounds of design iterations' },
  { value: 3, label: '3x (3 rounds)', description: '3 rounds of design iterations' },
  { value: 4, label: '4x (4 rounds)', description: '4 rounds of design iterations' },
]

// Generate unique session code
export const generateSessionCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
