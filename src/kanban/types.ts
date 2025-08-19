export type ColumnId = 'todo' | 'inprogress' | 'done'

export interface TaskItem {
  id: string
  title: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface BoardState {
  columns: Record<ColumnId, TaskItem[]>
  filter: string
  history: string[]
}

