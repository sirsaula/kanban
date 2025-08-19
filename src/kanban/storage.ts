import type { BoardState } from './types'

const STORAGE_KEY = 'personal-kanban-state-v1'

export function loadBoardState(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BoardState
    return parsed
  } catch {
    return null
  }
}

export function saveBoardState(state: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

