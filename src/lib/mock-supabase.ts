// Mock Supabase client for demo mode
import { demoStorage } from './demo-storage'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StorageRecord = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void

// Event emitter for simulating real-time subscriptions
class EventEmitter {
  private listeners: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  emit(event: string, data: StorageRecord) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event) || []
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
}

const globalEmitter = new EventEmitter()

class MockSupabaseQuery {
  private tableName: string
  private selectFields: string = '*'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private filters: Array<{ column: string; operator: string; value: any }> = []
  private orderField?: string
  private orderAscending: boolean = true
  private limitValue?: number

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(fields: string = '*') {
    this.selectFields = fields
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  in(column: string, values: any[]) {
    this.filters.push({ column, operator: 'in', value: values })
    return this
  }

  order(field: string, options: { ascending?: boolean } = {}) {
    this.orderField = field
    this.orderAscending = options.ascending !== false
    return this
  }

  limit(count: number) {
    this.limitValue = count
    return this
  }

  private applyFilters(items: StorageRecord[]): StorageRecord[] {
    return items.filter(item => {
      return this.filters.every(filter => {
        if (filter.operator === 'eq') {
          return item[filter.column] === filter.value
        }
        if (filter.operator === 'in') {
          return filter.value.includes(item[filter.column])
        }
        return true
      })
    })
  }

  private applyOrder(items: StorageRecord[]): StorageRecord[] {
    if (!this.orderField) return items

    return [...items].sort((a, b) => {
      const aVal = a[this.orderField!]
      const bVal = b[this.orderField!]
      
      if (aVal < bVal) return this.orderAscending ? -1 : 1
      if (aVal > bVal) return this.orderAscending ? 1 : -1
      return 0
    })
  }

  async single() {
    const result = await this.execute()
    if (result.error) return result
    
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: 'No data found' } }
    }
    
    return { data: result.data[0], error: null }
  }

  async execute() {
    try {
      let data: StorageRecord[] = []

      // Get data based on table
      if (this.tableName === 'sessions') {
        data = this.filters.some(f => f.column === 'code')
          ? [demoStorage.getSession(this.filters.find(f => f.column === 'code')!.value)].filter(Boolean) as StorageRecord[]
          : []
      } else if (this.tableName === 'participants') {
        const sessionIdFilter = this.filters.find(f => f.column === 'session_id')
        if (sessionIdFilter) {
          data = demoStorage.getParticipants(sessionIdFilter.value as string)
        }
      } else if (this.tableName === 'tasks') {
        const sessionIdFilter = this.filters.find(f => f.column === 'session_id')
        if (sessionIdFilter) {
          data = demoStorage.getTasks(sessionIdFilter.value as string)
        }
      } else if (this.tableName === 'votes') {
        const taskIdFilter = this.filters.find(f => f.column === 'task_id')
        if (taskIdFilter) {
          data = demoStorage.getVotes(taskIdFilter.value as string)
        }
      }

      // Apply filters
      data = this.applyFilters(data)

      // Apply ordering
      data = this.applyOrder(data)

      // Apply limit
      if (this.limitValue) {
        data = data.slice(0, this.limitValue)
      }

      return { data, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: { message: errorMessage } }
    }
  }

  // Make this class thenable so it can be awaited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject)
  }
}

class MockSupabaseTable {
  constructor(private tableName: string) {}

  select(fields: string = '*') {
    return new MockSupabaseQuery(this.tableName).select(fields)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async insert(data: any) {
    try {
      let result: StorageRecord | undefined

      if (this.tableName === 'sessions') {
        result = demoStorage.createSession(data)
      } else if (this.tableName === 'participants') {
        result = demoStorage.createParticipant(data)
      } else if (this.tableName === 'tasks') {
        result = demoStorage.createTask(data)
      } else if (this.tableName === 'votes') {
        result = demoStorage.createVote(data)
      }

      // Emit change event
      if (result) {
        globalEmitter.emit(`${this.tableName}-INSERT`, result)
      }

      return {
        data: result,
        error: null,
        select: () => ({
          single: async () => ({ data: result, error: null })
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { data: null, error: { message: errorMessage } }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async update(data: any) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eq: (column: string, value: any) => ({
        execute: async () => {
          try {
            let result: StorageRecord | null = null

            if (this.tableName === 'sessions') {
              result = demoStorage.updateSession(value as string, data)
            } else if (this.tableName === 'participants') {
              result = demoStorage.updateParticipant(value as string, data)
            } else if (this.tableName === 'tasks') {
              result = demoStorage.updateTask(value as string, data)
            } else if (this.tableName === 'votes') {
              result = demoStorage.updateVote(value as string, data)
            }

            // Emit change event
            if (result) {
              globalEmitter.emit(`${this.tableName}-UPDATE`, result)
            }

            return { data: result, error: null }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return { data: null, error: { message: errorMessage } }
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: function(resolve: (value: any) => any, reject?: (reason: any) => any) {
          return this.execute().then(resolve, reject)
        }
      })
    }
  }

  async delete() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eq: (column: string, value: any) => ({
        execute: async () => {
          try {
            if (this.tableName === 'participants') {
              demoStorage.deleteParticipant(value as string)
            } else if (this.tableName === 'tasks') {
              demoStorage.deleteTask(value as string)
            } else if (this.tableName === 'votes') {
              demoStorage.deleteVote(value as string)
            }

            // Emit change event
            globalEmitter.emit(`${this.tableName}-DELETE`, { id: value })

            return { error: null }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            return { error: { message: errorMessage } }
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        then: function(resolve: (value: any) => any, reject?: (reason: any) => any) {
          return this.execute().then(resolve, reject)
        }
      })
    }
  }
}

class MockSupabaseChannel {
  private channelName: string
  private callbacks: Array<{ event: string; callback: EventCallback }> = []

  constructor(channelName: string) {
    this.channelName = channelName
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, config: any, callback: EventCallback) {
    // Extract table name from config
    const tableName = config.table as string
    const eventType = config.event as string // '*' or specific type

    // Listen to global events
    const handler: EventCallback = (data: StorageRecord) => {
      callback({
        eventType: event,
        new: data,
        old: {},
        schema: 'public',
        table: tableName
      })
    }

    // Register for all event types or specific ones
    if (eventType === '*') {
      globalEmitter.on(`${tableName}-INSERT`, handler)
      globalEmitter.on(`${tableName}-UPDATE`, handler)
      globalEmitter.on(`${tableName}-DELETE`, handler)
    } else {
      globalEmitter.on(`${tableName}-${eventType.toUpperCase()}`, handler)
    }

    this.callbacks.push({ event: `${tableName}-${eventType}`, callback: handler })

    return this
  }

  subscribe(callback?: (status: string) => void) {
    // Simulate async subscription
    setTimeout(() => {
      if (callback) {
        callback('SUBSCRIBED')
      }
    }, 100)
    return this
  }

  unsubscribe() {
    // Clean up listeners
    this.callbacks.forEach(({ event, callback }) => {
      const [table, eventType] = event.split('-')
      if (eventType === '*') {
        globalEmitter.off(`${table}-INSERT`, callback)
        globalEmitter.off(`${table}-UPDATE`, callback)
        globalEmitter.off(`${table}-DELETE`, callback)
      } else {
        globalEmitter.off(event, callback)
      }
    })
    this.callbacks = []
  }
}

export class MockSupabaseClient {
  from(tableName: string) {
    return new MockSupabaseTable(tableName)
  }

  channel(channelName: string) {
    return new MockSupabaseChannel(channelName)
  }
}

export const mockSupabase = new MockSupabaseClient()

