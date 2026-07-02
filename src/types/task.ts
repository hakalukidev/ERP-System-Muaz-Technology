import type { Timestamp } from 'firebase/firestore'

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string // user UID
  assignedBy: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  deadline: Timestamp
  reminder: boolean
  reminderTime?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  attachments?: string[] // Firebase Storage URLs
}

