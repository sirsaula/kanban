import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { BoardState, ColumnId, TaskItem } from './types'
import { loadBoardState, saveBoardState } from './storage'

type Action =
  | { type: 'add'; columnId: ColumnId; title: string; description?: string }
  | { type: 'editTitle'; taskId: string; title: string }
  | { type: 'delete'; taskId: string }
  | { type: 'move'; taskId: string; toColumn: ColumnId; toIndex: number }
  | { type: 'reorder'; columnId: ColumnId; fromIndex: number; toIndex: number }
  | { type: 'filter'; value: string }

interface BoardContextValue {
  state: BoardState
  dispatch: React.Dispatch<Action>
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined)

function createInitialState(): BoardState {
  const stored = loadBoardState()
  if (stored) return stored
  return {
    columns: {
      todo: [],
      inprogress: [],
      done: [],
    },
    filter: '',
    history: [],
  }
}

function addHistory(history: string[], entry: string): string[] {
  const next = [entry, ...history]
  return next.slice(0, 5)
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'add': {
      const now = Date.now()
      const newTask: TaskItem = {
        id: Math.random().toString(36).slice(2),
        title: action.title.trim(),
        description: action.description?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      }
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.columnId]: [newTask, ...state.columns[action.columnId]],
        },
        history: addHistory(state.history, `Added: ${newTask.title}`),
      }
    }
    case 'editTitle': {
      const columns = { ...state.columns }
      for (const key of Object.keys(columns) as ColumnId[]) {
        const idx = columns[key].findIndex(t => t.id === action.taskId)
        if (idx !== -1) {
          const updated: TaskItem = {
            ...columns[key][idx],
            title: action.title,
            updatedAt: Date.now(),
          }
          columns[key] = [...columns[key]]
          columns[key][idx] = updated
          return {
            ...state,
            columns,
            history: addHistory(state.history, `Renamed: ${updated.title}`),
          }
        }
      }
      return state
    }
    case 'delete': {
      const columns = { ...state.columns }
      for (const key of Object.keys(columns) as ColumnId[]) {
        const idx = columns[key].findIndex(t => t.id === action.taskId)
        if (idx !== -1) {
          const [removed] = columns[key].splice(idx, 1)
          columns[key] = [...columns[key]]
          return {
            ...state,
            columns,
            history: addHistory(state.history, `Deleted: ${removed.title}`),
          }
        }
      }
      return state
    }
    case 'move': {
      const fromKey = (Object.keys(state.columns) as ColumnId[]).find(k =>
        state.columns[k].some(t => t.id === action.taskId),
      )
      if (!fromKey) return state
      if (!state.columns[fromKey]) return state
      const fromIndex = state.columns[fromKey].findIndex(t => t.id === action.taskId)
      if (fromIndex === -1) return state
      const task = state.columns[fromKey][fromIndex]

      const newFrom = [...state.columns[fromKey]]
      newFrom.splice(fromIndex, 1)

      const newTo = [...state.columns[action.toColumn]]
      const clampedIndex = Math.max(0, Math.min(action.toIndex, newTo.length))
      newTo.splice(clampedIndex, 0, { ...task, updatedAt: Date.now() })

      return {
        ...state,
        columns: {
          ...state.columns,
          [fromKey]: newFrom,
          [action.toColumn]: newTo,
        },
        history: addHistory(state.history, `Moved: ${task.title}`),
      }
    }
    case 'reorder': {
      const list = [...state.columns[action.columnId]]
      const [moved] = list.splice(action.fromIndex, 1)
      list.splice(action.toIndex, 0, moved)
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.columnId]: list,
        },
        history: addHistory(state.history, `Reordered in ${action.columnId}`),
      }
    }
    case 'filter':
      return { ...state, filter: action.value }
    default:
      return state
  }
}

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  useEffect(() => {
    saveBoardState(state)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoard() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoard must be used within BoardProvider')
  return ctx
}

