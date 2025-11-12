// Demo mode storage using localStorage
// This provides a mock implementation of Supabase for demo purposes

export class DemoStorage {
  private prefix = 'demo_'

  // Generate a simple UUID
  private generateId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Get all items of a type
  private getAll(type: string): any[] {
    const items: any[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}${type}_`)) {
        const item = localStorage.getItem(key)
        if (item) {
          items.push(JSON.parse(item))
        }
      }
    }
    return items
  }

  // Get a single item
  private getOne(type: string, id: string): any | null {
    const key = `${this.prefix}${type}_${id}`
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  }

  // Save an item
  private save(type: string, id: string, data: any): void {
    const key = `${this.prefix}${type}_${id}`
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Delete an item
  private delete(type: string, id: string): void {
    const key = `${this.prefix}${type}_${id}`
    localStorage.removeItem(key)
  }

  // Sessions
  getSession(code: string): any | null {
    const sessions = this.getAll('session')
    return sessions.find(s => s.code === code) || null
  }

  createSession(data: any): any {
    const id = data.code // Use session code as ID
    const session = {
      id,
      code: data.code,
      created_at: new Date().toISOString(),
      moderator_id: data.moderator_id,
      is_active: true
    }
    this.save('session', id, session)
    return session
  }

  updateSession(id: string, data: any): any {
    const session = this.getOne('session', id)
    if (session) {
      const updated = { ...session, ...data }
      this.save('session', id, updated)
      return updated
    }
    return null
  }

  // Participants
  getParticipants(sessionId: string): any[] {
    const participants = this.getAll('participant')
    return participants.filter(p => p.session_id === sessionId)
      .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime())
  }

  createParticipant(data: any): any {
    const id = this.generateId()
    const participant = {
      id,
      session_id: data.session_id,
      nickname: data.nickname,
      is_moderator: data.is_moderator || false,
      joined_at: new Date().toISOString(),
      avatar_emoji: data.avatar_emoji || null
    }
    this.save('participant', id, participant)
    return participant
  }

  updateParticipant(id: string, data: any): any {
    const participant = this.getOne('participant', id)
    if (participant) {
      const updated = { ...participant, ...data }
      this.save('participant', id, updated)
      return updated
    }
    return null
  }

  deleteParticipant(id: string): void {
    this.delete('participant', id)
  }

  // Tasks
  getTasks(sessionId: string): any[] {
    const tasks = this.getAll('task')
    return tasks.filter(t => t.session_id === sessionId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  createTask(data: any): any {
    const id = this.generateId()
    const task = {
      id,
      session_id: data.session_id,
      title: data.title,
      description: data.description || null,
      created_at: new Date().toISOString(),
      status: data.status || 'pending',
      final_estimate: data.final_estimate || null,
      meeting_buffer: data.meeting_buffer || null,
      iteration_multiplier: data.iteration_multiplier || null,
      votes_revealed: data.votes_revealed || false
    }
    this.save('task', id, task)
    return task
  }

  updateTask(id: string, data: any): any {
    const task = this.getOne('task', id)
    if (task) {
      const updated = { ...task, ...data }
      this.save('task', id, updated)
      return updated
    }
    return null
  }

  deleteTask(id: string): void {
    // Also delete associated votes
    const votes = this.getAll('vote')
    votes.forEach(vote => {
      if (vote.task_id === id) {
        this.delete('vote', vote.id)
      }
    })
    this.delete('task', id)
  }

  // Votes
  getVotes(taskId: string): any[] {
    const votes = this.getAll('vote')
    return votes.filter(v => v.task_id === taskId)
  }

  createVote(data: any): any {
    const id = this.generateId()
    const vote = {
      id,
      task_id: data.task_id,
      participant_id: data.participant_id,
      value: data.value,
      factors: data.factors || null,
      created_at: new Date().toISOString()
    }
    this.save('vote', id, vote)
    return vote
  }

  updateVote(id: string, data: any): any {
    const vote = this.getOne('vote', id)
    if (vote) {
      const updated = { ...vote, ...data }
      this.save('vote', id, updated)
      return updated
    }
    return null
  }

  deleteVote(id: string): void {
    this.delete('vote', id)
  }

  // Get a specific vote by participant and task
  getVoteByParticipantAndTask(participantId: string, taskId: string): any | null {
    const votes = this.getAll('vote')
    return votes.find(v => v.participant_id === participantId && v.task_id === taskId) || null
  }
}

export const demoStorage = new DemoStorage()

