// Effort level options (complexity)
export interface ActivityOption {
  id: string
  label: string
  description: string
  impact: number
}

export interface ActivityGroup {
  title: string
  options: ActivityOption[]
}

const createActivityMap = (options: ActivityOption[]) => {
  return options.reduce<Record<string, ActivityOption>>((acc, option) => {
    acc[option.id] = option
    return acc
  }, {})
}

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
  { value: 4, label: '4 designers', description: 'Medium team effort' }
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
  { value: 3, label: 'Desktop + Tablet + Mobile', description: 'Three standard breakpoints' }
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
  { value: 8, label: 'Production-ready', description: 'All designs dev-ready with final specifications' }
]

export const DELIVERABLES_OPTIONS = [
  { value: 1, label: 'Wireframes', description: 'Static wireframe designs' },
  { value: 2, label: 'Interactive prototype', description: 'Interactive prototype with animations' }
]

export const DISCOVERY_ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: 'discovery', label: 'Discovery', description: 'Foundational research to understand the problem space', impact: 0.8 },
  { id: 'landscape', label: 'Landscape review', description: 'Competitive and market landscape analysis', impact: 0.6 },
  { id: 'ux_audit', label: 'UX audit of current state', description: 'Evaluate existing experience quality', impact: 0.9 },
  { id: 'accessibility_audit', label: 'Accessibility audit', description: 'Review for accessibility gaps', impact: 1 },
  { id: 'problem_exploration', label: 'Problem exploration & scope', description: 'Stakeholder workshops and goal setting', impact: 1.1 },
  { id: 'strategy_baseline', label: 'Strategy and baseline metrics', description: 'Define success metrics and strategy', impact: 0.7 },
  { id: 'user_testing', label: 'User testing', description: 'Moderated or unmoderated usability tests', impact: 1.2 }
]

export const DESIGN_TESTING_ACTIVITY_GROUPS: ActivityGroup[] = [
  {
    title: 'Atom',
    options: [
      { id: 'design_atom', label: 'Design a new atom', description: 'Create a brand-new UI atom component', impact: 1 }
    ]
  },
  {
    title: 'Molecule',
    options: [
      { id: 'design_molecule_existing_atoms', label: 'Use existing atoms', description: 'Compose molecule from already available atoms', impact: 1.1 },
      { id: 'design_molecule_new_atoms', label: 'Create new atoms', description: 'Requires new atoms alongside molecules', impact: 1.4 }
    ]
  },
  {
    title: 'Organism',
    options: [
      { id: 'design_organism_existing_parts', label: 'Use existing atoms/molecules', description: 'Assemble organism from pre-designed elements', impact: 1.5 },
      { id: 'design_organism_new_parts', label: 'Create new atoms/molecules', description: 'Requires net-new foundational components', impact: 1.9 }
    ]
  },
  {
    title: 'Page or template',
    options: [
      { id: 'design_page_existing_components', label: 'Use existing components', description: 'Assemble page from existing design system components', impact: 1.6 },
      { id: 'design_page_new_components', label: 'Create new components', description: 'Requires inventing new systems for the page', impact: 2 }
    ]
  },
  {
    title: 'Test and iterate',
    options: [
      { id: 'test_design_iterate', label: 'Test and iterate', description: 'Run testing cycles and iterate on learnings', impact: 1.3 }
    ]
  }
]

export const DESIGN_TESTING_ACTIVITY_OPTIONS = DESIGN_TESTING_ACTIVITY_GROUPS.flatMap(group => group.options)

export const DISCOVERY_ACTIVITY_MAP = createActivityMap(DISCOVERY_ACTIVITY_OPTIONS)
export const DESIGN_TESTING_ACTIVITY_MAP = createActivityMap(DESIGN_TESTING_ACTIVITY_OPTIONS)

// Maximum points that can be assigned to a task
export const MAX_POINTS = 100

// Calculate total estimate based on individual factors
// This is a more realistic calculation that properly weights all factors
export const calculateEstimate = (factors: {
  effort: number;
  sprints: number;
  designerCount: number;
  designerLevels: number[]; // Array of designer levels
  breakpoints: number;
  fidelity: number;
  meetingBuffer?: number; // Optional, defaults to 0
  iterationMultiplier?: number; // Optional, defaults to 1
  discoveryActivities?: string[];
  designActivities?: string[];
}) => {
  // Calculate average designer level (higher level = more efficient, so lower multiplier)
  // We invert this: higher level designers are more efficient, so they reduce the estimate
  const averageDesignerLevel = factors.designerLevels.length > 0 
    ? factors.designerLevels.reduce((sum, level) => sum + level, 0) / factors.designerLevels.length
    : 1;
  
  // Base complexity score from core factors
  // Effort (1-16), Sprints (0.1-3), Breakpoints (1-3), Fidelity (1-8)
  const baseComplexity = (factors.effort + factors.sprints * 5 + factors.breakpoints * 2 + factors.fidelity) / 4;

  const discoveryImpact = (factors.discoveryActivities || []).reduce((sum, activityId) => {
    return sum + (DISCOVERY_ACTIVITY_MAP[activityId]?.impact || 0)
  }, 0)

  const designImpact = (factors.designActivities || []).reduce((sum, activityId) => {
    return sum + (DESIGN_TESTING_ACTIVITY_MAP[activityId]?.impact || 0)
  }, 0)

  const activityAdjustedComplexity = baseComplexity + discoveryImpact * 0.5 + designImpact
  
  // Designer count multiplier (more designers = more coordination overhead)
  // But higher level designers are more efficient
  const designerEfficiency = averageDesignerLevel > 1 ? 1 / (1 + (averageDesignerLevel - 1) * 0.2) : 1;
  const designerMultiplier = 1 + (factors.designerCount - 1) * 0.15 * designerEfficiency;
  
  // Calculate base points
  let basePoints = activityAdjustedComplexity * designerMultiplier;
  
  // Apply meeting buffer (adds percentage to base)
  const meetingBuffer = factors.meetingBuffer || 0;
  basePoints = basePoints * (1 + meetingBuffer);
  
  // Apply iteration multiplier
  const iterationMultiplier = factors.iterationMultiplier || 1;
  basePoints = basePoints * iterationMultiplier;
  
  // Round to nearest integer and cap at MAX_POINTS
  const finalPoints = Math.round(basePoints);
  return Math.min(finalPoints, MAX_POINTS);
}

// Convert estimate to t-shirt size and hours range
export const estimateToTShirtSize = (estimate: number) => {
  if (estimate <= 2) return 'XS (1-2 hours)';
  if (estimate <= 4) return 'S (4-8 hours)';
  if (estimate <= 8) return 'M (1-2 days)';
  if (estimate <= 16) return 'L (3-5 days)';
  if (estimate <= 32) return 'XL (1+ weeks)';
  if (estimate <= 64) return 'XXL (2+ weeks)';
  return `XXL+ (${estimate} points)`;
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
  { value: 0.3, label: '+30%', description: '30% additional time for meetings' }
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
