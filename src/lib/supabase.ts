import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mock-supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'

// Check if we're in demo mode
const isDemoMode = supabaseUrl.includes('placeholder')

// Use mock client in demo mode, real client in production
export const supabase = isDemoMode 
  ? mockSupabase as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

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
  avatar_emoji?: string
}

export interface Task {
  id: string
  session_id: string
  title: string
  description?: string
  created_at: string
  status: 'pending' | 'voting' | 'voting_completed' | 'completed'
  final_estimate?: number
  meeting_buffer?: number
  iteration_multiplier?: number
  votes_revealed?: boolean
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
