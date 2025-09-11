import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Session {
  id: string
  code: string
  created_at: string
  moderator_id: string
  is_active: boolean
}

export interface Participant {
  id: string
  session_id: string
  nickname: string
  joined_at: string
  is_moderator: boolean
}

export interface Task {
  id: string
  session_id: string
  title: string
  description?: string
  created_at: string
  status: 'pending' | 'voting' | 'completed'
  final_estimate?: number
  meeting_buffer?: number
  iteration_multiplier?: number
}

export interface Vote {
  id: string
  task_id: string
  participant_id: string
  value: number
  factors?: {
    effort: number
    sprints: number
    designers: number
    breakpoints: number
    prototypes: number
    fidelity: number
  }
  created_at: string
}

export interface EstimationScale {
  value: number
  label: string
  description: string
}
